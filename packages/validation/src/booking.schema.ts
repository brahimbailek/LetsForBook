/**
 * Schémas de validation Zod pour le module de réservation (booking).
 *
 * Utilisés côté frontend (formulaires) ET côté backend (validation tRPC input).
 * Partagés via le package @letsforbook/validation.
 */
import { z } from 'zod';

/**
 * Création d'une réservation.
 * - professionalId optionnel : si absent → mode "Peu importe" (auto-assignation côté backend)
 * - salonId requis : nécessaire pour l'auto-assignation et la vérification d'appartenance
 * - serviceIds : au moins 1 service requis
 * - startTime : date+heure de début du RDV
 */
export const createBookingSchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID').optional(),
  salonId: z.string().cuid('Invalid salon ID'),
  serviceIds: z
    .array(z.string().cuid('Invalid service ID'))
    .min(1, 'At least one service is required'),
  startTime: z.coerce.date(),
  clientNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

/** Modification d'un RDV existant (changement d'horaire et/ou de notes). */
export const updateBookingSchema = z.object({
  id: z.string().cuid('Invalid booking ID'),
  startTime: z.coerce.date().optional(),
  clientNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

/** Annulation d'un RDV avec raison optionnelle. */
export const cancelBookingSchema = z.object({
  id: z.string().cuid('Invalid booking ID'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

/** Récupération des créneaux disponibles pour un pro et un/des service(s) à une date donnée. */
export const getAvailableSlotsSchema = z.object({
  professionalId: z.string().cuid('Invalid professional ID'),
  serviceIds: z
    .array(z.string().cuid('Invalid service ID'))
    .min(1, 'At least one service is required'),
  date: z.coerce.date(),
});

/** Requête de liste des RDV côté client (avec pagination par curseur). */
export const getBookingsQuerySchema = z.object({
  status: z.enum(['upcoming', 'past', 'all']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  cursor: z.string().cuid().optional(),
});

/** Requête des RDV d'un pro sur une plage de dates (vue calendrier). */
export const getProfessionalBookingsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// --- Types inférés depuis les schémas ---
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;
export type GetBookingsQueryInput = z.infer<typeof getBookingsQuerySchema>;
export type GetProfessionalBookingsInput = z.infer<typeof getProfessionalBookingsSchema>;
