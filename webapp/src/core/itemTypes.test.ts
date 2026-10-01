import { describe, expect, it } from 'vitest';
import { FILTER_GROUPS, ITEM_TYPES, getEventLabel, getItemTone, getItemTypeMeta, resolveItemType } from './itemTypes';
import type { ItineraryItem } from './models';

const base = { title: 'x' } as const;

describe('resolveItemType', () => {
  it('maps legacy "hike" to hiking', () => {
    expect(resolveItemType({ ...base, type: 'hike' })).toBe('hiking');
  });

  it('treats any item with hikeDetails as a hike', () => {
    const hikeDetails: ItineraryItem['hikeDetails'] = { difficulty: 'Easy', distance: '1 mi', duration: '1h', elevation: '10 ft' };
    expect(resolveItemType({ type: 'activity', hikeDetails })).toBe('hiking');
  });

  it('falls back to unknown for unrecognised types', () => {
    expect(resolveItemType({ type: 'spaceship' as ItineraryItem['type'] })).toBe('unknown');
  });
});

describe('registry', () => {
  it('has an icon, label and color classes for every type', () => {
    for (const meta of Object.values(ITEM_TYPES)) {
      expect(meta.icon).toBeTruthy();
      expect(meta.label).toBeTruthy();
      expect(meta.textClass).toMatch(/^text-/);
      expect(meta.bgClass).toMatch(/^bg-/);
    }
  });

  it('uses the right start/end labels', () => {
    expect(getItemTypeMeta({ type: 'hotel' }).startLabel).toBe('CHECK-IN');
    expect(getItemTypeMeta({ type: 'hotel' }).endLabel).toBe('CHECK-OUT');
    expect(getItemTypeMeta({ type: 'rental-car' }).startLabel).toBe('PICKUP');
    expect(getItemTypeMeta({ type: 'rental-car' }).endLabel).toBe('RETURN');
    expect(getItemTypeMeta({ type: 'flight' }).startLabel).toBe('TAKEOFF');
    expect(getItemTypeMeta({ type: 'flight' }).endLabel).toBe('LANDING');
  });

  it('uses the check-out tone for hotel end events', () => {
    expect(getItemTone({ type: 'hotel' }, true)).not.toEqual(getItemTone({ type: 'hotel' }, false));
    expect(getItemTone({ type: 'food' }, true)).toEqual(getItemTone({ type: 'food' }, false));
  });

  it('assigns every type to a filter group that exists', () => {
    const groups = new Set(FILTER_GROUPS.map((g) => g.key));
    for (const meta of Object.values(ITEM_TYPES)) {
      if (meta.filterGroup) expect(groups.has(meta.filterGroup)).toBe(true);
    }
  });

  it('builds event labels', () => {
    expect(getEventLabel({ type: 'hotel', title: 'Inn' }, false)).toBe('CHECK-IN');
    expect(getEventLabel({ type: 'hotel', title: 'Inn' }, true)).toBe('CHECK-OUT');
  });
});
