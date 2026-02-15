import { z } from 'zod';
import { router, publicProcedure, salonOwnerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  reorderCategoriesSchema,
} from '@letsforbook/validation';

export const categoryRouter = router({
  /**
   * Get all global categories (salonId = null)
   * PUBLIC - used for homepage browsing
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      where: { active: true, salonId: null },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
      },
    });

    return categories;
  }),

  /**
   * Get categories for a specific salon (with services included)
   * PUBLIC - used on salon page, booking page, and dashboard
   */
  getBySalonId: publicProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const categories = await ctx.prisma.category.findMany({
        where: { salonId: input.salonId, active: true },
        orderBy: { order: 'asc' },
        include: {
          services: {
            where: { active: true },
            orderBy: { order: 'asc' },
            include: {
              category: {
                select: { id: true, name: true, slug: true, icon: true, color: true },
              },
              professionals: {
                where: { active: true },
                include: {
                  professional: {
                    include: {
                      user: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: { services: { where: { active: true } } },
          },
        },
      });

      return categories;
    }),

  /**
   * Create a salon-specific category
   * SALON_OWNER ONLY
   */
  create: salonOwnerProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      // Verify salon ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.salonId },
        select: { ownerId: true },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon not found' });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your salon' });
      }

      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Get max order for this salon's categories
      const maxOrder = await ctx.prisma.category.aggregate({
        where: { salonId: input.salonId, active: true },
        _max: { order: true },
      });

      return ctx.prisma.category.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          icon: input.icon,
          color: input.color,
          salonId: input.salonId,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      });
    }),

  /**
   * Update a salon-specific category
   * SALON_OWNER ONLY
   */
  update: salonOwnerProcedure
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const category = await ctx.prisma.category.findUnique({
        where: { id },
        include: { salon: { select: { ownerId: true } } },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      if (!category.salonId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot edit global categories' });
      }

      if (category.salon?.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your category' });
      }

      // If name changed, update slug too
      let slug: string | undefined;
      if (data.name) {
        slug = data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      return ctx.prisma.category.update({
        where: { id },
        data: { ...data, ...(slug ? { slug } : {}) },
      });
    }),

  /**
   * Delete a salon-specific category
   * SALON_OWNER ONLY
   * Category must have 0 active services
   */
  delete: salonOwnerProcedure
    .input(deleteCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: {
          salon: { select: { ownerId: true } },
          _count: { select: { services: { where: { active: true } } } },
        },
      });

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      if (!category.salonId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete global categories' });
      }

      if (category.salon?.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your category' });
      }

      if (category._count.services > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Déplacez ou supprimez les prestations de cette catégorie avant de la supprimer.',
        });
      }

      // Soft delete
      await ctx.prisma.category.update({
        where: { id: input.id },
        data: { active: false },
      });

      return { success: true };
    }),

  /**
   * Reorder categories for a salon
   * SALON_OWNER ONLY
   */
  reorder: salonOwnerProcedure
    .input(reorderCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.salonId },
        select: { ownerId: true },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon not found' });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your salon' });
      }

      // Batch update order based on array position
      await ctx.prisma.$transaction(
        input.categoryIds.map((id, index) =>
          ctx.prisma.category.update({ where: { id }, data: { order: index } })
        )
      );

      return { success: true };
    }),
});
