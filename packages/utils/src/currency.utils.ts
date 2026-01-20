/**
 * Format price in cents to currency string
 */
export function formatPrice(amountInCents: number, currency: string = 'EUR'): string {
  const amount = amountInCents / 100;

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Convert euros to cents
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert cents to euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return Math.round((amount * percentage) / 100);
}

/**
 * Format currency without symbol
 */
export function formatPriceWithoutSymbol(
  amountInCents: number,
  currency: string = 'EUR'
): string {
  const amount = amountInCents / 100;

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
