import { z } from 'zod';

// Day of week enum
const dayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

// Time format validation (HH:mm)
const timeFormat = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format');

// Create professional availability schema
export const createProfessionalAvailabilitySchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID'),
  dayOfWeek: dayOfWeekEnum,
  startTime: timeFormat,
  endTime: timeFormat,
  breakStartTime: timeFormat.optional(),
  breakEndTime: timeFormat.optional(),
  isAvailable: z.boolean().default(true),
});

// Update professional availability schema
export const updateProfessionalAvailabilitySchema = z.object({
  id: z.string().cuid('Invalid availability ID'),
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  breakStartTime: timeFormat.optional(),
  breakEndTime: timeFormat.optional(),
  isAvailable: z.boolean().optional(),
});

// Update availability (simpler version without ID)
export const updateAvailabilitySchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  breakStartTime: timeFormat.optional(),
  breakEndTime: timeFormat.optional(),
  isAvailable: z.boolean().optional(),
});

// Create availability exception schema
export const createAvailabilityExceptionSchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID'),
  date: z.coerce.date(),
  type: z.enum(['UNAVAILABLE', 'CUSTOM']),
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// Update availability exception schema
export const updateAvailabilityExceptionSchema = z.object({
  id: z.string().cuid('Invalid exception ID'),
  type: z.enum(['UNAVAILABLE', 'CUSTOM']).optional(),
  startTime: timeFormat.optional(),
  endTime: timeFormat.optional(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// Delete availability exception schema
export const deleteAvailabilityExceptionSchema = z.object({
  id: z.string().cuid('Invalid exception ID'),
});

// Get professional availability schema
export const getProfessionalAvailabilitySchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID'),
});

// Type exports
export type CreateProfessionalAvailabilityInput = z.infer<
  typeof createProfessionalAvailabilitySchema
>;
export type UpdateProfessionalAvailabilityInput = z.infer<
  typeof updateProfessionalAvailabilitySchema
>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateAvailabilityExceptionInput = z.infer<
  typeof createAvailabilityExceptionSchema
>;
export type UpdateAvailabilityExceptionInput = z.infer<
  typeof updateAvailabilityExceptionSchema
>;
export type DeleteAvailabilityExceptionInput = z.infer<
  typeof deleteAvailabilityExceptionSchema
>;
export type GetProfessionalAvailabilityInput = z.infer<
  typeof getProfessionalAvailabilitySchema
>;
