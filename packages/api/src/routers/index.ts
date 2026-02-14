import { router } from '../trpc';
import { authRouter } from './auth.router';
import { salonRouter } from './salon.router';
import { serviceRouter } from './service.router';
import { categoryRouter } from './category.router';
import { bookingRouter } from './booking.router';
import { availabilityRouter } from './availability.router';
import { paymentRouter } from './payment.router';
import { reviewRouter } from './review.router';
import { notificationRouter } from './notification.router';

/**
 * Main tRPC router combining all sub-routers
 * This is the root router that will be used in the Next.js API route
 */
export const appRouter = router({
  auth: authRouter,
  salon: salonRouter,
  service: serviceRouter,
  category: categoryRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  payment: paymentRouter,
  review: reviewRouter,
  notification: notificationRouter,
});

/**
 * Type definition for the app router
 * This will be used by tRPC client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
