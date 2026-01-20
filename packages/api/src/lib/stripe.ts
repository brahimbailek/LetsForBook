import Stripe from 'stripe';

// Initialize Stripe with API key
const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});
