import { z } from 'zod';

// Create booking schema
export const createBookingSchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID').optional(),
  salonId: z.string().cuid('Invalid salon ID'),
  serviceIds: z
    .array(z.string().cuid('Invalid service ID'))
    .min(1, 'At least one service is required'),
  startTime: z.coerce.date(),
  clientNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Update booking schema
export const updateBookingSchema = z.object({
  id: z.string().cuid('Invalid booking ID'),
  startTime: z.coerce.date().optional(),
  clientNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  id: z.string().cuid('Invalid booking ID'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// Get available slots schema
export const getAvailableSlotsSchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID'),
  serviceIds: z
    .array(z.string().cuid('Invalid service ID'))
    .min(1, 'At least one service is required'),
  date: z.coerce.date(),
});

// Get bookings query schema
export const getBookingsQuerySchema = z.object({
  status: z.enum(['upcoming', 'past', 'all']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  cursor: z.string().cuid().optional(),
});

// Professional bookings query schema
export const getProfessionalBookingsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;
export type GetBookingsQueryInput = z.infer<typeof getBookingsQuerySchema>;
export type GetProfessionalBookingsInput = z.infer<typeof getProfessionalBookingsSchema>;
