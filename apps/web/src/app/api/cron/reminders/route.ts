import { NextResponse } from 'next/server';
import { prisma } from '@letsforbook/database';
import { notificationService } from '@letsforbook/api';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Vercel Cron configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Cron job to send appointment reminders
 * - 7 days before: First reminder
 * - 1 day before: Final reminder with cancellation warning
 *
 * Configure this endpoint in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 8 * * *"  // Every day at 8am
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env['CRON_SECRET'];

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      sevenDayReminders: 0,
      oneDayReminders: 0,
      errors: [] as string[],
    };

    // ==================== 7 DAYS REMINDERS ====================
    // Get appointments that are exactly 7 days from now
    const sevenDaysFromNow = addDays(now, 7);
    const sevenDaysStart = startOfDay(sevenDaysFromNow);
    const sevenDaysEnd = endOfDay(sevenDaysFromNow);

    const appointmentsIn7Days = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: sevenDaysStart,
          lte: sevenDaysEnd,
        },
        status: 'CONFIRMED',
        // Don't send if already sent
        notifications: {
          none: {
            type: 'BOOKING_REMINDER',
            body: {
              contains: '7 jours',
            },
          },
        },
      },
      select: { id: true },
    });

    console.log(`Found ${appointmentsIn7Days.length} appointments in 7 days`);

    for (const appointment of appointmentsIn7Days) {
      try {
        await notificationService.sendBookingReminder(prisma, appointment.id, '7_DAYS');
        results.sevenDayReminders++;
      } catch (error) {
        const errorMessage = `Failed to send 7-day reminder for appointment ${appointment.id}: ${error}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
    }

    // ==================== 1 DAY REMINDERS ====================
    // Get appointments that are exactly 1 day from now
    const oneDayFromNow = addDays(now, 1);
    const oneDayStart = startOfDay(oneDayFromNow);
    const oneDayEnd = endOfDay(oneDayFromNow);

    const appointmentsIn1Day = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: oneDayStart,
          lte: oneDayEnd,
        },
        status: 'CONFIRMED',
        // Don't send if already sent today
        notifications: {
          none: {
            type: 'BOOKING_REMINDER',
            body: {
              contains: 'demain',
            },
            createdAt: {
              gte: startOfDay(now),
            },
          },
        },
      },
      select: { id: true },
    });

    console.log(`Found ${appointmentsIn1Day.length} appointments tomorrow`);

    for (const appointment of appointmentsIn1Day) {
      try {
        await notificationService.sendBookingReminder(prisma, appointment.id, '1_DAY');
        results.oneDayReminders++;
      } catch (error) {
        const errorMessage = `Failed to send 1-day reminder for appointment ${appointment.id}: ${error}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
    }

    console.log('Reminder cron completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Reminder cron failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
