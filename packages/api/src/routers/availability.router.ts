/**
 * Router de disponibilité (availability)
 *
 * Endpoints publics :
 *   - getSlots                           : Créneaux disponibles pour une date/salon/service
 *                                          Deux modes : "Peu importe" (agrégation multi-pro) ou pro spécifique
 *   - getProfessionalWeeklyAvailability  : Horaires hebdomadaires d'un pro (lun-dim)
 *   - getExceptions                      : Exceptions de disponibilité (congés, jours fériés, horaires spéciaux)
 *
 * Endpoints professionnels (authentifiés) :
 *   - updateAvailability      : Modifier les horaires d'un jour de la semaine
 *   - batchUpdateAvailability : Modifier tous les jours d'un coup
 *   - createException         : Créer une exception (congé, maladie, horaires spéciaux)
 *   - updateException         : Modifier une exception
 *   - deleteException         : Supprimer une exception
 *   - getMyAvailability       : Mes horaires (dashboard pro)
 *   - getMyExceptions         : Mes exceptions (dashboard pro)
 */
import { z } from 'zod';
import { router, professionalProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { availabilityService } from '../services/availability.service';
import {
  updateAvailabilitySchema,
  createAvailabilityExceptionSchema,
} from '@letsforbook/validation';

export const availabilityRouter = router({
  /**
   * Récupère les créneaux disponibles pour une date, un salon, et optionnellement un pro/service.
   *
   * Deux modes de fonctionnement :
   *   1. Mode "Peu importe" (pas de professionalId + serviceId fourni) :
   *      → Trouve tous les pros proposant ce service
   *      → Appelle availabilityService.getAvailableSlots() pour chacun
   *      → Agrège : un créneau est "available" si AU MOINS un pro l'a disponible
   *
   *   2. Mode "Pro spécifique" (professionalId fourni) :
   *      → Génère des créneaux de 30 min entre 9h-19h
   *      → Vérifie les conflits avec les RDV existants
   *      → Exclut les créneaux passés pour aujourd'hui
   *
   * PUBLIC — pas d'authentification requise.
   */
  getSlots: publicProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        professionalId: z.string().cuid().optional(),
        serviceId: z.string().cuid().optional(),
        date: z.string(), // YYYY-MM-DD format
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, professionalId, serviceId, date } = input;

      // --- Mode "Peu importe" : agrégation des dispos de tous les pros ---
      if (!professionalId && serviceId) {
        // Trouver tous les pros actifs du salon qui proposent ce service
        const prosForService = await ctx.prisma.professionalService.findMany({
          where: {
            serviceId,
            active: true,
            professional: {
              salonId,
              active: true,
              acceptsOnlineBookings: true,
            },
          },
          select: { professionalId: true },
        });

        if (prosForService.length === 0) {
          return [];
        }

        // Récupérer les créneaux de chaque pro via le service de disponibilité
        const allSlotsArrays = await Promise.all(
          prosForService.map((ps) =>
            availabilityService.getAvailableSlots(
              ctx.prisma,
              ps.professionalId,
              [serviceId],
              new Date(date)
            )
          )
        );

        // Fusionner : un créneau est "available" si AU MOINS un pro l'a disponible
        const slotMap = new Map<string, boolean>();
        for (const proSlots of allSlotsArrays) {
          for (const slot of proSlots) {
            const timeKey = `${slot.startTime.getHours().toString().padStart(2, '0')}:${slot.startTime.getMinutes().toString().padStart(2, '0')}`;
            if (slot.available) {
              slotMap.set(timeKey, true);
            } else if (!slotMap.has(timeKey)) {
              slotMap.set(timeKey, false);
            }
          }
        }

        // Trier par heure et retourner au format { time: "HH:MM", available: boolean }
        return Array.from(slotMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, available]) => ({ time, available }));
      }

      // --- Mode "Pro spécifique" : génération simplifiée de créneaux ---
      const slots = [];
      const startHour = 9;   // Début journée par défaut
      const endHour = 19;    // Fin journée par défaut
      const slotDuration = 30; // Intervalle de 30 minutes entre les créneaux

      // Récupérer la durée réelle du service si fourni (sinon 30 min par défaut)
      let serviceDuration = slotDuration;
      if (serviceId) {
        const service = await ctx.prisma.service.findUnique({
          where: { id: serviceId },
          select: { durationMinutes: true },
        });
        if (service) {
          serviceDuration = service.durationMinutes;
        }
      }

      // Récupérer les RDV existants pour cette date (hors annulés)
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const existingAppointments = await ctx.prisma.appointment.findMany({
        where: {
          salonId,
          ...(professionalId ? { professionalId } : {}),
          startTime: { gte: dateStart, lte: dateEnd },
          status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      // Générer les créneaux et vérifier les conflits avec les RDV existants
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Vérifier si ce créneau chevauche un RDV existant
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

          const isAvailable = !existingAppointments.some((apt) => {
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            return slotStart < aptEnd && slotEnd > aptStart;
          });

          // Exclure les créneaux passés pour aujourd'hui
          const now = new Date();
          const isPast = slotStart < now;

          slots.push({
            time: slotTime,
            available: isAvailable && !isPast,
          });
        }
      }

      return slots;
    }),

  /**
   * Récupère les horaires hebdomadaires d'un professionnel (lundi → dimanche).
   * PUBLIC — utilisé par la page salon et la page de réservation.
   */
  getProfessionalWeeklyAvailability: publicProcedure
    .input(z.object({ professionalId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const availability = await availabilityService.getProfessionalWeeklyAvailability(
        ctx.prisma,
        input.professionalId
      );

      return availability;
    }),

  /**
   * Met à jour les horaires d'un jour de la semaine pour le pro connecté.
   * Si aucune entrée n'existe pour ce jour → création (startTime et endTime requis).
   * Si elle existe déjà → mise à jour partielle.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  updateAvailability: professionalProcedure
    .input(updateAvailabilitySchema)
    .mutation(async ({ ctx, input }) => {
      const { dayOfWeek, ...data } = input;

      // Get professional profile
      const professionalProfile = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!professionalProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Professional profile not found',
        });
      }

      // Check if availability exists
      const existing = await ctx.prisma.professionalAvailability.findUnique({
        where: {
          professionalId_dayOfWeek: {
            professionalId: professionalProfile.id,
            dayOfWeek: dayOfWeek as any,
          },
        },
      });

      if (existing) {
        // Update existing
        const availability = await ctx.prisma.professionalAvailability.update({
          where: {
            professionalId_dayOfWeek: {
              professionalId: professionalProfile.id,
              dayOfWeek: dayOfWeek as any,
            },
          },
          data,
        });
        return availability;
      } else {
        // Create new - require startTime and endTime
        if (!data.startTime || !data.endTime) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'startTime and endTime are required when creating availability',
          });
        }

        const availability = await ctx.prisma.professionalAvailability.create({
          data: {
            professionalId: professionalProfile.id,
            dayOfWeek: dayOfWeek as any,
            startTime: data.startTime,
            endTime: data.endTime,
            breakStartTime: data.breakStartTime,
            breakEndTime: data.breakEndTime,
            isAvailable: data.isAvailable ?? true,
          },
        });
        return availability;
      }
    }),

  /**
   * Mise à jour en lot de tous les jours de la semaine.
   * Utile pour le formulaire de configuration initiale des horaires.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  batchUpdateAvailability: professionalProcedure
    .input(
      z.object({
        availabilities: z.array(updateAvailabilitySchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get professional profile
      const professionalProfile = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!professionalProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Professional profile not found',
        });
      }

      // Update each day
      const results = await Promise.all(
        input.availabilities.map(async ({ dayOfWeek, ...data }) => {
          // Check if exists
          const existing = await ctx.prisma.professionalAvailability.findUnique({
            where: {
              professionalId_dayOfWeek: {
                professionalId: professionalProfile.id,
                dayOfWeek: dayOfWeek as any,
              },
            },
          });

          if (existing) {
            return ctx.prisma.professionalAvailability.update({
              where: {
                professionalId_dayOfWeek: {
                  professionalId: professionalProfile.id,
                  dayOfWeek: dayOfWeek as any,
                },
              },
              data,
            });
          } else {
            // Require startTime and endTime for creation
            if (!data.startTime || !data.endTime) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `startTime and endTime are required for ${dayOfWeek}`,
              });
            }

            return ctx.prisma.professionalAvailability.create({
              data: {
                professionalId: professionalProfile.id,
                dayOfWeek: dayOfWeek as any,
                startTime: data.startTime,
                endTime: data.endTime,
                breakStartTime: data.breakStartTime,
                breakEndTime: data.breakEndTime,
                isAvailable: data.isAvailable ?? true,
              },
            });
          }
        })
      );

      return results;
    }),

  /**
   * Récupère les exceptions de disponibilité d'un pro sur une plage de dates.
   * Types : UNAVAILABLE (congé, maladie) ou CUSTOM (horaires spéciaux).
   * PUBLIC — utilisé par la page de réservation.
   */
  getExceptions: publicProcedure
    .input(
      z.object({
        professionalId: z.string().cuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { professionalId, startDate, endDate } = input;

      const exceptions = await availabilityService.getAvailabilityExceptions(
        ctx.prisma,
        professionalId,
        startDate,
        endDate
      );

      return exceptions;
    }),

  /**
   * Crée une exception de disponibilité (congé, maladie, horaires spéciaux).
   * Le professionalId est automatiquement déduit de l'utilisateur connecté.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  createException: professionalProcedure
    .input(createAvailabilityExceptionSchema.omit({ professionalId: true }))
    .mutation(async ({ ctx, input }) => {
      // Get professional profile
      const professionalProfile = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!professionalProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Professional profile not found',
        });
      }

      const exception = await ctx.prisma.availabilityException.create({
        data: {
          professionalId: professionalProfile.id,
          ...input,
        },
      });

      return exception;
    }),

  /**
   * Modifie une exception existante. Vérifie que le pro est bien le propriétaire.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  updateException: professionalProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        type: z.enum(['UNAVAILABLE', 'CUSTOM']),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get exception to verify ownership
      const exception = await ctx.prisma.availabilityException.findUnique({
        where: { id },
        include: {
          professional: {
            select: { userId: true },
          },
        },
      });

      if (!exception) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Exception not found',
        });
      }

      if (exception.professional.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own availability exceptions',
        });
      }

      const updatedException = await ctx.prisma.availabilityException.update({
        where: { id },
        data,
      });

      return updatedException;
    }),

  /**
   * Supprime une exception. Vérifie que le pro est bien le propriétaire.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  deleteException: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get exception to verify ownership
      const exception = await ctx.prisma.availabilityException.findUnique({
        where: { id: input.id },
        include: {
          professional: {
            select: { userId: true },
          },
        },
      });

      if (!exception) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Exception not found',
        });
      }

      if (exception.professional.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own availability exceptions',
        });
      }

      await ctx.prisma.availabilityException.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Récupère les horaires hebdomadaires du pro connecté (pour le dashboard professionnel).
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  getMyAvailability: professionalProcedure.query(async ({ ctx }) => {
    // Get professional profile
    const professionalProfile = await ctx.prisma.professionalProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!professionalProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Professional profile not found',
      });
    }

    const availability = await ctx.prisma.professionalAvailability.findMany({
      where: { professionalId: professionalProfile.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability;
  }),

  /**
   * Récupère les exceptions du pro connecté (pour le dashboard professionnel).
   * Filtrage optionnel par plage de dates.
   * PROFESSIONNEL AUTHENTIFIÉ.
   */
  getMyExceptions: professionalProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get professional profile
      const professionalProfile = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!professionalProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Professional profile not found',
        });
      }

      const where: any = {
        professionalId: professionalProfile.id,
      };

      if (input.startDate && input.endDate) {
        where.date = {
          gte: input.startDate,
          lte: input.endDate,
        };
      }

      const exceptions = await ctx.prisma.availabilityException.findMany({
        where,
        orderBy: { date: 'asc' },
      });

      return exceptions;
    }),
});
