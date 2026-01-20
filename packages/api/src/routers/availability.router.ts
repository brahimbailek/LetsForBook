import { z } from 'zod';
import { router, professionalProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { availabilityService } from '../services/availability.service';
import {
  updateAvailabilitySchema,
  createAvailabilityExceptionSchema,
} from '@planity/validation';

export const availabilityRouter = router({
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
