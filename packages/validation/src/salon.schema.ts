import { z } from 'zod';

// Create salon schema
export const createSalonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(), // Auto-generated from name if not provided
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  website: z.string().url('Invalid website URL').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postalCode: z.string().min(2, 'Postal code is required'),
  country: z.string().default('FR'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  timezone: z.string().default('Europe/Paris'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('EUR'),
  bookingBufferMinutes: z.number().min(0).max(60).default(0),
  cancellationPolicyHours: z.number().min(0).max(168).default(24),
  depositRequired: z.boolean().default(false),
  depositPercentage: z.number().min(0).max(100).optional(),
});

// Update salon schema
export const updateSalonSchema = createSalonSchema.partial().extend({
  id: z.string().cuid('Invalid salon ID'),
});

// Search salons schema
export const searchSalonsSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(), // Multiple categories filter
  minRating: z.number().min(1).max(5).optional(), // Minimum average rating filter
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).max(100).optional(), // in kilometers
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
});

// Type exports
export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export type SearchSalonsInput = z.infer<typeof searchSalonsSchema>;
