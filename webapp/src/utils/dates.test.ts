import { describe, expect, it } from 'vitest';
import { addDays, dayDiff, getDayKey, getDayLabel, getTimeLabel, nightsBetween, parseLocalDate, toLocalDateTime } from './dates';

describe('getDayKey', () => {
  it('parses date-only strings as local dates (no UTC day shift)', () => {
    expect(getDayKey('2025-06-12')).toBe('2025-06-12');
    expect(parseLocalDate('2025-06-12')?.getDate()).toBe(12);
  });

  it('uses the local day of date-times', () => {
    expect(getDayKey('2025-06-12T23:30')).toBe('2025-06-12');
    expect(getDayKey('2025-06-12T00:05')).toBe('2025-06-12');
  });

  it('returns empty for empty input and falls back to the raw date part when invalid', () => {
    expect(getDayKey('')).toBe('');
    expect(getDayKey('not-a-dateTjunk')).toBe('not-a-date');
  });
});

describe('getDayLabel', () => {
  it('formats short labels as "Wed 6/12"', () => {
    expect(getDayLabel('2024-06-12')).toBe('Wed 6/12');
  });

  it('formats long labels in upper case and handles missing dates', () => {
    expect(getDayLabel('2024-06-12', 'long')).toMatch(/^WED.*JUN.*12$/);
    expect(getDayLabel('', 'long')).toBe('DATE TBD');
  });
});

describe('getTimeLabel', () => {
  it('is empty for date-only strings', () => {
    expect(getTimeLabel('2024-06-12')).toBe('');
    expect(getTimeLabel(undefined)).toBe('');
  });

  it('formats times and optionally hides noon', () => {
    expect(getTimeLabel('2024-06-12T14:30')).toMatch(/2:30/);
    expect(getTimeLabel('2024-06-12T12:00', true)).toBe('');
    expect(getTimeLabel('2024-06-12T12:00')).not.toBe('');
  });
});

describe('dayDiff / nightsBetween', () => {
  it('counts calendar days regardless of time of day', () => {
    expect(dayDiff('2024-06-12T23:00', '2024-06-13T01:00')).toBe(1);
    expect(dayDiff('2024-06-12', '2024-06-12T18:00')).toBe(0);
    expect(dayDiff('2024-06-13', '2024-06-12')).toBe(-1);
  });

  it('is DST-safe', () => {
    expect(dayDiff('2024-03-09', '2024-03-11')).toBe(2);
    expect(dayDiff('2024-11-02', '2024-11-04')).toBe(2);
  });

  it('computes hotel nights and never goes negative', () => {
    expect(nightsBetween('2024-06-12T15:00', '2024-06-15T11:00')).toBe(3);
    expect(nightsBetween('2024-06-12', undefined)).toBe(0);
    expect(nightsBetween('2024-06-12', '2024-06-10')).toBe(0);
  });
});

describe('addDays / toLocalDateTime', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('formats local date-times', () => {
    expect(toLocalDateTime(new Date(2024, 5, 7, 8, 5))).toBe('2024-06-07T08:05');
  });
});
