import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, professionalProcedure, salonOwnerProcedure } from '../trpc';
import { generateInvitationCode } from '../lib/invitation';
import { TRPCError } from '@trpc/server';
import { createSalonSchema, updateSalonSchema, searchSalonsSchema } from '@letsforbook/validation';

export const salonRouter = router({
  /**
   * Autocomplete for search queries (services, categories, salon names)
   * PUBLIC
   */
  autocomplete: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      const { query } = input;

      // Search in services
      const services = await ctx.prisma.service.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          name: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      });

      // Search in salon names
      const salons = await ctx.prisma.salon.findMany({
        where: {
          active: true,
          published: true,
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          name: true,
        },
        take: 5,
      });

      // Get unique suggestions
      const suggestions = new Set<string>();

      // Add service categories first (most relevant)
      services.forEach(s => {
        if (s.category?.name && s.category.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(s.category.name);
        }
      });

      // Add service names
      services.forEach(s => {
        if (s.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(s.name);
        }
      });

      // Add salon names
      salons.forEach(s => suggestions.add(s.name));

      return Array.from(suggestions).slice(0, 8);
    }),

  /**
   * Autocomplete for cities
   * PUBLIC
   */
  autocompleteCities: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      const { query } = input;

      const salons = await ctx.prisma.salon.findMany({
        where: {
          active: true,
          published: true,
          city: { contains: query, mode: 'insensitive' },
        },
        select: {
          city: true,
        },
        distinct: ['city'],
        take: 8,
      });

      return salons.map(s => s.city);
    }),

  /**
   * Get all salons (with pagination)
   * PUBLIC
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
        city: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, city } = input;

      const salons = await ctx.prisma.salon.findMany({
        where: {
          active: true,
          published: true,
          ...(city ? { city } : {}),
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              services: true,
              professionals: true,
              reviews: true,
            },
          },
        },
      });

      return {
        items: salons,
        nextCursor: salons.length === limit ? salons[salons.length - 1]?.id : null,
        hasMore: salons.length === limit,
      };
    }),

  /**
   * Search salons
   * PUBLIC
   */
  search: publicProcedure
    .input(searchSalonsSchema)
    .query(async ({ ctx, input }) => {
      const { query, city, categories, minRating, latitude, longitude, radius, limit, cursor } = input;

      const where: any = {
        active: true,
        published: true,
      };

      // Text search - also search in services
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { services: { some: { name: { contains: query, mode: 'insensitive' }, active: true } } },
          { services: { some: { category: { name: { contains: query, mode: 'insensitive' } }, active: true } } },
        ];
      }

      // City filter - use contains for partial matching
      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      // Categories filter - filter salons that have services in selected categories
      if (categories && categories.length > 0) {
        where.services = {
          some: {
            categoryId: { in: categories },
            active: true,
          },
        };
      }

      // Location-based search (simplified - in production use PostGIS)
      if (latitude && longitude && radius) {
        // Calculate bounding box (simplified)
        const latDelta = radius / 111; // 1 degree latitude ≈ 111 km
        const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

        where.latitude = {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        };
        where.longitude = {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        };
      }

      // Fetch more salons if minRating filter is applied (since we filter after calculating)
      const fetchLimit = minRating ? limit * 3 : limit;

      const salons = await ctx.prisma.salon.findMany({
        where,
        take: fetchLimit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          services: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              price: true,
              durationMinutes: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              professionals: true,
            },
          },
        },
      });

      // Calculate average rating
      let salonsWithRating = salons.map((salon) => {
        const totalRating = salon.reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = salon.reviews.length > 0 ? totalRating / salon.reviews.length : 0;

        return {
          ...salon,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: salon.reviews.length,
          reviews: undefined, // Remove full reviews from response
        };
      });

      // Filter by minimum rating if specified
      if (minRating) {
        salonsWithRating = salonsWithRating.filter(
          (salon) => salon.averageRating >= minRating
        );
      }

      // Limit results after filtering
      const limitedResults = salonsWithRating.slice(0, limit);

      return {
        items: limitedResults,
        nextCursor: limitedResults.length === limit ? limitedResults[limitedResults.length - 1]?.id : null,
        hasMore: salonsWithRating.length > limit,
      };
    }),

  /**
   * Get salon by ID
   * PUBLIC
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
                  lastName: true,
              avatar: true,
            },
          },
          professionals: {
            where: { active: true },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              services: {
                where: { active: true },
                include: {
                  service: true,
                },
              },
            },
          },
          services: {
            where: { active: true },
            include: {
              professionals: {
                where: { active: true },
                select: {
                  professionalId: true,
                  customPrice: true,
                  customDurationMinutes: true,
                },
              },
            },
          },
          reviews: {
            take: 10,
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
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      if (!salon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salon not found',
        });
      }

      // Calculate average rating
      const reviews = await ctx.prisma.review.findMany({
        where: { salonId: salon.id },
        select: { rating: true },
      });

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      return {
        ...salon,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    }),

  /**
   * Get salon by slug
   * PUBLIC
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const salon = await ctx.prisma.salon.findUnique({
        where: { slug: input.slug },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
                  lastName: true,
              avatar: true,
            },
          },
          professionals: {
            where: { active: true },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              services: {
                where: { active: true },
                select: { serviceId: true },
              },
            },
          },
          services: {
            where: { active: true },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          reviews: {
            take: 10,
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
            },
          },
          _count: {
            select: {
              reviews: true,
              services: true,
              professionals: true,
            },
          },
        },
      });

      if (!salon) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salon not found',
        });
      }

      // Si le salon n'est pas publié, seuls le owner et ses pros peuvent y accéder
      if (!salon.published) {
        const userId = ctx.session?.user?.id;
        const isOwner = userId && salon.ownerId === userId;
        const isPro = userId && salon.professionals?.some((p) => p.user?.id === userId);
        if (!isOwner && !isPro) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Salon not found',
          });
        }
      }

      return salon;
    }),

  /**
   * Create salon
   * PROFESSIONAL ONLY
   */
  create: professionalProcedure
    .input(createSalonSchema)
    .mutation(async ({ ctx, input }) => {
      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const salon = await ctx.prisma.salon.create({
        data: {
          ...input,
          slug,
          ownerId: ctx.user.id,
          invitationCode: generateInvitationCode(),
          published: false,
        },
      });

      return salon;
    }),

  /**
   * Update salon
   * PROFESSIONAL ONLY (must be owner)
   */
  update: professionalProcedure
    .input(updateSalonSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id },
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
          message: 'You can only update your own salon',
        });
      }

      const updatedSalon = await ctx.prisma.salon.update({
        where: { id },
        data,
      });

      return updatedSalon;
    }),

  /**
   * Delete salon
   * PROFESSIONAL ONLY (must be owner)
   */
  delete: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.id },
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
          message: 'You can only delete your own salon',
        });
      }

      // Soft delete
      await ctx.prisma.salon.update({
        where: { id: input.id },
        data: { active: false },
      });

      return { success: true };
    }),

  /**
   * Get my salons (for salon owner)
   * PROFESSIONAL ONLY
   */
  getMySalons: professionalProcedure.query(async ({ ctx }) => {
    const salons = await ctx.prisma.salon.findMany({
      where: { ownerId: ctx.user.id },
      include: {
        _count: {
          select: {
            services: true,
            professionals: true,
            appointments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return salons;
  }),

  /**
   * Toggle favorite salon
   * PROTECTED
   */
  toggleFavorite: protectedProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
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

      // Check if already favorited
      const existing = await ctx.prisma.favoriteSalon.findUnique({
        where: {
          clientId_salonId: {
            clientId: clientProfile.id,
            salonId: input.salonId,
          },
        },
      });

      if (existing) {
        // Remove favorite
        await ctx.prisma.favoriteSalon.delete({
          where: {
            clientId_salonId: {
              clientId: clientProfile.id,
              salonId: input.salonId,
            },
          },
        });
        return { favorited: false };
      } else {
        // Add favorite
        await ctx.prisma.favoriteSalon.create({
          data: {
            clientId: clientProfile.id,
            salonId: input.salonId,
          },
        });
        return { favorited: true };
      }
    }),

  /**
   * Get favorite salons
   * PROTECTED
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    // Get client profile
    const clientProfile = await ctx.prisma.clientProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!clientProfile) {
      return [];
    }

    const favorites = await ctx.prisma.favoriteSalon.findMany({
      where: { clientId: clientProfile.id },
      include: {
        salon: {
          include: {
            _count: {
              select: {
                services: true,
                professionals: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites.map((fav) => fav.salon);
  }),

  /**
   * Check if a salon is favorited
   * PROTECTED
   */
  isFavorite: protectedProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get client profile
      const clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!clientProfile) {
        return { isFavorite: false };
      }

      const favorite = await ctx.prisma.favoriteSalon.findUnique({
        where: {
          clientId_salonId: {
            clientId: clientProfile.id,
            salonId: input.salonId,
          },
        },
      });

      return { isFavorite: !!favorite };
    }),

  /**
   * Get invitation code for a salon
   * SALON_OWNER ONLY
   */
  getInvitationCode: salonOwnerProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.salonId },
        select: { ownerId: true, invitationCode: true },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon introuvable' });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      // Si le salon n'a pas encore de code (salons existants), en générer un
      if (!salon.invitationCode) {
        const code = generateInvitationCode();
        await ctx.prisma.salon.update({
          where: { id: input.salonId },
          data: { invitationCode: code },
        });
        return { invitationCode: code };
      }

      return { invitationCode: salon.invitationCode };
    }),

  /**
   * Regenerate invitation code for a salon
   * SALON_OWNER ONLY
   */
  regenerateInvitationCode: salonOwnerProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.salonId },
        select: { ownerId: true },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon introuvable' });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      const newCode = generateInvitationCode();
      await ctx.prisma.salon.update({
        where: { id: input.salonId },
        data: { invitationCode: newCode },
      });

      return { invitationCode: newCode };
    }),
});
