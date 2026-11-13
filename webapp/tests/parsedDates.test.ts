import { describe, expect, it } from 'vitest';
import { explicitSourceDates, normalizeParsedDate } from '../src/core/parsedDates';

describe('AI date preservation', () => {
  const text = 'The Greatest Showman\nTheatre Royal Drury Lane\nFri 02 Jul 2027, 07:00 PM';
  it('preserves an explicit year and time even if the default trip year differs', () => {
    const dates = explicitSourceDates(text);
    expect(dates).toEqual(['2027-07-02']);
    expect(normalizeParsedDate('2027-07-02T19:00:00', 2026, dates)).toBe('2027-07-02T19:00:00');
    expect(normalizeParsedDate('2026-07-02T19:00:00', 2026, dates)).toBe('2027-07-02T19:00:00');
  });
  it('supports multiple source dates and keeps each explicit year', () => {
    const dates = explicitSourceDates('Dec 31, 2026 to 2 January 2027');
    expect(normalizeParsedDate('2026-12-31T10:00:00', 2026, dates)).toBe('2026-12-31T10:00:00');
    expect(normalizeParsedDate('2026-01-02T10:00:00', 2026, dates)).toBe('2027-01-02T10:00:00');
  });
  it('rejects ambiguous years for the same day rather than guessing', () => {
    const dates = explicitSourceDates('2 July 2026 and 2 July 2027');
    expect(() => normalizeParsedDate('2026-07-02T19:00:00', 2026, dates)).toThrow('multiple years');
  });
  it('uses the fallback year only for dates with no valid year', () => {
    expect(normalizeParsedDate('NaN-07-02T19:00:00', 2027, [])).toBe('2027-07-02T19:00:00');
    expect(normalizeParsedDate('07-02T19:00:00', 2027, [])).toBe('2027-07-02T19:00:00');
  });
});
