export const NOTIFICATION_TYPE = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  NEW_BOOKING_REQUEST: 'NEW_BOOKING_REQUEST',
  BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
  BOOKING_REJECTED: 'BOOKING_REJECTED',
  REVIEW_REQUEST: 'REVIEW_REQUEST',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_CHANNEL = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BOOKING_CONFIRMATION: 'Confirmation de réservation',
  BOOKING_REMINDER: 'Rappel de rendez-vous',
  BOOKING_CANCELLED: 'Rendez-vous annulé',
  BOOKING_RESCHEDULED: 'Rendez-vous reporté',
  PAYMENT_SUCCESS: 'Paiement réussi',
  PAYMENT_FAILED: 'Paiement échoué',
  NEW_BOOKING_REQUEST: 'Nouvelle demande de réservation',
  BOOKING_ACCEPTED: 'Réservation acceptée',
  BOOKING_REJECTED: 'Réservation refusée',
  REVIEW_REQUEST: 'Demande d\'avis',
};
