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
   * Get available time slots for a given date, salon, and optionally professional/service
   * PUBLIC
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

      // "Peu importe" mode: aggregate real availability across all professionals
      if (!professionalId && serviceId) {
        // Find all professionals offering this service
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

        // Get slots for each professional using the real availability service
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

        // Merge: a time slot is "available" if ANY professional has it available
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

        // Sort and return
        return Array.from(slotMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, available]) => ({ time, available }));
      }

      // Specific professional mode: use simplified slot generation
      const slots = [];
      const startHour = 9;
      const endHour = 19;
      const slotDuration = 30; // 30 minutes slots

      // Get service duration if provided
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

      // Get existing appointments for the date
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

      // Generate time slots
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Check if this slot conflicts with existing appointments
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

          const isAvailable = !existingAppointments.some((apt) => {
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            return slotStart < aptEnd && slotEnd > aptStart;
          });

          // Don't show past time slots for today
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
   * Get professional's weekly availability
   * PUBLIC
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
   * Update professional availability for a day
   * PROFESSIONAL ONLY
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
   * Batch update all weekly availability
   * PROFESSIONAL ONLY
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
   * Get availability exceptions
   * PUBLIC
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
   * Create availability exception (holiday, sick day, special hours)
   * PROFESSIONAL ONLY
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
   * Update availability exception
   * PROFESSIONAL ONLY
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
   * Delete availability exception
   * PROFESSIONAL ONLY
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
   * Get my availability (for professional dashboard)
   * PROFESSIONAL ONLY
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
   * Get my exceptions (for professional dashboard)
   * PROFESSIONAL ONLY
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
