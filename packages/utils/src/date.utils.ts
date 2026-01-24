import {
  addMinutes,
  format,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Format date to HH:mm string
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Parse HH:mm string to Date object for today
 */
export function parseTime(time: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = time.split(':').map(Number);
  if (hours === undefined || minutes === undefined) {
    throw new Error('Invalid time format. Expected HH:mm');
  }

  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Check if two time slots overlap
 */
export function doTimeSlotsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return (
    (isAfter(start1, start2) && isBefore(start1, end2)) ||
    (isAfter(end1, start2) && isBefore(end1, end2)) ||
    (isBefore(start1, start2) && isAfter(end1, end2)) ||
    (start1.getTime() === start2.getTime() && end1.getTime() === end2.getTime())
  );
}

/**
 * Generate time slots between start and end with given interval
 */
export function generateTimeSlots(
  start: Date,
  end: Date,
  intervalMinutes: number
): Date[] {
  const slots: Date[] = [];
  let current = start;

  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    slots.push(current);
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'PPP');
}

/**
 * Format time for display
 */
export function formatDisplayTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'p');
}

/**
 * Get start of day in timezone
 */
export function getStartOfDay(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayZoned = startOfDay(zonedDate);
  return fromZonedTime(startOfDayZoned, timezone);
}

/**
 * Get end of day in timezone
 */
export function getEndOfDay(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDayZoned = endOfDay(zonedDate);
  return fromZonedTime(endOfDayZoned, timezone);
}

/**
 * Calculate duration in minutes between two dates
 */
export function getDurationMinutes(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * Check if date is in the past
 */
export function isInPast(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Convert timezone date to UTC
 */
export function toUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Convert UTC date to timezone
 */
export function fromUTC(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}
