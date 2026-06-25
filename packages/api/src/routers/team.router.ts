import { z } from 'zod';
import { router, salonOwnerProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  addProfessionalSchema,
  updateProfessionalSchema,
  removeProfessionalSchema,
  getTeamSchema,
} from '@letsforbook/validation';
import bcrypt from 'bcryptjs';

export const teamRouter = router({
  /**
   * Get all professionals for a salon
   * SALON_OWNER ONLY
   */
  getBySalonId: salonOwnerProcedure
    .input(getTeamSchema)
    .query(async ({ ctx, input }) => {
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

      return ctx.prisma.professionalProfile.findMany({
        where: { salonId: input.salonId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              phone: true,
            },
          },
          services: {
            include: {
              service: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              appointments: { where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }),

  /**
   * Add a professional to a salon
   * Creates user account + professional profile
   * SALON_OWNER ONLY
   */
  add: salonOwnerProcedure
    .input(addProfessionalSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify salon ownership
      const salon = await ctx.prisma.salon.findUnique({
        where: { id: input.salonId },
        select: { ownerId: true, name: true },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Salon introuvable' });
      }

      if (salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      // Check if user with this email already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: { professionalProfile: true },
      });

      if (existingUser?.professionalProfile) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cet utilisateur est déjà rattaché à un salon.',
        });
      }

      if (existingUser) {
        // User exists but no pro profile → create pro profile for them
        const professional = await ctx.prisma.professionalProfile.create({
          data: {
            userId: existingUser.id,
            salonId: input.salonId,
            specialties: input.specialties || [],
            title: input.title,
          },
        });

        // Update user role to PROFESSIONAL
        await ctx.prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'PROFESSIONAL' },
        });

        return professional;
      }

      // User doesn't exist → create user + pro profile
      const tempPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const result = await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            password: hashedPassword,
            role: 'PROFESSIONAL',
          },
        });

        const professional = await tx.professionalProfile.create({
          data: {
            userId: user.id,
            salonId: input.salonId,
            specialties: input.specialties || [],
            title: input.title,
          },
        });

        return professional;
      });

      return result;
    }),

  /**
   * Update a professional's info
   * SALON_OWNER ONLY
   */
  update: salonOwnerProcedure
    .input(updateProfessionalSchema)
    .mutation(async ({ ctx, input }) => {
      const { professionalId, ...data } = input;

      const professional = await ctx.prisma.professionalProfile.findUnique({
        where: { id: professionalId },
        include: { salon: { select: { ownerId: true } } },
      });

      if (!professional) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Professionnel introuvable' });
      }

      if (professional.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      return ctx.prisma.professionalProfile.update({
        where: { id: professionalId },
        data,
      });
    }),

  /**
   * Remove a professional from a salon (soft delete)
   * SALON_OWNER ONLY
   */
  remove: salonOwnerProcedure
    .input(removeProfessionalSchema)
    .mutation(async ({ ctx, input }) => {
      const professional = await ctx.prisma.professionalProfile.findUnique({
        where: { id: input.professionalId },
        include: {
          salon: { select: { ownerId: true } },
          _count: {
            select: {
              appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } },
            },
          },
        },
      });

      if (!professional) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Professionnel introuvable' });
      }

      if (professional.salon.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès refusé' });
      }

      if (professional._count.appointments > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Ce professionnel a ${professional._count.appointments} rendez-vous en cours. Annulez-les avant de le retirer.`,
        });
      }

      // Soft delete
      await ctx.prisma.professionalProfile.update({
        where: { id: input.professionalId },
        data: { active: false },
      });

      return { success: true };
    }),

  /**
   * Join a salon with an invitation code (post-registration)
   * PROTECTED — any authenticated user with PROFESSIONAL role
   */
  joinWithCode: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'PROFESSIONAL') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Réservé aux professionnels' });
      }

      const salon = await ctx.prisma.salon.findUnique({
        where: { invitationCode: input.code.toUpperCase().trim() },
      });

      if (!salon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: "Code d'invitation invalide" });
      }

      const existing = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        if (existing.salonId === salon.id) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Vous êtes déjà rattaché à cet établissement' });
        }
        // Update to new salon
        await ctx.prisma.professionalProfile.update({
          where: { id: existing.id },
          data: { salonId: salon.id, active: true },
        });
      } else {
        await ctx.prisma.professionalProfile.create({
          data: { userId: ctx.user.id, salonId: salon.id, active: true },
        });
      }

      return { success: true, salonName: salon.name };
    }),
});
