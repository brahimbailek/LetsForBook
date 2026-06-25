import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, professionalProcedure } from '../trpc';
import { bookingService } from '../services/booking.service';
import { availabilityService } from '../services/availability.service';
import { notificationService } from '../services/notification.service';
import {
  createBookingSchema,
  getAvailableSlotsSchema,
  cancelBookingSchema,
  updateBookingSchema,
} from '@letsforbook/validation';

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

      // Send booking confirmation notification (async, don't block)
      notificationService.sendBookingConfirmation(ctx.prisma, appointment.id).catch((error) => {
        console.error('Failed to send booking confirmation:', error);
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

      // Send cancellation notification (async, don't block)
      notificationService.sendCancellationNotification(ctx.prisma, id, 'CLIENT').catch((error) => {
        console.error('Failed to send cancellation notification:', error);
      });

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

      // Send confirmation notification when booking is accepted (async, don't block)
      notificationService.sendBookingConfirmation(ctx.prisma, input.id).catch((error) => {
        console.error('Failed to send booking confirmation:', error);
      });

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

      // Send cancellation notification to client (async, don't block)
      notificationService.sendCancellationNotification(ctx.prisma, id, 'SALON').catch((error) => {
        console.error('Failed to send cancellation notification:', error);
      });

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

  /**
   * Get salon booking analytics
   * PROFESSIONAL ONLY
   */
  getSalonStats: professionalProcedure
    .input(z.object({ salonId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { salonId } = input;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const [
        thisMonthAll,
        lastMonthCompleted,
        pendingCount,
        todayCount,
        thisWeekCount,
        noShowCount,
        topServices,
      ] = await Promise.all([
        // This month appointments
        ctx.prisma.appointment.findMany({
          where: { salonId, startTime: { gte: startOfMonth } },
          select: { status: true },
        }),
        // Last month completed (for comparison)
        ctx.prisma.appointment.count({
          where: {
            salonId,
            status: 'COMPLETED',
            startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),
        // Pending appointments
        ctx.prisma.appointment.count({
          where: { salonId, status: 'PENDING' },
        }),
        // Today
        ctx.prisma.appointment.count({
          where: {
            salonId,
            startTime: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
            },
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
        }),
        // This week
        ctx.prisma.appointment.count({
          where: {
            salonId,
            startTime: { gte: startOfWeek },
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
        }),
        // No-shows this month
        ctx.prisma.appointment.count({
          where: { salonId, status: 'NO_SHOW', startTime: { gte: startOfMonth } },
        }),
        // Top services this month
        ctx.prisma.appointmentService.groupBy({
          by: ['serviceName'],
          where: {
            appointment: {
              salonId,
              startTime: { gte: startOfMonth },
              status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
            },
          },
          _count: { serviceName: true },
          orderBy: { _count: { serviceName: 'desc' } },
          take: 5,
        }),
      ]);

      const thisMonthTotal = thisMonthAll.length;
      const thisMonthCompleted = thisMonthAll.filter((a) => a.status === 'COMPLETED').length;
      const thisMonthCancelled = thisMonthAll.filter(
        (a) => a.status === 'CANCELLED_CLIENT' || a.status === 'CANCELLED_SALON'
      ).length;
      const thisMonthConfirmed = thisMonthAll.filter((a) => a.status === 'CONFIRMED').length;

      const confirmationRate =
        thisMonthTotal > 0
          ? Math.round(((thisMonthCompleted + thisMonthConfirmed) / thisMonthTotal) * 100)
          : 0;

      const completionVsLastMonth =
        lastMonthCompleted > 0
          ? Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)
          : null;

      return {
        thisMonth: {
          total: thisMonthTotal,
          completed: thisMonthCompleted,
          confirmed: thisMonthConfirmed,
          cancelled: thisMonthCancelled,
          noShow: noShowCount,
        },
        pending: pendingCount,
        today: todayCount,
        thisWeek: thisWeekCount,
        confirmationRate,
        completionVsLastMonth,
        topServices: topServices.map((s) => ({
          name: s.serviceName,
          count: s._count.serviceName,
        })),
      };
    }),
});
