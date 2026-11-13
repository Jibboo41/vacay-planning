import { isDayKey } from './timelineDetails';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Cross-check model dates against unambiguous, explicitly dated source text. */
export function explicitSourceDates(text: string): string[] {
  const dates = new Set<string>();
  const add = (year: string, month: number, day: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isDayKey(key)) dates.add(key);
  };
  const monthNumber = (value: string) => MONTHS.indexOf(value.toLowerCase().slice(0, 3)) + 1;
  const month = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember|t)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${month}\\.?[\\s,]+(20\\d{2})\\b`, 'gi'))) add(m[3], monthNumber(m[2]), Number(m[1]));
  for (const m of text.matchAll(new RegExp(`\\b${month}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[\\s,]+(20\\d{2})\\b`, 'gi'))) add(m[3], monthNumber(m[1]), Number(m[2]));
  for (const m of text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) add(m[1], Number(m[2]), Number(m[3]));
  return [...dates];
}

export function reconcileParsedDate(value: string, sourceDates: string[]): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(value);
  if (!match) return value;
  const matching = sourceDates.filter(date => date.slice(5) === `${match[2]}-${match[3]}`);
  if (matching.length > 1) throw new Error('The source contains the same date in multiple years. Check the dates and try again.');
  return matching.length === 1 ? matching[0] + match[4] : value;
}

export function normalizeParsedDate(value: string, defaultYear: number, sourceDates: string[]): string {
  if (!value) return value;
  const full = /^(\d{4}|NaN)-(\d{2})-(\d{2})(.*)$/.exec(value);
  if (full) {
    const year = Number(full[1]) >= 2000 ? full[1] : String(defaultYear);
    return reconcileParsedDate(`${year}-${full[2]}-${full[3]}${full[4]}`, sourceDates);
  }
  const short = /^(\d{1,2})[/-](\d{1,2})(T.*)?$/.exec(value);
  if (short) return reconcileParsedDate(`${defaultYear}-${short[1].padStart(2, '0')}-${short[2].padStart(2, '0')}${short[3] || 'T12:00:00'}`, sourceDates);
  return value;
}
