import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  registerSchema,
  updateProfileSchema,
  createClientProfileSchema,
  createProfessionalProfileSchema,
} from '@letsforbook/validation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getResend } from '../lib/resend';
import { UserRole } from '@prisma/client';

const APP_NAME = 'LetsForBook';
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'https://letsforbook.com';
const FROM_EMAIL = process.env['RESEND_FROM_EMAIL'] || 'notifications@letsforbook.com';

export const authRouter = router({
  /**
   * Register new user
   * PUBLIC
   */
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'CLIENT',
      // salonCode, // TODO: Implement invitation system
      salonName,
      salonAddress,
      salonCity,
      salonPostalCode,
      siret,
    } = input;

    // Check if user already exists
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // For SALON_OWNER: validate required salon fields
    if (role === 'SALON_OWNER' && !salonName) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Le nom de l\'établissement est requis',
      });
    }

    // Determine the correct role
    const userRole: UserRole = (role === 'PROFESSIONAL' || role === 'SALON_OWNER')
      ? role as UserRole
      : 'CLIENT';

    // Create user with role
    const user = await ctx.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: userRole,
        emailVerified: null,
      },
    });

    if (!user || !user.id) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la création du compte',
      });
    }

    // Create corresponding profile based on role
    if (userRole === 'CLIENT') {
      await ctx.prisma.clientProfile.create({
        data: {
          userId: user.id,
          preferredLanguage: 'fr',
        },
      });
    } else if (userRole === 'SALON_OWNER' && salonName) {
      // Create salon for owner
      const slug = salonName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);

      const salon = await ctx.prisma.salon.create({
        data: {
          name: salonName,
          slug,
          email,
          phone: phone || '',
          address: salonAddress || '',
          city: salonCity || '',
          postalCode: salonPostalCode || '',
          country: 'FR',
          ownerId: user.id,
          registrationNumber: siret || null,
          verified: false,
          active: true,
        },
      });

      // Also create professional profile for owner
      await ctx.prisma.professionalProfile.create({
        data: {
          userId: user.id,
          salonId: salon.id,
          title: 'Propriétaire',
          active: true,
        },
      });
    }
    // Note: PROFESSIONAL role without salon will be handled later via invitation system

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
  me: protectedProcedure.query(async ({ ctx }) => {
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

  /**
   * Request password reset
   * PUBLIC - Sends email with reset link
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this email
      await ctx.prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Create new token
      await ctx.prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // Send email
      const resetUrl = `${APP_URL}/reset-password?token=${token}`;

      try {
        const resend = getResend();
        await resend.emails.send({
          from: `${APP_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject: 'Réinitialisation de votre mot de passe',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f3ef; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%); padding: 30px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
                .content { padding: 30px; }
                .button { display: inline-block; background-color: #6b8e6b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { background-color: #f5f3ef; padding: 20px; text-align: center; color: #6b5b4d; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${APP_NAME}</h1>
                </div>
                <div class="content">
                  <p style="color: #4a3728; font-size: 16px;">Bonjour <strong>${user.firstName}</strong>,</p>
                  <p style="color: #4a3728; font-size: 16px;">Vous avez demandé à réinitialiser votre mot de passe.</p>
                  <p style="color: #4a3728; font-size: 16px;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                  </div>
                  <p style="color: #6b5b4d; font-size: 14px;">Ce lien est valide pendant 1 heure.</p>
                  <p style="color: #6b5b4d; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                </div>
                <div class="footer">
                  <p>${APP_NAME} - Votre plateforme de réservation beauté</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't throw error to user
      }

      return { success: true };
    }),

  /**
   * Reset password with token
   * PUBLIC
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, newPassword } = input;

      // Find token
      const verificationToken = await ctx.prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lien invalide ou expiré',
        });
      }

      // Check if expired
      if (verificationToken.expires < new Date()) {
        // Delete expired token
        await ctx.prisma.verificationToken.delete({
          where: { token },
        });

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce lien a expiré. Veuillez demander un nouveau lien.',
        });
      }

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email: verificationToken.identifier },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur non trouvé',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      // Delete used token
      await ctx.prisma.verificationToken.delete({
        where: { token },
      });

      return { success: true };
    }),
});
