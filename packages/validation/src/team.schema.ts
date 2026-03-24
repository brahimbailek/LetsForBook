import { z } from 'zod';

// Add a professional to a salon
export const addProfessionalSchema = z.object({
  salonId: z.string().cuid(),
  email: z.string().email('Adresse email invalide'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  specialties: z.array(z.string()).optional().default([]),
  title: z.string().max(100).optional(),
});

// Update a professional in a salon
export const updateProfessionalSchema = z.object({
  professionalId: z.string().cuid(),
  specialties: z.array(z.string()).optional(),
  title: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

// Remove a professional from a salon
export const removeProfessionalSchema = z.object({
  professionalId: z.string().cuid(),
});

// Get team for a salon
export const getTeamSchema = z.object({
  salonId: z.string().cuid(),
});

// Type exports
export type AddProfessionalInput = z.infer<typeof addProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type RemoveProfessionalInput = z.infer<typeof removeProfessionalSchema>;
export type GetTeamInput = z.infer<typeof getTeamSchema>;
