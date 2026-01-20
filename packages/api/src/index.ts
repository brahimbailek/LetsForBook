/**
 * @planity/api - Main API package exports
 *
 * This package contains:
 * - tRPC configuration and procedures
 * - API routers for all features
 * - Business logic services
 * - Third-party integrations (Stripe, Twilio, Resend)
 */

// Export main router and types
export { appRouter, type AppRouter } from './routers';

// Export tRPC utilities
export { createContext, type Context } from './context';
export { router, publicProcedure, protectedProcedure, professionalProcedure, adminProcedure } from './trpc';

// Export services (for use in API routes, cron jobs, etc.)
export { availabilityService } from './services/availability.service';
export { bookingService } from './services/booking.service';
export { paymentService } from './services/payment.service';
export { notificationService } from './services/notification.service';

// Export third-party clients
export { stripe } from './lib/stripe';
export { twilioClient, TWILIO_PHONE_NUMBER } from './lib/twilio';
export { resend } from './lib/resend';
