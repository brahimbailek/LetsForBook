import type { PrismaClient } from '@letsforbook/database';
import { TRPCError } from '@trpc/server';
import { addMinutes } from 'date-fns';
import { availabilityService } from './availability.service';

interface CreateBookingInput {
  userId: string;
  professionalId?: string;
  salonId: string;
  serviceIds: string[];
  startTime: Date;
  clientNotes?: string;
}

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(
    prisma: PrismaClient,
    input: CreateBookingInput
  ): Promise<any> {
    const { userId, professionalId, salonId, serviceIds, startTime, clientNotes } = input;

    // 1. Get client profile
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!clientProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client profile not found',
      });
    }

    // 2. Resolve professional (auto-assign if "Peu importe")
    let resolvedProfessionalId = professionalId;

    if (!resolvedProfessionalId) {
      // Find all professionals in this salon who offer the requested services
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

      // Filter to only professionals who offer ALL requested services
      const eligiblePros = professionalsWithServices.filter(
        (pro) => pro.services.length === serviceIds.length
      );

      if (eligiblePros.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Aucun professionnel disponible pour ces services',
        });
      }

      // Calculate total duration for availability check
      const servicesForDuration = await prisma.service.findMany({
        where: { id: { in: serviceIds }, active: true },
      });
      const totalDuration = servicesForDuration.reduce(
        (sum, s) => sum + s.durationMinutes, 0
      );
      const endTimeForCheck = addMinutes(startTime, totalDuration);

      // Check availability for each eligible professional
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

      // Randomly pick one from available professionals
      const randomIndex = Math.floor(Math.random() * availablePros.length);
      resolvedProfessionalId = availablePros[randomIndex]!.id;
    }

    // 3. Get professional and salon info
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

    // 4. Get services and calculate duration + price
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

    // 5. Check if slot is available
    const isAvailable = await availabilityService.isSlotAvailable(
      prisma,
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

    // 6. Create appointment with services
    const appointment = await prisma.appointment.create({
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

    return appointment;
  }

  /**
   * Get user bookings (client side)
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
   * Get booking by ID
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
   * Cancel booking (client side)
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
   * Accept booking (professional side)
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
   * Reject booking (professional side)
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
   * Get professional bookings (for calendar view)
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
   * Mark booking as completed
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
   * Mark booking as no-show
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
   * Update booking
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

    // If updating start time, recalculate end time
    let endTime = appointment.endTime;
    if (data.startTime) {
      const totalDuration = appointment.services.reduce(
        (sum, service) => sum + service.duration,
        0
      );
      endTime = addMinutes(data.startTime, totalDuration);

      // Check if new slot is available
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
