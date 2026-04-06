import { z } from 'zod';

// =============================================
// USERS
// =============================================

export const getUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SALON_OWNER', 'ADMIN']).optional(),
});

export const getUserByIdSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
});

export const updateUserSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.enum(['CLIENT', 'PROFESSIONAL', 'SALON_OWNER', 'ADMIN']).optional(),
  active: z.boolean().optional(), // false = soft ban (sets deletedAt)
});

// =============================================
// SALONS
// =============================================

export const getSalonsAdminSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  published: z.boolean().optional(),
});

export const updateSalonAdminSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  published: z.boolean().optional(),
  verified: z.boolean().optional(),
  active: z.boolean().optional(),
});

// =============================================
// STATS
// =============================================

export const getStatsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

// =============================================
// REVIEWS (moderation)
// =============================================

export const getReviewsAdminSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  published: z.boolean().optional(),
});

export const deleteReviewAdminSchema = z.object({
  reviewId: z.string().cuid('Invalid review ID'),
});

// =============================================
// TYPE EXPORTS
// =============================================

export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetSalonsAdminInput = z.infer<typeof getSalonsAdminSchema>;
export type UpdateSalonAdminInput = z.infer<typeof updateSalonAdminSchema>;
export type GetStatsInput = z.infer<typeof getStatsSchema>;
export type GetReviewsAdminInput = z.infer<typeof getReviewsAdminSchema>;
export type DeleteReviewAdminInput = z.infer<typeof deleteReviewAdminSchema>;
