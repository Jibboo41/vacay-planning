export const MAX_DAY_DESCRIPTION_LENGTH = 1000;

export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Descriptions belong to calendar dates, independently of item order or filters. */
export function timelineDates(itemDates: string[], descriptions: Record<string, string>): string[] {
  const dates = new Set(itemDates.filter(isDayKey));
  Object.entries(descriptions).forEach(([date, text]) => {
    if (text.trim() && isDayKey(date)) dates.add(date);
  });
  const sorted = [...dates].sort();
  if (sorted.length < 2) return sorted;
  const first = new Date(`${sorted[0]}T12:00:00Z`);
  const last = new Date(`${sorted.at(-1)}T12:00:00Z`);
  // Avoid creating thousands of empty rows for malformed or unusually long itineraries.
  if ((last.getTime() - first.getTime()) / 86_400_000 > 366) return sorted;
  for (const date = first; date <= last; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.add(date.toISOString().slice(0, 10));
  }
  return [...dates].sort();
}

export function validateImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:' && !url.username && !url.password && trimmed.length <= 4096) return url.href;
  } catch { /* Return one consistent validation message. */ }
  throw new Error('Use a complete HTTPS image link, or choose a photo from your device.');
}
