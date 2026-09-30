import type { ItineraryItem } from '../core/models';
import { getDayKey, hasTime, parseLocalDate, toLocalDateTime } from './dates';

const DEFAULT_START_TIME = '09:00';

/**
 * Suggest a start date/time for a new item added to `dayKey`:
 * one hour after the latest timed event on that day (capped at 23:00),
 * `09:00` when the day has no timed events. Returns `null` without a day.
 */
export function suggestNewItemStart(items: ItineraryItem[], dayKey: string | null | undefined): string | null {
  if (!dayKey) return null;
  let latest: Date | null = null;
  for (const item of items) {
    const candidates: string[] = [];
    if (getDayKey(item.startDate) === dayKey) candidates.push(item.startDate);
    if (item.endDate && getDayKey(item.endDate) === dayKey) candidates.push(item.endDate);
    for (const c of candidates) {
      if (!hasTime(c)) continue;
      const d = parseLocalDate(c);
      if (d && (!latest || d > latest)) latest = d;
    }
  }
  if (!latest) return `${dayKey}T${DEFAULT_START_TIME}`;
  const next = new Date(latest.getTime() + 60 * 60 * 1000);
  if (getDayKey(toLocalDateTime(next)) !== dayKey || next.getHours() > 23) return `${dayKey}T23:00`;
  return toLocalDateTime(next);
}

/** Directions URL for an item's location (Google Maps universal link; opens native apps on mobile). */
export function getDirectionsUrl(location: ItineraryItem['location'] | undefined): string | null {
  if (!location) return null;
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  }
  const query = [location.name, location.address]
    .filter((s) => s && s !== 'TBD' && s !== 'Location TBD')
    .join(', ');
  return query ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}` : null;
}

/** Case-insensitive text match used by the timeline search box. */
export function itemMatchesQuery(item: ItineraryItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    item.title,
    item.description,
    item.confirmationNumber,
    item.location?.name,
    item.location?.address,
    item.type,
  ].some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
}
