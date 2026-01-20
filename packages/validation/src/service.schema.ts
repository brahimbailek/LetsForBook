import { z } from 'zod';

// Create service schema
export const createServiceSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.string().min(2, 'Category is required'),
  price: z.number().min(0, 'Price must be positive').int('Price must be in cents'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('EUR'),
  durationMinutes: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  image: z.string().url('Invalid image URL').optional(),
});

// Update service schema
export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().cuid('Invalid service ID'),
});

// Delete service schema
export const deleteServiceSchema = z.object({
  id: z.string().cuid('Invalid service ID'),
});

// Get services by salon schema
export const getServicesBySalonSchema = z.object({
  salonId: z.string().cuid('Invalid salon ID'),
  category: z.string().optional(),
  active: z.boolean().optional(),
});

// Type exports
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type DeleteServiceInput = z.infer<typeof deleteServiceSchema>;
export type GetServicesBySalonInput = z.infer<typeof getServicesBySalonSchema>;
