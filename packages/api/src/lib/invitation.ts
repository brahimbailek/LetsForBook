import crypto from 'crypto';

/**
 * Génère un code d'invitation unique pour un salon (8 caractères alphanumériques majuscules)
 * Ex: "A3K9X2M7"
 */
export function generateInvitationCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}
