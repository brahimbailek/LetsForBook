// Appointment status
export * from './appointment-status';

// User roles
export * from './user-roles';

// Payment status
export * from './payment-status';

// Notification types
export * from './notification-types';

// Time constants
export const TIME_SLOT_INTERVAL_MINUTES = 15;
export const DEFAULT_BOOKING_BUFFER_MINUTES = 0;
export const DEFAULT_CANCELLATION_POLICY_HOURS = 24;

// Service categories
export const SERVICE_CATEGORIES = [
  'Coiffure',
  'Coloration',
  'Coupe',
  'Barbe',
  'Soin',
  'Maquillage',
  'Manucure',
  'Pédicure',
  'Épilation',
  'Massage',
  'Autre',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

// Days of week
export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

// Pagination
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
