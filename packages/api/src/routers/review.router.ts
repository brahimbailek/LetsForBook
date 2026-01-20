import { z } from 'zod';
import { router, protectedProcedure, professionalProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createReviewSchema, respondToReviewSchema } from '@planity/validation';

export const reviewRouter = router({
  /**
   * Get reviews for a salon
   * PUBLIC
   */
  getBySalonId: publicProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        rating: z.number().int().min(1).max(5).optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, rating, limit, cursor } = input;

      const where: any = {
        salonId,
      };

      if (rating) {
        where.rating = rating;
      }

      const reviews = await ctx.prisma.review.findMany({
        where,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          appointment: {
            select: {
              id: true,
              startTime: true,
            },
          },
        },
      });

      return {
        items: reviews,
        nextCursor: reviews.length === limit ? reviews[reviews.length - 1]?.id : null,
        hasMore: reviews.length === limit,
      };
    }),

  /**
   * Get review statistics for a salon
   * PUBLIC
   */
  getSalonStats: publicProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.prisma.review.findMany({
        where: { salonId: input.salonId },
        select: { rating: true },
      });

      const stats = {
        totalReviews: reviews.length,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

        reviews.forEach((review) => {
          stats.ratingDistribution[review.rating as keyof typeof stats.ratingDistribution]++;
        });
      }

      return stats;
    }),

  /**
   * Create review
   * PROTECTED (must have completed appointment at this salon)
   */
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { appointmentId, rating, comment } = input;

      // Get client profile
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!clientProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client profile not found',
        });
      }

      // Verify appointment exists and belongs to user
      const appointment = await ctx.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          salon: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        });
      }

      if (appointment.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only review your own appointments',
        });
      }

      if (appointment.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You can only review completed appointments',
        });
      }

      // Check if review already exists
      const existingReview = await ctx.prisma.review.findUnique({
        where: { appointmentId },
      });

      if (existingReview) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already reviewed this appointment',
        });
      }

      // Create review
      const review = await ctx.prisma.review.create({
        data: {
          salonId: appointment.salonId,
          clientId: clientProfile.id,
          appointmentId,
          rating,
          comment,
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return review;
    }),

  /**
   * Update review
   * PROTECTED (must be review owner)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get review to verify ownership
      const review = await ctx.prisma.review.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own reviews',
        });
      }

      const updatedReview = await ctx.prisma.review.update({
        where: { id },
        data,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return updatedReview;
    }),

  /**
   * Delete review
   * PROTECTED (must be review owner)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get review to verify ownership
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.id },
        include: {
          client: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        });
      }

      await ctx.prisma.review.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Respond to review (salon owner)
   * PROFESSIONAL ONLY
   */
  respond: professionalProcedure
    .input(respondToReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, response } = input;

      // Get review with salon
      const review = await ctx.prisma.review.findUnique({
        where: { id },
        include: {
          salon: {
            select: {
              ownerId: true,
            },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only respond to reviews for your own salon',
        });
      }

      const updatedReview = await ctx.prisma.review.update({
        where: { id },
        data: {
          response,
          respondedAt: new Date(),
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return updatedReview;
    }),

  /**
   * Get my reviews (client side)
   * PROTECTED
   */
  getMyReviews: protectedProcedure
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

      const reviews = await ctx.prisma.review.findMany({
        where: {
          clientId: clientProfile.id,
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              city: true,
              logo: true,
            },
          },
          appointment: {
            select: {
              id: true,
              startTime: true,
            },
          },
        },
      });

      return {
        items: reviews,
        nextCursor: reviews.length === limit ? reviews[reviews.length - 1]?.id : null,
        hasMore: reviews.length === limit,
      };
    }),

  /**
   * Get reviews for my salon (professional side)
   * PROFESSIONAL ONLY
   */
  getSalonReviews: professionalProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        rating: z.number().int().min(1).max(5).optional(),
        hasResponse: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, rating, hasResponse, limit, cursor } = input;

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
          message: 'You can only view reviews for your own salon',
        });
      }

      const where: any = {
        salonId,
      };

      if (rating) {
        where.rating = rating;
      }

      if (hasResponse !== undefined) {
        where.response = hasResponse ? { not: null } : null;
      }

      const reviews = await ctx.prisma.review.findMany({
        where,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          appointment: {
            select: {
              id: true,
              startTime: true,
              services: true,
            },
          },
        },
      });

      return {
        items: reviews,
        nextCursor: reviews.length === limit ? reviews[reviews.length - 1]?.id : null,
        hasMore: reviews.length === limit,
      };
    }),
});
