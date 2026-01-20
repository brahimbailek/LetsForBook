export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  AUTHORIZED: 'Autorisé',
  PAID: 'Payé',
  REFUNDED: 'Remboursé',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
};

export const PAYMENT_TYPE = {
  DEPOSIT: 'DEPOSIT',
  FULL_PAYMENT: 'FULL_PAYMENT',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  DEPOSIT: 'Acompte',
  FULL_PAYMENT: 'Paiement complet',
};
