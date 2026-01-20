import type { PrismaClient } from '@planity/database';
import {
  addMinutes,
  isBefore,
  startOfDay,
  endOfDay,
  getDay,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '@planity/types';
import { doTimeSlotsOverlap } from '@planity/utils';

const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export class AvailabilityService {
  /**
   * Get available time slots for a professional on a specific date
   * considering service duration, existing appointments, and buffer time
   *
   * This is the CRITICAL algorithm for the booking system
   */
  async getAvailableSlots(
    prisma: PrismaClient,
    professionalId: string,
    serviceIds: string[],
    date: Date
  ): Promise<TimeSlot[]> {
    // 1. Get professional with salon info
    const professional = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      include: {
        salon: true,
      },
    });

    if (!professional) {
      throw new Error('Professional not found');
    }

    const timezone = professional.salon.timezone;
    const zonedDate = utcToZonedTime(date, timezone);

    // 2. Calculate total service duration
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      include: {
        professionals: {
          where: {
            professionalId,
          },
        },
      },
    });

    const totalDuration = services.reduce((sum, service) => {
      const professionalService = service.professionals[0];
      return (
        sum +
        (professionalService?.customDurationMinutes || service.durationMinutes)
      );
    }, 0);

    // 3. Get professional's working hours for this day
    const dayOfWeek = DAY_OF_WEEK_MAP[getDay(zonedDate)];
    if (!dayOfWeek) {
      throw new Error('Invalid day of week');
    }

    const availability = await prisma.professionalAvailability.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId,
          dayOfWeek: dayOfWeek as any,
        },
      },
    });

    if (!availability || !availability.isAvailable) {
      return []; // Not working this day
    }

    // 4. Check for exceptions (holidays, sick days, special hours)
    const exception = await prisma.availabilityException.findFirst({
      where: {
        professionalId,
        date: {
          gte: startOfDay(zonedDate),
          lte: endOfDay(zonedDate),
        },
      },
    });

    if (exception?.type === 'UNAVAILABLE') {
      return []; // Professional is not available this day
    }

    // Use exception hours if type is CUSTOM, otherwise use regular hours
    const workStartTime =
      exception?.type === 'CUSTOM' && exception.startTime
        ? exception.startTime
        : availability.startTime;
    const workEndTime =
      exception?.type === 'CUSTOM' && exception.endTime
        ? exception.endTime
        : availability.endTime;

    // 5. Parse working hours
    const [startHour, startMinute] = workStartTime.split(':').map(Number);
    const [endHour, endMinute] = workEndTime.split(':').map(Number);

    if (
      startHour === undefined ||
      startMinute === undefined ||
      endHour === undefined ||
      endMinute === undefined
    ) {
      throw new Error('Invalid time format');
    }

    let workStart = new Date(zonedDate);
    workStart.setHours(startHour, startMinute, 0, 0);

    let workEnd = new Date(zonedDate);
    workEnd.setHours(endHour, endMinute, 0, 0);

    // 6. Handle break time
    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;

    if (availability.breakStartTime && availability.breakEndTime) {
      const [breakStartHour, breakStartMinute] = availability.breakStartTime
        .split(':')
        .map(Number);
      const [breakEndHour, breakEndMinute] = availability.breakEndTime
        .split(':')
        .map(Number);

      if (
        breakStartHour !== undefined &&
        breakStartMinute !== undefined &&
        breakEndHour !== undefined &&
        breakEndMinute !== undefined
      ) {
        breakStart = new Date(zonedDate);
        breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

        breakEnd = new Date(zonedDate);
        breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
      }
    }

    // 7. Get existing appointments for this professional on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: {
          gte: startOfDay(zonedDate),
          lte: endOfDay(zonedDate),
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // 8. Get buffer time from salon settings
    const bufferMinutes = professional.salon.bookingBufferMinutes;

    // 9. Generate all possible time slots (15-minute intervals)
    const slots: TimeSlot[] = [];
    let currentTime = workStart;

    while (
      isBefore(
        addMinutes(currentTime, totalDuration + bufferMinutes),
        workEnd
      ) ||
      addMinutes(currentTime, totalDuration + bufferMinutes).getTime() ===
        workEnd.getTime()
    ) {
      const slotEnd = addMinutes(currentTime, totalDuration);

      // Check if slot conflicts with break time
      let conflictsWithBreak = false;
      if (breakStart && breakEnd) {
        conflictsWithBreak = doTimeSlotsOverlap(
          currentTime,
          slotEnd,
          breakStart,
          breakEnd
        );
      }

      // Check if slot conflicts with existing appointments
      const conflictsWithAppointment = existingAppointments.some((apt) => {
        const aptEnd = addMinutes(apt.endTime, bufferMinutes);
        return doTimeSlotsOverlap(currentTime, slotEnd, apt.startTime, aptEnd);
      });

      // Check if slot is in the past
      const now = new Date();
      const isPast = isBefore(currentTime, now);

      const available =
        !conflictsWithBreak && !conflictsWithAppointment && !isPast;

      slots.push({
        startTime: currentTime,
        endTime: slotEnd,
        available,
      });

      // Move to next slot (15-minute intervals)
      currentTime = addMinutes(currentTime, 15);
    }

    return slots;
  }

  /**
   * Check if a specific time slot is available
   * Used for real-time validation during booking
   */
  async isSlotAvailable(
    prisma: PrismaClient,
    professionalId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return conflictingAppointments.length === 0;
  }

  /**
   * Get professional availability for a week
   */
  async getProfessionalWeeklyAvailability(
    prisma: PrismaClient,
    professionalId: string
  ) {
    const availability = await prisma.professionalAvailability.findMany({
      where: { professionalId },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return availability;
  }

  /**
   * Get availability exceptions for a professional
   */
  async getAvailabilityExceptions(
    prisma: PrismaClient,
    professionalId: string,
    startDate: Date,
    endDate: Date
  ) {
    const exceptions = await prisma.availabilityException.findMany({
      where: {
        professionalId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return exceptions;
  }
}

export const availabilityService = new AvailabilityService();
