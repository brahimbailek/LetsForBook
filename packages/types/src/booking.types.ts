// Booking-related types

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED_CLIENT'
  | 'CANCELLED_SALON'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'IN_PROGRESS';

export interface AppointmentSummary {
  id: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  salonName: string;
  professionalName: string;
  services: ServiceSummary[];
  totalPrice: number;
  currency: string;
}

export interface ServiceSummary {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface BookingConfirmation {
  appointmentId: string;
  confirmationCode: string;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  salon: {
    name: string;
    address: string;
    phone: string;
  };
  professional: {
    name: string;
  };
  services: ServiceSummary[];
  totalAmount: number;
  currency: string;
  paymentRequired: boolean;
}
