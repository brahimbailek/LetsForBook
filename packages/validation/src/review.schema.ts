import { z } from 'zod';

// Create review schema
export const createReviewSchema = z.object({
  appointmentId: z.string().cuid('Invalid appointment ID'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').int('Rating must be an integer'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
});

// Respond to review schema
export const respondToReviewSchema = z.object({
  id: z.string().cuid('Invalid review ID'),
  response: z.string().min(1, 'Response is required').max(1000, 'Response must be less than 1000 characters'),
});

// Get reviews by salon schema
export const getReviewsBySalonSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  published: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
});

// Type exports
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;
export type GetReviewsBySalonInput = z.infer<typeof getReviewsBySalonSchema>;
