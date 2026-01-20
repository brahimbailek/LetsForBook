export const USER_ROLES = {
  CLIENT: 'CLIENT',
  PROFESSIONAL: 'PROFESSIONAL',
  SALON_OWNER: 'SALON_OWNER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: 'Client',
  PROFESSIONAL: 'Professionnel',
  SALON_OWNER: 'Propriétaire de salon',
  ADMIN: 'Administrateur',
};
