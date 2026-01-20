import { z } from 'zod';
import { router, publicProcedure, professionalProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createServiceSchema, updateServiceSchema } from '@planity/validation';

export const serviceRouter = router({
  /**
   * Get services by salon ID
   * PUBLIC
   */
  getBySalonId: publicProcedure
    .input(
      z.object({
        salonId: z.string().cuid(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { salonId, category } = input;

      const services = await ctx.prisma.service.findMany({
        where: {
          salonId,
          active: true,
          ...(category ? { category } : {}),
        },
        include: {
          professionals: {
            where: { active: true },
            include: {
              professional: {
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
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      return services;
    }),

  /**
   * Get service by ID
   * PUBLIC
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.prisma.service.findUnique({
        where: { id: input.id },
        include: {
          salon: true,
          professionals: {
            where: { active: true },
            include: {
              professional: {
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
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      return service;
    }),

  /**
   * Get service categories for a salon
   * PUBLIC
   */
  getCategoriesBySalonId: publicProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const services = await ctx.prisma.service.findMany({
        where: {
          salonId: input.salonId,
          active: true,
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      });

      return services.map((s) => s.category);
    }),

  /**
   * Create service
   * PROFESSIONAL ONLY (must own the salon)
   */
  create: professionalProcedure
    .input(createServiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { salonId, ...data } = input;

      // Check salon ownership
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
          message: 'You can only create services for your own salon',
        });
      }

      const service = await ctx.prisma.service.create({
        data: {
          salonId,
          ...data,
        },
      });

      return service;
    }),

  /**
   * Update service
   * PROFESSIONAL ONLY (must own the salon)
   */
  update: professionalProcedure
    .input(updateServiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get service with salon
      const service = await ctx.prisma.service.findUnique({
        where: { id },
        include: {
          salon: {
            select: { ownerId: true },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      if (service.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update services for your own salon',
        });
      }

      const updatedService = await ctx.prisma.service.update({
        where: { id },
        data,
      });

      return updatedService;
    }),

  /**
   * Delete service
   * PROFESSIONAL ONLY (must own the salon)
   */
  delete: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get service with salon
      const service = await ctx.prisma.service.findUnique({
        where: { id: input.id },
        include: {
          salon: {
            select: { ownerId: true },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      if (service.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete services for your own salon',
        });
      }

      // Soft delete
      await ctx.prisma.service.update({
        where: { id: input.id },
        data: { active: false },
      });

      return { success: true };
    }),

  /**
   * Assign service to professional
   * PROFESSIONAL ONLY (must own the salon)
   */
  assignToProfessional: professionalProcedure
    .input(
      z.object({
        serviceId: z.string().cuid(),
        professionalId: z.string().cuid(),
        customPrice: z.number().int().min(0).optional(),
        customDurationMinutes: z.number().int().min(5).max(480).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceId, professionalId, customPrice, customDurationMinutes } = input;

      // Get service with salon
      const service = await ctx.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          salon: {
            select: { ownerId: true },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      if (service.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only assign services for your own salon',
        });
      }

      // Check if professional belongs to this salon
      const professional = await ctx.prisma.professionalProfile.findUnique({
        where: { id: professionalId },
      });

      if (!professional || professional.salonId !== service.salonId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Professional does not belong to this salon',
        });
      }

      // Create or update assignment
      const assignment = await ctx.prisma.professionalService.upsert({
        where: {
          professionalId_serviceId: {
            professionalId,
            serviceId,
          },
        },
        create: {
          professionalId,
          serviceId,
          customPrice,
          customDurationMinutes,
          active: true,
        },
        update: {
          customPrice,
          customDurationMinutes,
          active: true,
        },
      });

      return assignment;
    }),

  /**
   * Remove service from professional
   * PROFESSIONAL ONLY (must own the salon)
   */
  removeFromProfessional: professionalProcedure
    .input(
      z.object({
        serviceId: z.string().cuid(),
        professionalId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceId, professionalId } = input;

      // Get service with salon
      const service = await ctx.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          salon: {
            select: { ownerId: true },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      if (service.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only manage services for your own salon',
        });
      }

      // Soft delete assignment
      await ctx.prisma.professionalService.update({
        where: {
          professionalId_serviceId: {
            professionalId,
            serviceId,
          },
        },
        data: { active: false },
      });

      return { success: true };
    }),

  /**
   * Get services for a professional
   * PUBLIC
   */
  getByProfessionalId: publicProcedure
    .input(z.object({ professionalId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const professionalServices = await ctx.prisma.professionalService.findMany({
        where: {
          professionalId: input.professionalId,
          active: true,
          service: {
            active: true,
          },
        },
        include: {
          service: true,
        },
      });

      return professionalServices.map((ps) => ({
        ...ps.service,
        customPrice: ps.customPrice,
        customDurationMinutes: ps.customDurationMinutes,
      }));
    }),
});
