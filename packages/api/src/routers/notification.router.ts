import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { notificationService } from '../services/notification.service';

export const notificationRouter = router({
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      return notificationService.getUserNotifications(ctx.prisma, ctx.user.id, limit, cursor);
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.user.id,
        channel: 'IN_APP',
        readAt: null,
      },
    });
    return { count };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!notification || notification.userId !== ctx.user.id) {
        throw new Error('Notification not found');
      }

      await ctx.prisma.notification.update({
        where: { id: input.id },
        data: { readAt: new Date() },
      });

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.user.id,
        channel: 'IN_APP',
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!notification || notification.userId !== ctx.user.id) {
        throw new Error('Notification not found');
      }

      await ctx.prisma.notification.delete({ where: { id: input.id } });
      return { success: true };
    }),

  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.deleteMany({
      where: {
        userId: ctx.user.id,
        readAt: { not: null },
      },
    });
    return { success: true };
  }),
});
