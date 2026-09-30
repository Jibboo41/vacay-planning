/**
 * Date helpers shared across the webapp.
 *
 * Itinerary dates are stored either as date-only strings (`2025-06-12`) or as
 * local date-times without a zone (`2025-06-12T14:30`). Date-only strings must be
 * parsed as *local* midnight — `new Date('2025-06-12')` is UTC midnight, which
 * lands on the previous day west of Greenwich — so we swap dashes for slashes.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse an itinerary date string in local time. Returns `null` when invalid/empty. */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

export function hasTime(dateString: string | null | undefined): boolean {
  return !!dateString && dateString.includes('T');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** `YYYY-MM-DD` key for a Date in local time. */
export function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local `YYYY-MM-DD` day key for an itinerary date string. */
export function getDayKey(dateString: string): string {
  if (!dateString) return '';
  const d = parseLocalDate(dateString);
  if (!d) return dateString.split('T')[0];
  return toDayKey(d);
}

/** Today's local day key. */
export function todayKey(now: Date = new Date()): string {
  return toDayKey(now);
}

/**
 * Human day label.
 * - `short` (default): `Wed 6/12` — timeline day headers.
 * - `long`: `WED, JUN 12` — card date badges (returns `DATE TBD` for missing dates).
 */
export function getDayLabel(dateString: string, format: 'short' | 'long' = 'short'): string {
  const d = parseLocalDate(dateString);
  if (!d) return format === 'long' ? 'DATE TBD' : '';
  if (format === 'long') {
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  }
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Localised time label (`2:30 PM`). Empty for date-only strings.
 * When `hideNoon` is true, exactly 12:00 is treated as "no time" (used for notes).
 */
export function getTimeLabel(dateString: string | null | undefined, hideNoon = false): string {
  if (!dateString || !hasTime(dateString)) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  if (hideNoon && d.getHours() === 12 && d.getMinutes() === 0) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Whole calendar days from day `a` to day `b` (DST-safe). Accepts date strings or day keys. */
export function dayDiff(a: string, b: string): number {
  const ka = getDayKey(a);
  const kb = getDayKey(b);
  if (!ka || !kb) return 0;
  const [ya, ma, da] = ka.split('-').map(Number);
  const [yb, mb, db] = kb.split('-').map(Number);
  if ([ya, ma, da, yb, mb, db].some((n) => Number.isNaN(n))) return 0;
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / MS_PER_DAY);
}

/** Number of nights between check-in and check-out (never negative). */
export function nightsBetween(start: string, end: string | null | undefined): number {
  if (!end) return 0;
  return Math.max(0, dayDiff(start, end));
}

/** Add `days` to a day key, returning a new day key. */
export function addDays(dayKey: string, days: number): string {
  const d = parseLocalDate(dayKey);
  if (!d) return dayKey;
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

/** Format a Date as a local `YYYY-MM-DDTHH:mm` string (the format used by datetime-local inputs). */
export function toLocalDateTime(d: Date): string {
  return `${toDayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
