import type { ItineraryItem } from '../core/models';
import { addDays, getDayKey, hasTime, parseLocalDate } from './dates';

/**
 * Client-side iCalendar (.ics) generation for "Add to calendar".
 *
 * Itinerary times are stored as floating local times (no zone), so we emit
 * floating DATE-TIME values (no trailing `Z`) and all-day DATE values for
 * date-only items, which calendar apps interpret in the user's local zone.
 */

/** Escape TEXT values per RFC 5545 §3.3.11. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** Fold lines longer than 75 octets per RFC 5545 §3.1. */
export function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (currentBytes + len > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += ch;
    currentBytes += len;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(dayKey: string) {
  return dayKey.replace(/-/g, '');
}

function formatLocalDateTime(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function formatUtcStamp(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export interface IcsOptions {
  /** Override DTSTAMP (useful for deterministic tests). */
  now?: Date;
  /** Product identifier. */
  prodId?: string;
}

/** Build the DTSTART/DTEND lines for an item. */
function eventTimes(item: ItineraryItem): string[] {
  if (hasTime(item.startDate)) {
    const start = parseLocalDate(item.startDate);
    if (!start) return [];
    let end = item.endDate && hasTime(item.endDate) ? parseLocalDate(item.endDate) : null;
    if (!end || end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 60 * 60 * 1000); // default 1h
    }
    return [`DTSTART:${formatLocalDateTime(start)}`, `DTEND:${formatLocalDateTime(end)}`];
  }
  const startKey = getDayKey(item.startDate);
  if (!startKey) return [];
  const endKey = item.endDate ? getDayKey(item.endDate) : startKey;
  // DTEND is exclusive for all-day events.
  const exclusiveEnd = addDays(endKey >= startKey ? endKey : startKey, 1);
  return [`DTSTART;VALUE=DATE:${formatDate(startKey)}`, `DTEND;VALUE=DATE:${formatDate(exclusiveEnd)}`];
}

export function buildIcsEvent(item: ItineraryItem, options: IcsOptions = {}): string {
  const now = options.now ?? new Date();
  const description = [
    item.description,
    item.confirmationNumber ? `Confirmation: ${item.confirmationNumber}` : '',
  ].filter(Boolean).join('\n');
  const location = [item.location?.name, item.location?.address].filter(Boolean).join(', ');

  const lines = [
    'BEGIN:VEVENT',
    `UID:${item.id}@vacay-planning`,
    `DTSTAMP:${formatUtcStamp(now)}`,
    ...eventTimes(item),
    `SUMMARY:${escapeIcsText(item.title || 'Trip item')}`,
    location ? `LOCATION:${escapeIcsText(location)}` : '',
    description ? `DESCRIPTION:${escapeIcsText(description)}` : '',
    item.location?.latitude != null && item.location?.longitude != null
      ? `GEO:${item.location.latitude};${item.location.longitude}`
      : '',
    'END:VEVENT',
  ].filter(Boolean);
  return lines.map(foldIcsLine).join('\r\n');
}

export function buildIcsCalendar(items: ItineraryItem[], options: IcsOptions = {}): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.prodId ?? '-//Vacay Planning//EN'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...items.map((i) => buildIcsEvent(i, options)),
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function icsFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${slug || 'event'}.ics`;
}

/** Trigger a browser download of an .ics file for a single item. */
export function downloadIcs(item: ItineraryItem) {
  const blob = new Blob([buildIcsCalendar([item])], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFileName(item.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
