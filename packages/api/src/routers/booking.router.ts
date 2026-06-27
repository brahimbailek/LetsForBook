import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, professionalProcedure } from '../trpc';
import { bookingService } from '../services/booking.service';
import { availabilityService } from '../services/availability.service';
import { notificationService } from '../services/notification.service';
import { TRPCError } from '@trpc/server';
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
    .input(z.object({ salonId: z.string() }))
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

  /**
   * Advanced statistics for salon owner dashboard
   * PROFESSIONAL ONLY
   */
  getAdvancedStats: professionalProcedure
    .input(z.object({
      salonId: z.string(),
      period: z.enum(['7d', '30d', '90d', '12m']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      const { salonId, period } = input;
      const now = new Date();

      const periodStart = new Date(now);
      if (period === '7d') periodStart.setDate(now.getDate() - 7);
      else if (period === '30d') periodStart.setDate(now.getDate() - 30);
      else if (period === '90d') periodStart.setDate(now.getDate() - 90);
      else periodStart.setFullYear(now.getFullYear() - 1);

      const prevStart = new Date(periodStart);
      const diffMs = now.getTime() - periodStart.getTime();
      prevStart.setTime(periodStart.getTime() - diffMs);

      const [
        appointments,
        prevAppointments,
        payments,
        prevPayments,
        serviceRevenue,
        proRevenue,
        clientRetention,
        hourlyDistribution,
        weekdayDistribution,
        reviewStats,
      ] = await Promise.all([
        // Current period appointments
        ctx.prisma.appointment.findMany({
          where: { salonId, startTime: { gte: periodStart } },
          select: { id: true, status: true, startTime: true, clientId: true },
        }),
        // Previous period appointments (for comparison)
        ctx.prisma.appointment.findMany({
          where: { salonId, startTime: { gte: prevStart, lt: periodStart } },
          select: { status: true },
        }),
        // Current period revenue
        ctx.prisma.payment.findMany({
          where: {
            appointment: { salonId },
            status: 'PAID',
            paidAt: { gte: periodStart },
          },
          select: { amount: true, paidAt: true },
        }),
        // Previous period revenue
        ctx.prisma.payment.aggregate({
          where: {
            appointment: { salonId },
            status: 'PAID',
            paidAt: { gte: prevStart, lt: periodStart },
          },
          _sum: { amount: true },
        }),
        // Revenue by service
        ctx.prisma.appointmentService.groupBy({
          by: ['serviceName'],
          where: {
            appointment: {
              salonId,
              startTime: { gte: periodStart },
              status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
            },
          },
          _count: { serviceName: true },
          _sum: { price: true },
          orderBy: { _sum: { price: 'desc' } },
          take: 8,
        }),
        // Revenue by professional
        ctx.prisma.appointment.groupBy({
          by: ['professionalId'],
          where: {
            salonId,
            startTime: { gte: periodStart },
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
          _count: { id: true },
        }),
        // Client retention: count clients with more than 1 appointment
        ctx.prisma.appointment.groupBy({
          by: ['clientId'],
          where: {
            salonId,
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
          _count: { id: true },
          having: { id: { _count: { gt: 1 } } },
        }),
        // Hourly distribution (0-23)
        ctx.prisma.appointment.findMany({
          where: {
            salonId,
            startTime: { gte: periodStart },
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
          select: { startTime: true },
        }),
        // Weekday distribution
        ctx.prisma.appointment.findMany({
          where: {
            salonId,
            startTime: { gte: periodStart },
            status: { notIn: ['CANCELLED_CLIENT', 'CANCELLED_SALON'] },
          },
          select: { startTime: true },
        }),
        // Review stats
        ctx.prisma.review.aggregate({
          where: { salonId },
          _avg: { rating: true },
          _count: { id: true },
        }),
      ]);

      // Revenue over time (group by day or month depending on period)
      const revenueByDay = new Map<string, number>();
      for (const p of payments) {
        if (!p.paidAt) continue;
        const key: string = period === '12m'
          ? `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`
          : p.paidAt.toISOString().split('T')[0]!;
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + p.amount);
      }

      // Build revenue timeline
      const revenueTimeline: { date: string; amount: number }[] = [];
      if (period === '12m') {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          revenueTimeline.push({ date: key, amount: (revenueByDay.get(key) ?? 0) / 100 });
        }
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toISOString().split('T')[0];
          revenueTimeline.push({ date: key, amount: (revenueByDay.get(key) ?? 0) / 100 });
        }
      }

      // Hourly slots distribution
      const hourCounts = Array(24).fill(0);
      for (const a of hourlyDistribution) {
        hourCounts[a.startTime.getHours()]++;
      }
      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Weekday distribution
      const weekdayCounts = Array(7).fill(0);
      const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (const a of weekdayDistribution) {
        weekdayCounts[a.startTime.getDay()]++;
      }
      const weekdayData = weekdayCounts.map((count, i) => ({ day: weekdayLabels[i], count }));

      // Current period aggregates
      const total = appointments.length;
      const completed = appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = appointments.filter(a => a.status === 'CANCELLED_CLIENT' || a.status === 'CANCELLED_SALON').length;
      const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
      const totalRevenue = payments.reduce((s, p) => s + p.amount, 0) / 100;

      const prevTotal = prevAppointments.length;
      const prevCompleted = prevAppointments.filter(a => a.status === 'COMPLETED').length;
      const prevRevenue = (prevPayments._sum.amount ?? 0) / 100;

      const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
      const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

      // Professional revenue lookup
      const proDetails = await ctx.prisma.professionalProfile.findMany({
        where: { id: { in: proRevenue.map(p => p.professionalId).filter(Boolean) as string[] } },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      });
      const proMap = new Map(proDetails.map(p => [p.id, `${p.user.firstName} ${p.user.lastName}`]));

      const uniqueClients = new Set(appointments.map(a => a.clientId)).size;
      const returningClients = clientRetention.length;
      const newClients = uniqueClients - returningClients;

      return {
        period,
        summary: {
          totalAppointments: total,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
          noShowCount: noShow,
          totalRevenue,
          noShowRate,
          cancellationRate,
          uniqueClients,
          returningClients,
          newClients,
          vsLastPeriod: {
            appointments: prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null,
            revenue: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null,
            completed: prevCompleted > 0 ? Math.round(((completed - prevCompleted) / prevCompleted) * 100) : null,
          },
        },
        revenueTimeline,
        topServices: serviceRevenue.map(s => ({
          name: s.serviceName,
          count: s._count.serviceName,
          revenue: (s._sum.price ?? 0) / 100,
        })),
        proPerformance: proRevenue.map(p => ({
          name: p.professionalId ? (proMap.get(p.professionalId) ?? 'Inconnu') : 'Non assigné',
          appointments: p._count.id,
        })).sort((a, b) => b.appointments - a.appointments),
        peakHours,
        weekdayData,
        reviewStats: {
          average: reviewStats._avg.rating ?? 0,
          total: reviewStats._count.id,
        },
      };
    }),

  /**
   * Create a booking manually (pro side) for an existing or new client
   * PROFESSIONAL ONLY
   */
  createManual: professionalProcedure
    .input(
      z.object({
        clientFirstName: z.string().min(1),
        clientLastName: z.string().min(1),
        clientEmail: z.string().email().optional(),
        clientPhone: z.string().optional(),
        serviceIds: z.array(z.string()).min(1),
        startTime: z.coerce.date(),
        clientNotes: z.string().max(500).optional(),
        salonId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { clientFirstName, clientLastName, clientEmail, clientPhone, serviceIds, startTime, clientNotes } = input;

      // Find the pro's profile — or fall back to salon owner's first salon
      let professional = await ctx.prisma.professionalProfile.findUnique({
        where: { userId: ctx.user.id },
        include: { salon: true },
      });

      if (!professional && input.salonId) {
        // SALON_OWNER without a professionalProfile: find or create one for this salon
        const salon = await ctx.prisma.salon.findUnique({
          where: { id: input.salonId, ownerId: ctx.user.id },
        });
        if (!salon) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Salon introuvable ou accès refusé' });
        }
        professional = await ctx.prisma.professionalProfile.upsert({
          where: { userId: ctx.user.id },
          create: { userId: ctx.user.id, salonId: salon.id, active: true },
          update: {},
          include: { salon: true },
        });
      }

      if (!professional) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profil professionnel introuvable' });
      }

      // Find or create client user
      let clientUser = clientEmail
        ? await ctx.prisma.user.findUnique({ where: { email: clientEmail } })
        : null;

      if (!clientUser) {
        // Create a lightweight client account
        clientUser = await ctx.prisma.user.create({
          data: {
            email: clientEmail ?? `manual+${Date.now()}@letsforbook.internal`,
            firstName: clientFirstName,
            lastName: clientLastName,
            phone: clientPhone ?? null,
            role: 'CLIENT',
            password: null,
          },
        });
      }

      // Ensure client profile exists
      let clientProfile = await ctx.prisma.clientProfile.findUnique({
        where: { userId: clientUser.id },
      });

      if (!clientProfile) {
        clientProfile = await ctx.prisma.clientProfile.create({
          data: { userId: clientUser.id },
        });
      }

      // Fetch services and calculate total duration + price
      const services = await ctx.prisma.service.findMany({
        where: { id: { in: serviceIds }, salonId: professional.salonId, active: true },
        include: {
          professionals: {
            where: { professionalId: professional.id, active: true },
          },
        },
      });

      if (services.length !== serviceIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Certains services sont introuvables' });
      }

      let totalDuration = 0;
      let totalPrice = 0;

      const appointmentServices = services.map((service) => {
        const ps = service.professionals[0];
        const duration = ps?.customDurationMinutes ?? service.durationMinutes;
        const price = ps?.customPrice ?? service.price;
        totalDuration += duration;
        totalPrice += price;
        return { serviceId: service.id, serviceName: service.name, price, duration };
      });

      const { addMinutes } = await import('date-fns');
      const endTime = addMinutes(startTime, totalDuration);

      // Check slot availability
      const isAvailable = await availabilityService.isSlotAvailable(
        ctx.prisma,
        professional.id,
        startTime,
        endTime
      );

      if (!isAvailable) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ce créneau est déjà occupé' });
      }

      // Create appointment
      const appointment = await ctx.prisma.appointment.create({
        data: {
          clientId: clientProfile.id,
          professionalId: professional.id,
          salonId: professional.salonId,
          startTime,
          endTime,
          timezone: professional.salon.timezone,
          status: 'CONFIRMED',
          clientNotes,
          services: { create: appointmentServices },
        },
        include: {
          services: { include: { service: true } },
          client: { include: { user: true } },
          professional: { include: { user: true } },
          salon: true,
        },
      });

      // Send confirmation notification (async, don't block)
      notificationService.sendBookingConfirmation(ctx.prisma, appointment.id).catch((err) => {
        console.error('Failed to send manual booking confirmation:', err);
      });

      return appointment;
    }),
});
