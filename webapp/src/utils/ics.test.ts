import { describe, expect, it } from 'vitest';
import type { ItineraryItem } from '../core/models';
import { buildIcsCalendar, buildIcsEvent, escapeIcsText, foldIcsLine, icsFileName } from './ics';

const now = new Date(Date.UTC(2024, 0, 2, 3, 4, 5));
const loc = { name: 'Cafe, Main', address: '1 Main St', latitude: 40.1, longitude: -105.2 };

function item(overrides: Partial<ItineraryItem>): ItineraryItem {
  return { id: 'i1', type: 'activity', title: 'Visit', startDate: '2024-06-12T14:30', location: loc, ...overrides };
}

describe('ics', () => {
  it('escapes text per RFC 5545', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds long lines at 75 octets', () => {
    const folded = foldIcsLine(`SUMMARY:${'x'.repeat(200)}`);
    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(lines.slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'x'.repeat(200)}`);
  });

  it('builds a timed event with floating local times and a default 1h duration', () => {
    const ev = buildIcsEvent(item({}), { now });
    expect(ev).toContain('UID:i1@vacay-planning');
    expect(ev).toContain('DTSTAMP:20240102T030405Z');
    expect(ev).toContain('DTSTART:20240612T143000');
    expect(ev).toContain('DTEND:20240612T153000');
    expect(ev).toContain('SUMMARY:Visit');
    expect(ev).toContain('LOCATION:Cafe\\, Main\\, 1 Main St');
    expect(ev).toContain('GEO:40.1;-105.2');
  });

  it('uses the item end time when present', () => {
    const ev = buildIcsEvent(item({ endDate: '2024-06-13T10:00' }), { now });
    expect(ev).toContain('DTEND:20240613T100000');
  });

  it('builds all-day events with an exclusive end date', () => {
    const ev = buildIcsEvent(item({ type: 'hotel', startDate: '2024-06-12', endDate: '2024-06-15' }), { now });
    expect(ev).toContain('DTSTART;VALUE=DATE:20240612');
    expect(ev).toContain('DTEND;VALUE=DATE:20240616');
  });

  it('includes the confirmation number in the description', () => {
    const ev = buildIcsEvent(item({ description: 'Bring ID', confirmationNumber: 'ABC123' }), { now });
    expect(ev).toContain('DESCRIPTION:Bring ID\\nConfirmation: ABC123');
  });

  it('wraps events in a VCALENDAR with CRLF line endings', () => {
    const cal = buildIcsCalendar([item({})], { now });
    expect(cal.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(cal.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(cal).not.toMatch(/[^\r]\n/);
  });

  it('creates safe file names', () => {
    expect(icsFileName('Flight to NYC!')).toBe('flight-to-nyc.ics');
    expect(icsFileName('***')).toBe('event.ics');
  });
});
