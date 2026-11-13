import type { ActivityBooking, ItineraryItem } from './models';
import { isDayKey } from './timelineDetails';

const WINDOW_LIMITS = { days: 3650, weeks: 520, months: 120 };

export function supportsActivityBooking(type: ItineraryItem['type']): boolean {
  return type === 'activity' || type === 'hiking' || type === 'hike';
}

/** Calendar arithmetic: a one-month window before July 31 opens on June 30. */
export function bookingOpensOn(startDate: string, window?: ActivityBooking['opensBefore']): string | undefined {
  const key = startDate.slice(0, 10);
  if (!window || !isDayKey(key) || !Number.isInteger(window.amount) || window.amount < 0 || !(window.unit in WINDOW_LIMITS) || window.amount > WINDOW_LIMITS[window.unit]) return;
  const date = new Date(`${key}T12:00:00Z`);
  if (window.unit === 'months') {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - window.amount);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  } else date.setUTCDate(date.getUTCDate() - window.amount * (window.unit === 'weeks' ? 7 : 1));
  return date.toISOString().slice(0, 10);
}

export function bookingDateLabel(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function safeBookingUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && trimmed.length <= 4096) return url.href;
  } catch { /* Show a consistent validation message. */ }
  throw new Error('Enter a complete HTTP or HTTPS booking link.');
}

export function validateActivityBooking(booking: ActivityBooking, startDate: string): ActivityBooking {
  if (booking.status !== 'not-booked') return { status: booking.status };
  const window = booking.opensBefore;
  if (window && (!Number.isInteger(window.amount) || window.amount < 0 || !(window.unit in WINDOW_LIMITS) || window.amount > WINDOW_LIMITS[window.unit])) {
    throw new Error('Enter a whole number from 0 to 3,650 days, 520 weeks, or 120 months.');
  }
  if (booking.bookBy) {
    if (!isDayKey(booking.bookBy)) throw new Error('Choose a valid book-by date.');
    if (booking.bookBy > startDate.slice(0, 10)) throw new Error('The book-by date must be on or before the activity.');
    const opens = bookingOpensOn(startDate, window);
    if (opens && booking.bookBy < opens) throw new Error('The book-by date cannot be before booking opens.');
  }
  return { ...booking, url: safeBookingUrl(booking.url || '') || undefined };
}
