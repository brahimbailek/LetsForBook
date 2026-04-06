import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  getUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  getSalonsAdminSchema,
  updateSalonAdminSchema,
  getStatsSchema,
  getReviewsAdminSchema,
  deleteReviewAdminSchema,
} from '@letsforbook/validation';

export const adminRouter = router({
  // =============================================
  // USERS
  // =============================================

  /**
   * Get paginated list of all users
   * Filterable by role and text search (email, firstName, lastName)
   * ADMIN ONLY
   */
  getUsers: adminProcedure
    .input(getUsersSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (role) {
        where.role = role;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            phone: true,
            createdAt: true,
            deletedAt: true,
            clientProfile: {
              select: {
                id: true,
                _count: {
                  select: { appointments: true },
                },
              },
            },
            professionalProfile: {
              select: {
                id: true,
                salonId: true,
                title: true,
                active: true,
              },
            },
            salonOwner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        items: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Get full details of a single user
   * Includes profiles, appointments, payments, reviews
   * ADMIN ONLY
   */
  getUserById: adminProcedure
    .input(getUserByIdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          phone: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          clientProfile: {
            include: {
              appointments: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                  salon: {
                    select: { id: true, name: true },
                  },
                  services: true,
                  payment: {
                    select: {
                      id: true,
                      amount: true,
                      currency: true,
                      status: true,
                      paidAt: true,
                    },
                  },
                },
              },
              reviews: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                  salon: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          professionalProfile: {
            include: {
              salon: {
                select: { id: true, name: true, slug: true },
              },
              services: {
                include: {
                  service: {
                    select: { id: true, name: true },
                  },
                },
              },
              appointments: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                  salon: {
                    select: { id: true, name: true },
                  },
                  services: true,
                },
              },
            },
          },
          salonOwner: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              verified: true,
              active: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur introuvable',
        });
      }

      return user;
    }),

  /**
   * Update a user (role, soft ban/unban)
   * ADMIN ONLY
   */
  updateUser: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, role, active } = input;

      // Prevent admin from modifying their own account
      if (userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous ne pouvez pas modifier votre propre compte admin',
        });
      }

      const existing = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur introuvable',
        });
      }

      const data: any = {};

      if (role !== undefined) {
        data.role = role;
      }

      if (active !== undefined) {
        data.deletedAt = active ? null : new Date();
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          deletedAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),

  // =============================================
  // SALONS
  // =============================================

  /**
   * Get paginated list of all salons
   * With owner info, pro count, appointment count, status
   * ADMIN ONLY
   */
  getSalons: adminProcedure
    .input(getSalonsAdminSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, search, published } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (published !== undefined) {
        where.published = published;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [salons, total] = await Promise.all([
        ctx.prisma.salon.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            email: true,
            phone: true,
            published: true,
            verified: true,
            active: true,
            createdAt: true,
            deletedAt: true,
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                professionals: true,
                appointments: true,
                reviews: true,
              },
            },
          },
        }),
        ctx.prisma.salon.count({ where }),
      ]);

      return {
        items: salons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Update salon status (publish, verify, activate/deactivate)
   * ADMIN ONLY
   */
  updateSalon: adminProcedure
    .input(updateSalonAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { salonId, published, verified, active } = input;

      const existing = await ctx.prisma.salon.findUnique({
        where: { id: salonId },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salon introuvable',
        });
      }

      const data: any = {};

      if (published !== undefined) data.published = published;
      if (verified !== undefined) data.verified = verified;
      if (active !== undefined) {
        data.active = active;
        data.deletedAt = active ? null : new Date();
      }

      const updatedSalon = await ctx.prisma.salon.update({
        where: { id: salonId },
        data,
        select: {
          id: true,
          name: true,
          slug: true,
          published: true,
          verified: true,
          active: true,
          deletedAt: true,
          updatedAt: true,
        },
      });

      return updatedSalon;
    }),

  // =============================================
  // STATS
  // =============================================

  /**
   * Get global platform statistics
   * Users by role, salons by status, appointments by status, revenue, new signups
   * ADMIN ONLY
   */
  getStats: adminProcedure
    .input(getStatsSchema)
    .query(async ({ ctx, input }) => {
      const { period } = input;

      // Calculate date range
      let dateFrom: Date | undefined;
      if (period !== 'all') {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
      }

      const dateFilter = dateFrom ? { gte: dateFrom } : undefined;

      // Run all queries in parallel
      const [
        totalUsers,
        usersByRole,
        newUsers,
        totalSalons,
        publishedSalons,
        unpublishedSalons,
        totalAppointments,
        appointmentsByStatus,
        totalRevenue,
      ] = await Promise.all([
        // Total users
        ctx.prisma.user.count(),

        // Users grouped by role
        ctx.prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        }),

        // New users in period
        ctx.prisma.user.count({
          where: dateFilter ? { createdAt: dateFilter } : undefined,
        }),

        // Total salons
        ctx.prisma.salon.count(),

        // Published salons
        ctx.prisma.salon.count({ where: { published: true } }),

        // Unpublished salons
        ctx.prisma.salon.count({ where: { published: false } }),

        // Total appointments
        ctx.prisma.appointment.count(),

        // Appointments grouped by status
        ctx.prisma.appointment.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // Total revenue (paid payments)
        ctx.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID' },
        }),
      ]);

      // Format users by role
      const usersBreakdown: Record<string, number> = {};
      for (const group of usersByRole) {
        usersBreakdown[group.role] = group._count.id;
      }

      // Format appointments by status
      const appointmentsBreakdown: Record<string, number> = {};
      for (const group of appointmentsByStatus) {
        appointmentsBreakdown[group.status] = group._count.id;
      }

      return {
        users: {
          total: totalUsers,
          byRole: usersBreakdown,
          newInPeriod: newUsers,
        },
        salons: {
          total: totalSalons,
          published: publishedSalons,
          unpublished: unpublishedSalons,
        },
        appointments: {
          total: totalAppointments,
          byStatus: appointmentsBreakdown,
        },
        revenue: {
          totalCents: totalRevenue._sum.amount ?? 0,
          currency: 'EUR',
        },
        period,
      };
    }),

  // =============================================
  // REVIEWS (moderation)
  // =============================================

  /**
   * Get all reviews for moderation
   * Sorted by date, filterable by published status
   * ADMIN ONLY
   */
  getReviews: adminProcedure
    .input(getReviewsAdminSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, published } = input;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (published !== undefined) {
        where.published = published;
      }

      const [reviews, total] = await Promise.all([
        ctx.prisma.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
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
            salon: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            appointment: {
              select: {
                id: true,
                startTime: true,
              },
            },
          },
        }),
        ctx.prisma.review.count({ where }),
      ]);

      return {
        items: reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Delete a review (moderation)
   * ADMIN ONLY
   */
  deleteReview: adminProcedure
    .input(deleteReviewAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { id: true },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Avis introuvable',
        });
      }

      await ctx.prisma.review.delete({
        where: { id: input.reviewId },
      });

      return { success: true };
    }),
});
