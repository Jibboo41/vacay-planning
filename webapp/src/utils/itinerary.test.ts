import { describe, expect, it } from 'vitest';
import type { ItineraryItem } from '../core/models';
import { getDirectionsUrl, itemMatchesQuery, suggestNewItemStart } from './itinerary';

const loc = { name: 'Park', address: 'Somewhere', latitude: null, longitude: null };
const mk = (id: string, startDate: string, endDate?: string): ItineraryItem => ({ id, type: 'activity', title: id, startDate, endDate, location: loc });

describe('suggestNewItemStart', () => {
  it('suggests one hour after the last timed event of the day', () => {
    const items = [mk('a', '2024-06-12T09:00'), mk('b', '2024-06-12T13:15', '2024-06-12T15:00'), mk('c', '2024-06-13T08:00')];
    expect(suggestNewItemStart(items, '2024-06-12')).toBe('2024-06-12T16:00');
  });

  it('defaults to 09:00 for days without timed items and caps at 23:00', () => {
    expect(suggestNewItemStart([mk('a', '2024-06-12')], '2024-06-12')).toBe('2024-06-12T09:00');
    expect(suggestNewItemStart([mk('a', '2024-06-12T23:30')], '2024-06-12')).toBe('2024-06-12T23:00');
    expect(suggestNewItemStart([], null)).toBeNull();
  });
});

describe('getDirectionsUrl', () => {
  it('prefers coordinates, then name/address, and skips placeholders', () => {
    expect(getDirectionsUrl({ ...loc, latitude: 1, longitude: 2 })).toContain('destination=1,2');
    expect(getDirectionsUrl(loc)).toContain(encodeURIComponent('Park, Somewhere'));
    expect(getDirectionsUrl({ name: 'TBD', address: 'Location TBD', latitude: null, longitude: null })).toBeNull();
  });
});

describe('itemMatchesQuery', () => {
  it('matches title, location and confirmation number case-insensitively', () => {
    const it1 = { ...mk('Dinner', '2024-06-12'), confirmationNumber: 'XYZ9' };
    expect(itemMatchesQuery(it1, 'dinn')).toBe(true);
    expect(itemMatchesQuery(it1, 'park')).toBe(true);
    expect(itemMatchesQuery(it1, 'xyz9')).toBe(true);
    expect(itemMatchesQuery(it1, 'nope')).toBe(false);
    expect(itemMatchesQuery(it1, '  ')).toBe(true);
  });
});
