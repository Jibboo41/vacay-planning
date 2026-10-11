import type { LucideIcon } from 'lucide-react';
import {
  Plane, BedDouble, Car, Navigation, MountainSnow, TrainFront, Utensils, StickyNote, CalendarClock,
} from 'lucide-react';
import type { Expense, ItineraryItem } from './models';

/**
 * Single source of truth for everything that varies by itinerary item type:
 * icon, color tokens, labels, filter grouping and expense category.
 *
 * Colors reference the `--color-type-*` tokens in `src/styles/tokens.css`.
 * The Tailwind classes below are written out in full (not built from strings)
 * so the Tailwind scanner can see them.
 */

export type ItemTypeKey =
  | 'flight' | 'hotel' | 'rental-car' | 'activity' | 'hiking' | 'transit' | 'food' | 'note' | 'unknown';

export type FilterGroup = 'flights' | 'lodging' | 'food' | 'hikes' | 'activities' | 'transit' | 'notes';

export interface ItemTypeTone {
  /** CSS custom property holding the color, e.g. `--color-type-flight`. */
  colorVar: string;
  /** Hex mirror of the token for contexts that cannot read CSS vars (SVG attrs, Leaflet polylines). */
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export interface ItemTypeMeta extends ItemTypeTone {
  key: ItemTypeKey;
  label: string;
  icon: LucideIcon;
  filterGroup: FilterGroup;
  /** Label for the start event, e.g. TAKEOFF / CHECK-IN / PICKUP. */
  startLabel: string;
  /** Label for the end event, e.g. LANDING / CHECK-OUT / RETURN. */
  endLabel: string;
  /** Tiny label rendered under the icon for split start/end cards (IN/OUT, PKUP/RET). */
  startShort?: string;
  endShort?: string;
  /** Multi-day items that render a separate end-event card (hotel checkout, car return). */
  hasEndEvent: boolean;
  /** Tone override for the end-event card (e.g. hotel check-out is red). */
  endTone?: ItemTypeTone;
  /** Items of this type fetch per-location weather. */
  weatherRelevant: boolean;
  /** Expense category used by the cost tracker. */
  expenseCategory?: Expense['category'];
  /** Color used for map markers (activity uses sky blue so it's visible on tiles). */
  mapHex: string;
}

const tone = {
  flight: { colorVar: '--color-type-flight', hex: '#0A84FF', textClass: 'text-type-flight', bgClass: 'bg-type-flight/10', borderClass: 'border-type-flight' },
  hotel: { colorVar: '--color-type-hotel', hex: '#FF9F0A', textClass: 'text-type-hotel', bgClass: 'bg-type-hotel/10', borderClass: 'border-type-hotel' },
  hotelOut: { colorVar: '--color-type-hotel-out', hex: '#FF3B30', textClass: 'text-type-hotel-out', bgClass: 'bg-type-hotel-out/10', borderClass: 'border-type-hotel-out' },
  rental: { colorVar: '--color-type-rental', hex: '#64D2FF', textClass: 'text-type-rental', bgClass: 'bg-type-rental/10', borderClass: 'border-type-rental' },
  activity: { colorVar: '--color-type-activity', hex: '#EBEBF5', textClass: 'text-type-activity', bgClass: 'bg-white/5', borderClass: 'border-type-activity' },
  hike: { colorVar: '--color-type-hike', hex: '#30D158', textClass: 'text-type-hike', bgClass: 'bg-type-hike/10', borderClass: 'border-type-hike' },
  transit: { colorVar: '--color-type-transit', hex: '#5E5CE6', textClass: 'text-type-transit', bgClass: 'bg-type-transit/10', borderClass: 'border-type-transit' },
  food: { colorVar: '--color-type-food', hex: '#BF5AF2', textClass: 'text-type-food', bgClass: 'bg-type-food/10', borderClass: 'border-type-food' },
  note: { colorVar: '--color-type-note', hex: '#8E8E93', textClass: 'text-type-note', bgClass: 'bg-type-note/10', borderClass: 'border-type-note' },
} satisfies Record<string, ItemTypeTone>;

export const ITEM_TYPES: Record<ItemTypeKey, ItemTypeMeta> = {
  flight: {
    key: 'flight', label: 'Flight', icon: Plane, filterGroup: 'flights', ...tone.flight,
    startLabel: 'TAKEOFF', endLabel: 'LANDING', hasEndEvent: false, weatherRelevant: false,
    expenseCategory: 'Flights', mapHex: '#0A84FF',
  },
  hotel: {
    key: 'hotel', label: 'Lodging', icon: BedDouble, filterGroup: 'lodging', ...tone.hotel,
    startLabel: 'CHECK-IN', endLabel: 'CHECK-OUT', startShort: 'IN', endShort: 'OUT',
    hasEndEvent: true, endTone: tone.hotelOut, weatherRelevant: true,
    expenseCategory: 'Lodging', mapHex: '#FF9F0A',
  },
  'rental-car': {
    key: 'rental-car', label: 'Rental Car', icon: Car, filterGroup: 'transit', ...tone.rental,
    startLabel: 'PICKUP', endLabel: 'RETURN', startShort: 'PKUP', endShort: 'RET',
    hasEndEvent: true, weatherRelevant: false,
    expenseCategory: 'Car Rental', mapHex: '#64D2FF',
  },
  activity: {
    key: 'activity', label: 'Activity', icon: Navigation, filterGroup: 'activities', ...tone.activity,
    startLabel: 'START', endLabel: 'END', hasEndEvent: false, weatherRelevant: true, mapHex: '#64D2FF',
  },
  hiking: {
    key: 'hiking', label: 'Hike', icon: MountainSnow, filterGroup: 'hikes', ...tone.hike,
    startLabel: 'START', endLabel: 'END', hasEndEvent: false, weatherRelevant: true, mapHex: '#30D158',
  },
  transit: {
    key: 'transit', label: 'Transit', icon: TrainFront, filterGroup: 'transit', ...tone.transit,
    startLabel: 'START', endLabel: 'END', hasEndEvent: false, weatherRelevant: false, mapHex: '#5E5CE6',
  },
  food: {
    key: 'food', label: 'Dining', icon: Utensils, filterGroup: 'food', ...tone.food,
    startLabel: 'DINING', endLabel: 'END', hasEndEvent: false, weatherRelevant: false,
    expenseCategory: 'Dining', mapHex: '#BF5AF2',
  },
  note: {
    key: 'note', label: 'Note', icon: StickyNote, filterGroup: 'notes', ...tone.note,
    startLabel: 'NOTE', endLabel: 'END', hasEndEvent: false, weatherRelevant: false, mapHex: '#8E8E93',
  },
  unknown: {
    key: 'unknown', label: 'Other', icon: CalendarClock, filterGroup: 'activities', ...tone.activity,
    startLabel: 'START', endLabel: 'END', hasEndEvent: false, weatherRelevant: false, mapHex: '#8E8E93',
  },
};

export const FILTER_GROUPS: { key: FilterGroup; label: string }[] = [
  { key: 'flights', label: 'Flights' },
  { key: 'lodging', label: 'Lodging' },
  { key: 'food', label: 'Food' },
  { key: 'hikes', label: 'Hikes' },
  { key: 'activities', label: 'Activities' },
  { key: 'transit', label: 'Transit' },
  { key: 'notes', label: 'Notes' },
];

/**
 * Resolve the effective type key for an item. `hikeDetails` always wins so a
 * mis-typed item that carries trail data still renders as a hike, and the
 * legacy `'hike'` spelling is normalised to `'hiking'`.
 */
export function resolveItemType(item: Pick<ItineraryItem, 'type' | 'hikeDetails'>): ItemTypeKey {
  if (item.hikeDetails) return 'hiking';
  const t = item.type as string;
  if (t === 'hike') return 'hiking';
  return t in ITEM_TYPES ? (t as ItemTypeKey) : 'unknown';
}

export function getItemTypeMeta(item: Pick<ItineraryItem, 'type' | 'hikeDetails'>): ItemTypeMeta {
  return ITEM_TYPES[resolveItemType(item)];
}

/** Tone (colors) for an item, taking the end-event override into account. */
export function getItemTone(item: Pick<ItineraryItem, 'type' | 'hikeDetails'>, isEndEvent = false): ItemTypeTone {
  const meta = getItemTypeMeta(item);
  return isEndEvent && meta.endTone ? meta.endTone : meta;
}

/** Primary badge label for a card, e.g. `CHECK-OUT`, `DINNER`, or a note's title. */
export function getEventLabel(item: Pick<ItineraryItem, 'type' | 'hikeDetails' | 'title' | 'foodDetails'>, isEndEvent = false): string {
  const meta = getItemTypeMeta(item);
  if (meta.key === 'food') return item.foodDetails?.mealType?.toUpperCase() || meta.startLabel;
  if (meta.key === 'note') return item.title.toUpperCase();
  return isEndEvent ? meta.endLabel : meta.startLabel;
}
