import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { notificationService } from '../services/notification.service';

export const notificationRouter = router({
  /**
   * Get my notifications
   * PROTECTED
   */
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const result = await notificationService.getUserNotifications(
        ctx.prisma,
        ctx.user.id,
        limit,
        cursor
      );

      return result;
    }),

  /**
   * Get unsent notification count
   * PROTECTED
   */
  getUnsentCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.user.id,
        sent: false,
      },
    });

    return { count };
  }),

  /**
   * Delete notification
   * PROTECTED
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== ctx.user.id) {
        throw new Error('You can only delete your own notifications');
      }

      await ctx.prisma.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Delete all sent notifications
   * PROTECTED
   */
  deleteAllSent: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.deleteMany({
      where: {
        userId: ctx.user.id,
        sent: true,
      },
    });

    return { success: true };
  }),
});
