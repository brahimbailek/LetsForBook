import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  registerSchema,
  updateProfileSchema,
  createClientProfileSchema,
  createProfessionalProfileSchema,
} from '@planity/validation';
import bcrypt from 'bcryptjs';

export const authRouter = router({
  /**
   * Register new user
   * PUBLIC
   */
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const { email, password, firstName, lastName, phone } = input;

    // Check if user already exists
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await ctx.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'CLIENT',
        emailVerified: null, // Will be set after email verification
      },
    });

    // Create corresponding profile based on role
    if (user.role === 'CLIENT') {
      await ctx.prisma.clientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }),

  /**
   * Get current user profile
   * PROTECTED
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        clientProfile: true,
        professionalProfile: {
          include: {
            salon: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  /**
   * Update user profile
   * PROTECTED
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });

      return updatedUser;
    }),

  /**
   * Update password
   * PROTECTED
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input;

      // Get user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          password: hashedPassword,
        },
      });

      return { success: true };
    }),

  /**
   * Delete account
   * PROTECTED
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password is incorrect',
        });
      }

      // Delete user (cascade will delete profiles, appointments, etc.)
      await ctx.prisma.user.delete({
        where: { id: ctx.user.id },
      });

      return { success: true };
    }),

  /**
   * Create client profile
   * PROTECTED
   */
  createClientProfile: protectedProcedure
    .input(createClientProfileSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if profile already exists
      const existing = await ctx.prisma.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Client profile already exists',
        });
      }

      const profile = await ctx.prisma.clientProfile.create({
        data: {
          userId: ctx.user.id,
          ...input,
        },
      });

      return profile;
    }),

  /**
   * Update client profile
   * PROTECTED
   */
  updateClientProfile: protectedProcedure
    .input(
      z.object({
        preferredLanguage: z.string().optional(),
        marketingOptIn: z.boolean().optional(),
      })
    )
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

      const updatedProfile = await ctx.prisma.clientProfile.update({
        where: { id: clientProfile.id },
        data: input,
      });

      return updatedProfile;
    }),

  /**
   * Create professional profile
   * PROTECTED (user must have PROFESSIONAL role)
   */
  createProfessionalProfile: protectedProcedure
    .input(createProfessionalProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { salonId, ...data } = input;

      // Check user role
      if (ctx.user.role !== 'PROFESSIONAL' && ctx.user.role !== 'SALON_OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only professionals can create professional profiles',
        });
      }

      // Check if profile already exists
      const existing = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Professional profile already exists',
        });
      }

      const profile = await ctx.prisma.professionalProfile.create({
        data: {
          userId: ctx.user.id,
          salonId,
          ...data,
        },
      });

      return profile;
    }),

  /**
   * Update professional profile
   * PROTECTED
   */
  updateProfessionalProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(1000).optional(),
        specialties: z.array(z.string()).optional(),
        yearsExperience: z.number().int().min(0).max(50).optional(),
        active: z.boolean().optional(),
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

      const updatedProfile = await ctx.prisma.professionalProfile.update({
        where: { id: professionalProfile.id },
        data: input,
      });

      return updatedProfile;
    }),

  /**
   * Get user by ID
   * PUBLIC
   */
  getUserById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),
});
