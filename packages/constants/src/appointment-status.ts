export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED_CLIENT: 'CANCELLED_CLIENT',
  CANCELLED_SALON: 'CANCELLED_SALON',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED_CLIENT: 'Annulé par le client',
  CANCELLED_SALON: 'Annulé par le salon',
  COMPLETED: 'Terminé',
  NO_SHOW: 'Absent',
  IN_PROGRESS: 'En cours',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'orange',
  CONFIRMED: 'green',
  CANCELLED_CLIENT: 'red',
  CANCELLED_SALON: 'red',
  COMPLETED: 'blue',
  NO_SHOW: 'gray',
  IN_PROGRESS: 'purple',
};
