import { z } from 'zod';
import { router, protectedProcedure, professionalProcedure } from '../trpc';
import { paymentService } from '../services/payment.service';
import { TRPCError } from '@trpc/server';

export const paymentRouter = router({
  /**
   * Create payment intent for appointment booking
   * PROTECTED
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await paymentService.createPaymentIntent(
        ctx.prisma,
        input.appointmentId,
        ctx.user.id
      );

      return result;
    }),

  /**
   * Get payment by appointment ID
   * PROTECTED
   */
  getByAppointmentId: protectedProcedure
    .input(z.object({ appointmentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { appointmentId: input.appointmentId },
        include: {
          appointment: {
            include: {
              client: {
                select: {
                  userId: true,
                },
              },
              professional: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      // Check authorization
      const isClient = payment.appointment.client.userId === ctx.user.id;
      const isProfessional = payment.appointment.professional.userId === ctx.user.id;

      if (!isClient && !isProfessional) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this payment',
        });
      }

      return payment;
    }),

  /**
   * Get payment by ID
   * PROTECTED
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.id },
        include: {
          appointment: {
            include: {
              client: {
                select: {
                  userId: true,
                },
              },
              professional: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      // Check authorization
      const isClient = payment.appointment.client.userId === ctx.user.id;
      const isProfessional = payment.appointment.professional.userId === ctx.user.id;

      if (!isClient && !isProfessional) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this payment',
        });
      }

      return payment;
    }),

  /**
   * Refund payment
   * PROFESSIONAL ONLY (must be the professional of the appointment)
   */
  refund: professionalProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { appointmentId, reason } = input;

      // Get appointment to verify ownership
      const appointment = await ctx.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          professional: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        });
      }

      if (appointment.professional.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only refund payments for your own appointments',
        });
      }

      await paymentService.refundPayment(ctx.prisma, appointmentId, reason);

      return { success: true };
    }),

  /**
   * Get my payments (client side)
   * PROTECTED
   */
  getMyPayments: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      // Get client profile
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!clientProfile) {
        return {
          items: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      const payments = await ctx.prisma.payment.findMany({
        where: {
          appointment: {
            clientId: clientProfile.id,
          },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          appointment: {
            include: {
              salon: true,
              services: true,
            },
          },
        },
      });

      return {
        items: payments,
        nextCursor: payments.length === limit ? payments[payments.length - 1]?.id : null,
        hasMore: payments.length === limit,
      };
    }),

  /**
   * Get salon payments (professional side)
   * PROFESSIONAL ONLY
   */
  getSalonPayments: professionalProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: z.enum(['PENDING', 'AUTHORIZED', 'PAID', 'REFUNDED', 'FAILED', 'CANCELLED']).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, startDate, endDate, status, limit, cursor } = input;

      // Verify salon ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: salonId },
        select: { ownerId: true },
      });

      if (!salon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salon not found',
        });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view payments for your own salon',
        });
      }

      const where: any = {
        appointment: {
          salonId,
        },
      };

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const payments = await ctx.prisma.payment.findMany({
        where,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          appointment: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                  lastName: true,
                      email: true,
                    },
                  },
                },
              },
              services: true,
            },
          },
        },
      });

      return {
        items: payments,
        nextCursor: payments.length === limit ? payments[payments.length - 1]?.id : null,
        hasMore: payments.length === limit,
      };
    }),

  /**
   * Get payment statistics for salon
   * PROFESSIONAL ONLY
   */
  getSalonPaymentStats: professionalProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, startDate, endDate } = input;

      // Verify salon ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: salonId },
        select: { ownerId: true },
      });

      if (!salon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salon not found',
        });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view stats for your own salon',
        });
      }

      const [payments, appointmentServices] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: {
            appointment: { salonId },
            createdAt: { gte: startDate, lte: endDate },
          },
          select: { amount: true, status: true, type: true },
        }),
        // CA réel = somme des services sur RDV COMPLETED ou CONFIRMED dans la période
        ctx.prisma.appointmentService.findMany({
          where: {
            appointment: {
              salonId,
              startTime: { gte: startDate, lte: endDate },
              status: { in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'] },
            },
          },
          select: { price: true },
        }),
      ]);

      const stats = {
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        totalRefunded: 0,
        totalFailed: 0,
        paymentCount: payments.length,
        depositCount: 0,
        fullPaymentCount: 0,
        // CA basé sur les prestations effectuées (inclut RDV manuels sans Stripe)
        totalServiceRevenue: appointmentServices.reduce((s, a) => s + a.price, 0),
      };

      payments.forEach((payment) => {
        if (payment.status === 'PAID') {
          stats.totalPaid += payment.amount;
          stats.totalRevenue += payment.amount;
        } else if (payment.status === 'PENDING' || payment.status === 'AUTHORIZED') {
          stats.totalPending += payment.amount;
        } else if (payment.status === 'REFUNDED') {
          stats.totalRefunded += payment.amount;
        } else if (payment.status === 'FAILED') {
          stats.totalFailed += payment.amount;
        }

        if (payment.type === 'DEPOSIT') {
          stats.depositCount++;
        } else if (payment.type === 'FULL_PAYMENT') {
          stats.fullPaymentCount++;
        }
      });

      return stats;
    }),
});
