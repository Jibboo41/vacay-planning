import { describe, expect, it } from 'vitest';
import { formatTimelineDayLabel, isDayKey, timelineDates, validateImageUrl } from '../src/core/timelineDetails';

describe('calendar descriptions', () => {
  it('shows the saved year and its actual weekday for future travel dates', () => {
    expect(formatTimelineDayLabel('2026-06-26')).toBe('Fri 6/26/2026');
    expect(formatTimelineDayLabel('2027-06-26')).toBe('Sat 6/26/2027');
    expect(formatTimelineDayLabel('2027-06-25')).toBe('Fri 6/25/2027');
    expect(formatTimelineDayLabel('2027-02-29')).toBe('Date TBD');
  });
  it('includes unplanned days between arrival and checkout', () => {
    expect(timelineDates(['2026-10-17', '2026-10-20'], {})).toEqual(['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20']);
  });
  it('keeps descriptions visible after the last item on that date moves away', () => {
    expect(timelineDates(['2026-10-18'], { '2026-10-17': 'Arrive and settle in.' })).toEqual(['2026-10-17', '2026-10-18']);
  });
  it('handles leap days and year boundaries without timezone shifts', () => {
    expect(timelineDates(['2028-02-28', '2028-03-01'], {})).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    expect(timelineDates(['2026-12-31', '2027-01-01'], {})).toEqual(['2026-12-31', '2027-01-01']);
  });
  it('rejects invalid dates and avoids unbounded empty-day creation', () => {
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2026-02-29')).toBe(false);
    expect(timelineDates(['2020-01-01', 'bad', '2026-01-01'], {})).toHaveLength(2);
    expect(timelineDates([], { 'invalid': 'bad', '2026-10-17': '' })).toEqual([]);
  });
});

describe('item image links', () => {
  it('allows empty values and normalizes HTTPS links', () => {
    expect(validateImageUrl('  ')).toBe('');
    expect(validateImageUrl(' https://example.com/a photo.jpg ')).toBe('https://example.com/a%20photo.jpg');
  });
  it.each(['http://example.com/photo.jpg', 'javascript:alert(1)', 'data:image/svg+xml,test', 'https://user:password@example.com/a', 'photo.jpg'])('rejects unsafe or incomplete link %s', value => {
    expect(() => validateImageUrl(value)).toThrow();
  });
});
