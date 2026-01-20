import { z } from 'zod';

// Base environment schema
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Database environment schema
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_DIRECT_URL: z.string().url().optional(),
});

// Auth environment schema
export const authEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),
});

// Stripe environment schema
export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key format'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'Invalid Stripe webhook secret format'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
});

// Twilio environment schema
export const twilioEnvSchema = z.object({
  TWILIO_ACCOUNT_SID: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'TWILIO_AUTH_TOKEN is required'),
  TWILIO_PHONE_NUMBER: z.string().min(1, 'TWILIO_PHONE_NUMBER is required'),
});

// Resend environment schema
export const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format'),
});

// Redis environment schema
export const redisEnvSchema = z.object({
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1, 'UPSTASH_REDIS_TOKEN is required'),
});

// AWS environment schema
export const awsEnvSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().default('eu-west-1'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
});

// Google Maps environment schema
export const googleMapsEnvSchema = z.object({
  GOOGLE_MAPS_API_KEY: z.string().min(1, 'GOOGLE_MAPS_API_KEY is required'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1, 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required'),
});

// Complete server environment schema
export const serverEnvSchema = baseEnvSchema
  .merge(databaseEnvSchema)
  .merge(authEnvSchema)
  .merge(stripeEnvSchema)
  .merge(twilioEnvSchema)
  .merge(resendEnvSchema)
  .merge(redisEnvSchema)
  .merge(awsEnvSchema)
  .merge(googleMapsEnvSchema);

// Client environment schema (only NEXT_PUBLIC_ vars)
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
});

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Validation function with clear error messages
export function validateEnv<T extends z.ZodType>(
  schema: T,
  env: Record<string, string | undefined>
): z.infer<T> {
  const parsed = schema.safeParse(env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
