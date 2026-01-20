import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, professionalProcedure } from '../trpc';
import { bookingService } from '../services/booking.service';
import { availabilityService } from '../services/availability.service';
import {
  createBookingSchema,
  getAvailableSlotsSchema,
  cancelBookingSchema,
  updateBookingSchema,
} from '@planity/validation';

export const bookingRouter = router({
  /**
   * Get available time slots for booking
   * PUBLIC - Anyone can check availability
   */
  getAvailableSlots: publicProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ ctx, input }) => {
      const { professionalId, serviceIds, date } = input;

      const slots = await availabilityService.getAvailableSlots(
        ctx.prisma,
        professionalId,
        serviceIds,
        date
      );

      return slots;
    }),

  /**
   * Create a new booking
   * PROTECTED - Must be authenticated
   */
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await bookingService.createBooking(ctx.prisma, {
        userId: ctx.user.id,
        ...input,
      });

      return appointment;
    }),

  /**
   * Get user's bookings (client side)
   * PROTECTED
   */
  getMyBookings: protectedProcedure
    .input(
      z.object({
        status: z.enum(['upcoming', 'past', 'all']).optional().default('all'),
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, limit, cursor } = input;

      const result = await bookingService.getUserBookings(
        ctx.prisma,
        ctx.user.id,
        status,
        limit,
        cursor
      );

      return result;
    }),

  /**
   * Get booking by ID
   * PROTECTED - Can only view own bookings (or if you're the professional)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const appointment = await bookingService.getBookingById(
        ctx.prisma,
        input.id
      );

      // Check authorization
      const isClient = appointment.client.userId === ctx.user.id;
      const isProfessional = appointment.professional.userId === ctx.user.id;

      if (!isClient && !isProfessional) {
        throw new Error('Forbidden');
      }

      return appointment;
    }),

  /**
   * Cancel booking (client side)
   * PROTECTED
   */
  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      const updatedAppointment = await bookingService.cancelBooking(
        ctx.prisma,
        id,
        ctx.user.id,
        reason
      );

      return updatedAppointment;
    }),

  /**
   * Update booking
   * PROTECTED
   */
  update: protectedProcedure
    .input(updateBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updatedAppointment = await bookingService.updateBooking(
        ctx.prisma,
        id,
        ctx.user.id,
        data
      );

      return updatedAppointment;
    }),

  /**
   * Get professional's bookings (for calendar view)
   * PROFESSIONAL ONLY
   */
  getProfessionalBookings: professionalProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const appointments = await bookingService.getProfessionalBookings(
        ctx.prisma,
        ctx.user.id,
        startDate,
        endDate
      );

      return appointments;
    }),

  /**
   * Accept booking (professional side)
   * PROFESSIONAL ONLY
   */
  accept: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const updatedAppointment = await bookingService.acceptBooking(
        ctx.prisma,
        input.id,
        ctx.user.id
      );

      return updatedAppointment;
    }),

  /**
   * Reject booking (professional side)
   * PROFESSIONAL ONLY
   */
  reject: professionalProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      const updatedAppointment = await bookingService.rejectBooking(
        ctx.prisma,
        id,
        ctx.user.id,
        reason
      );

      return updatedAppointment;
    }),

  /**
   * Mark booking as completed
   * PROFESSIONAL ONLY
   */
  markCompleted: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const updatedAppointment = await bookingService.markBookingCompleted(
        ctx.prisma,
        input.id,
        ctx.user.id
      );

      return updatedAppointment;
    }),

  /**
   * Mark booking as no-show
   * PROFESSIONAL ONLY
   */
  markNoShow: professionalProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const updatedAppointment = await bookingService.markBookingNoShow(
        ctx.prisma,
        input.id,
        ctx.user.id
      );

      return updatedAppointment;
    }),
});
