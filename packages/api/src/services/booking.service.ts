/**
 * Service de réservation (BookingService)
 *
 * Gère toute la logique métier des rendez-vous côté backend :
 *
 * - createBooking()            : Crée un RDV (avec auto-assignation "Peu importe" si pas de pro spécifié)
 * - getUserBookings()          : Liste les RDV d'un client (upcoming / past / all) avec pagination par curseur
 * - getBookingById()           : Récupère un RDV par ID avec toutes les relations
 * - cancelBooking()            : Annulation côté client (statut → CANCELLED_CLIENT)
 * - acceptBooking()            : Acceptation côté pro (statut PENDING → CONFIRMED)
 * - rejectBooking()            : Rejet côté pro (statut → CANCELLED_SALON)
 * - getProfessionalBookings()  : Liste les RDV d'un pro pour la vue calendrier
 * - markBookingCompleted()     : Marque un RDV comme terminé (CONFIRMED/IN_PROGRESS → COMPLETED)
 * - markBookingNoShow()        : Marque un RDV comme absent (CONFIRMED → NO_SHOW)
 * - updateBooking()            : Modification côté client (changement d'horaire, notes)
 *
 * Les prix sont stockés en centimes dans la base de données.
 */
import type { PrismaClient } from '@letsforbook/database';
import { TRPCError } from '@trpc/server';
import { addMinutes } from 'date-fns';
import { availabilityService } from './availability.service';

/** Données d'entrée pour créer une réservation */
interface CreateBookingInput {
  userId: string;
  professionalId?: string; // Optionnel : si absent → mode "Peu importe" (auto-assignation aléatoire)
  salonId: string;         // Requis pour identifier le salon (nécessaire à l'auto-assignation)
  serviceIds: string[];    // Au moins 1 service requis
  startTime: Date;
  clientNotes?: string;
}

export class BookingService {
  /**
   * Crée une nouvelle réservation.
   *
   * Flow :
   *   1. Récupère le profil client via userId
   *   2. Résout le professionnel :
   *      - Si professionalId fourni → utilise directement ce pro
   *      - Si absent ("Peu importe") → cherche tous les pros du salon qui proposent
   *        TOUS les services demandés, vérifie leur disponibilité sur le créneau,
   *        et en choisit un au hasard parmi les disponibles
   *   3. Vérifie que le pro appartient bien au salon demandé
   *   4. Récupère les services et calcule durée totale + prix total
   *      (utilise les prix/durées personnalisés du pro via ProfessionalService si définis)
   *   5. Vérifie la disponibilité du créneau final
   *   6. Crée le RDV en base avec statut CONFIRMED et les services associés
   */
  async createBooking(
    prisma: PrismaClient,
    input: CreateBookingInput
  ): Promise<any> {
    const { userId, professionalId, salonId, serviceIds, startTime, clientNotes } = input;

    // 1. Récupérer le profil client
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client profile not found',
      });
    }

    // 2. Résoudre le professionnel — auto-assignation si "Peu importe"
    let resolvedProfessionalId = professionalId;

    if (!resolvedProfessionalId) {
      // Mode "Peu importe" : trouver tous les pros du salon proposant les services demandés
      const professionalsWithServices = await prisma.professionalProfile.findMany({
        where: {
          salonId,
          active: true,
          acceptsOnlineBookings: true,
          services: {
            some: {
              serviceId: { in: serviceIds },
              active: true,
            },
          },
        },
        include: {
          services: {
            where: {
              serviceId: { in: serviceIds },
              active: true,
            },
          },
        },
      });

      // Ne garder que les pros qui proposent TOUS les services demandés (pas juste un)
      const eligiblePros = professionalsWithServices.filter(
        (pro) => pro.services.length === serviceIds.length
      );

      if (eligiblePros.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Aucun professionnel disponible pour ces services',
        });
      }

      // Calculer la durée totale pour vérifier la disponibilité du créneau
      const servicesForDuration = await prisma.service.findMany({
        where: { id: { in: serviceIds }, active: true },
      });
      const totalDuration = servicesForDuration.reduce(
        (sum, s) => sum + s.durationMinutes, 0
      );
      const endTimeForCheck = addMinutes(startTime, totalDuration);

      // Vérifier la disponibilité de chaque pro éligible sur le créneau demandé
      const availablePros: typeof eligiblePros = [];
      for (const pro of eligiblePros) {
        const isAvailable = await availabilityService.isSlotAvailable(
          prisma,
          pro.id,
          startTime,
          endTimeForCheck
        );
        if (isAvailable) {
          availablePros.push(pro);
        }
      }

      if (availablePros.length === 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Aucun professionnel disponible pour ce créneau',
        });
      }

      // Choisir aléatoirement parmi les pros disponibles
      const randomIndex = Math.floor(Math.random() * availablePros.length);
      resolvedProfessionalId = availablePros[randomIndex]!.id;
    }

    // 3. Récupérer les infos du pro et vérifier qu'il appartient au salon
    const professional = await prisma.professionalProfile.findUnique({
      where: { id: resolvedProfessionalId },
      include: {
        salon: true,
      },
    });

    if (!professional) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Professional not found',
      });
    }

    if (professional.salonId !== salonId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Professional does not belong to this salon',
      });
    }

    // 4. Récupérer les services et calculer durée + prix total
    //    Utilise les prix/durées personnalisés du pro (ProfessionalService) si définis
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId: professional.salonId,
        active: true,
      },
      include: {
        professionals: {
          where: {
            professionalId: resolvedProfessionalId,
            active: true,
          },
        },
      },
    });

    if (services.length !== serviceIds.length) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Some services are not available',
      });
    }

    let totalDuration = 0;
    let totalPrice = 0;

    const appointmentServices = services.map((service) => {
      const professionalService = service.professionals[0];
      const duration =
        professionalService?.customDurationMinutes || service.durationMinutes;
      const price = professionalService?.customPrice || service.price;

      totalDuration += duration;
      totalPrice += price;

      return {
        serviceId: service.id,
        serviceName: service.name,
        price,
        duration,
      };
    });

    const endTime = addMinutes(startTime, totalDuration);

    // 5 + 6. Vérification atomique + création du RDV dans une transaction interactive.
    //   Le SELECT FOR UPDATE verrouille les RDV chevauchants pour ce pro,
    //   empêchant deux réservations concurrentes sur le même créneau.
    const appointment = await prisma.$transaction(async (tx) => {
      // 5. Vérifier que le créneau est encore disponible (avec verrou FOR UPDATE)
      const isAvailable = await availabilityService.isSlotAvailableForUpdate(
        tx as unknown as PrismaClient,
        resolvedProfessionalId,
        startTime,
        endTime
      );

      if (!isAvailable) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This time slot is no longer available',
        });
      }

      // 6. Créer le RDV en base avec statut CONFIRMED et les services associés
      return tx.appointment.create({
        data: {
          clientId: clientProfile.id,
          professionalId: resolvedProfessionalId,
          salonId: professional.salonId,
          startTime,
          endTime,
          timezone: professional.salon.timezone,
          status: 'CONFIRMED',
          clientNotes,
          services: {
            create: appointmentServices,
          },
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
          professional: {
            include: {
              user: true,
            },
          },
          salon: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    return appointment;
  }

  /**
   * Récupère les RDV d'un client avec pagination par curseur.
   * Filtres possibles : 'upcoming' (à venir), 'past' (passés), 'all' (tous).
   */
  async getUserBookings(
    prisma: PrismaClient,
    userId: string,
    status?: 'upcoming' | 'past' | 'all',
    limit: number = 20,
    cursor?: string
  ) {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client profile not found',
      });
    }

    const now = new Date();
    let statusFilter: any = {};

    if (status === 'upcoming') {
      statusFilter = {
        startTime: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      };
    } else if (status === 'past') {
      statusFilter = {
        OR: [
          { startTime: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED_CLIENT', 'CANCELLED_SALON', 'NO_SHOW'] } },
        ],
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: clientProfile.id,
        ...statusFilter,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      take: limit,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        professional: {
          include: {
            user: true,
          },
        },
        salon: true,
        payment: true,
      },
    });

    return {
      items: appointments,
      nextCursor: appointments.length === limit ? appointments[appointments.length - 1]?.id : null,
      hasMore: appointments.length === limit,
    };
  }

  /**
   * Récupère un RDV par ID avec toutes les relations (services, pro, salon, client, paiement).
   * Lève une erreur NOT_FOUND si le RDV n'existe pas.
   */
  async getBookingById(prisma: PrismaClient, id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        professional: {
          include: {
            user: true,
          },
        },
        salon: true,
        client: {
          include: {
            user: true,
          },
        },
        payment: true,
      },
    });

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    return appointment;
  }

  /**
   * Annulation d'un RDV côté client.
   * Vérifie que le client est bien le propriétaire et que le statut est PENDING ou CONFIRMED.
   * Statut → CANCELLED_CLIENT.
   */
  async cancelBooking(
    prisma: PrismaClient,
    id: string,
    userId: string,
    reason?: string
  ) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.client.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only cancel your own bookings',
      });
    }

    if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking cannot be cancelled',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED_CLIENT',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        services: true,
        professional: {
          include: { user: true },
        },
        salon: true,
        client: {
          include: { user: true },
        },
      },
    });

    return updatedAppointment;
  }

  /**
   * Acceptation d'un RDV côté professionnel.
   * Vérifie que le pro est bien le propriétaire et que le statut est PENDING.
   * Statut PENDING → CONFIRMED.
   */
  async acceptBooking(prisma: PrismaClient, id: string, userId: string) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.professional.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only accept your own bookings',
      });
    }

    if (appointment.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking is not pending',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        services: true,
        professional: {
          include: { user: true },
        },
        salon: true,
        client: {
          include: { user: true },
        },
      },
    });

    return updatedAppointment;
  }

  /**
   * Rejet d'un RDV côté professionnel.
   * Vérifie que le pro est bien le propriétaire et que le statut est PENDING.
   * Statut → CANCELLED_SALON.
   */
  async rejectBooking(
    prisma: PrismaClient,
    id: string,
    userId: string,
    reason?: string
  ) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.professional.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only reject your own bookings',
      });
    }

    if (appointment.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking is not pending',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED_SALON',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        services: true,
        professional: {
          include: { user: true },
        },
        salon: true,
        client: {
          include: { user: true },
        },
      },
    });

    return updatedAppointment;
  }

  /**
   * Récupère les RDV d'un professionnel sur une plage de dates (pour la vue calendrier du dashboard).
   */
  async getProfessionalBookings(
    prisma: PrismaClient,
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!professionalProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Professional profile not found',
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId: professionalProfile.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        client: {
          include: {
            user: true,
          },
        },
        payment: true,
      },
    });

    return appointments;
  }

  /**
   * Marque un RDV comme terminé (côté pro).
   * Statut CONFIRMED ou IN_PROGRESS → COMPLETED.
   */
  async markBookingCompleted(prisma: PrismaClient, id: string, userId: string) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.professional.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only complete your own bookings',
      });
    }

    if (appointment.status !== 'CONFIRMED' && appointment.status !== 'IN_PROGRESS') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking cannot be marked as completed',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });

    return updatedAppointment;
  }

  /**
   * Marque un RDV comme absent / no-show (côté pro).
   * Statut CONFIRMED → NO_SHOW.
   */
  async markBookingNoShow(prisma: PrismaClient, id: string, userId: string) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.professional.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only mark your own bookings as no-show',
      });
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking cannot be marked as no-show',
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
    });

    return updatedAppointment;
  }

  /**
   * Modification d'un RDV côté client (changement d'horaire et/ou de notes).
   * Si l'horaire change, recalcule endTime et vérifie la disponibilité du nouveau créneau.
   * Seuls les RDV en statut PENDING ou CONFIRMED peuvent être modifiés.
   */
  async updateBooking(
    prisma: PrismaClient,
    id: string,
    userId: string,
    data: { startTime?: Date; clientNotes?: string }
  ) {
    const appointment = await this.getBookingById(prisma, id);

    if (appointment.client.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only update your own bookings',
      });
    }

    if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This booking cannot be updated',
      });
    }

    // Si changement d'horaire → recalculer endTime et vérifier la disponibilité
    let endTime = appointment.endTime;
    if (data.startTime) {
      const totalDuration = appointment.services.reduce(
        (sum, service) => sum + service.duration,
        0
      );
      endTime = addMinutes(data.startTime, totalDuration);

      // Vérifier que le nouveau créneau est disponible
      const isAvailable = await availabilityService.isSlotAvailable(
        prisma,
        appointment.professionalId,
        data.startTime,
        endTime
      );

      if (!isAvailable) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This time slot is no longer available',
        });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: data.startTime,
        endTime: data.startTime ? endTime : undefined,
        clientNotes: data.clientNotes,
      },
      include: {
        services: true,
        professional: {
          include: { user: true },
        },
        salon: true,
        client: {
          include: { user: true },
        },
      },
    });

    return updatedAppointment;
  }
}

export const bookingService = new BookingService();
