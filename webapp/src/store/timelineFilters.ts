import { useMemo } from 'react';
import { FILTER_GROUPS, ITEM_TYPES, resolveItemType, type FilterGroup, type ItemTypeKey } from '../core/itemTypes';
import { itemMatchesQuery } from '../utils/itinerary';
import { useTripStore } from './useTripStore';
import { useUiStore } from './useUiStore';

/**
 * Timeline search + type filters. The type filters live in `useTripStore.activeFilters`
 * (shared with the map); the text query lives in `useUiStore.timelineQuery` so the
 * Settings screen can edit both on mobile, where the timeline header omits them.
 */

export const ALL_FILTER_TYPES = Object.keys(ITEM_TYPES) as ItemTypeKey[];

// A search typed for one trip shouldn't silently filter the next one.
useTripStore.subscribe((state, prev) => {
  if (state.currentTripId !== prev.currentTripId && useUiStore.getState().timelineQuery) {
    useUiStore.getState().setTimelineQuery('');
  }
});

export function filterTypesForGroup(group: FilterGroup): ItemTypeKey[] {
  return ALL_FILTER_TYPES.filter((type) => ITEM_TYPES[type].filterGroup === group);
}

export function isFilterGroupSelected(group: FilterGroup, activeFilters: readonly string[]): boolean {
  return filterTypesForGroup(group).every((type) => activeFilters.includes(type));
}

/** Select every type in the group, or deselect them all if they're already all selected. */
export function toggleFilterGroup(group: FilterGroup) {
  const { activeFilters, toggleFilter } = useTripStore.getState();
  const allSelected = isFilterGroupSelected(group, activeFilters);
  filterTypesForGroup(group).forEach((type) => {
    if (allSelected === activeFilters.includes(type)) toggleFilter(type);
  });
}

export function ensureFiltersEnabled(types: readonly ItemTypeKey[]) {
  const { activeFilters, toggleFilter } = useTripStore.getState();
  types.forEach((type) => {
    if (!activeFilters.includes(type)) toggleFilter(type);
  });
}

export function resetTimelineFilters() {
  useUiStore.getState().setTimelineQuery('');
  ensureFiltersEnabled(ALL_FILTER_TYPES);
}

export function useTimelineFilterStatus() {
  const query = useUiStore((s) => s.timelineQuery);
  const activeFilters = useTripStore((s) => s.activeFilters);
  const items = useTripStore((s) => s.items);
  return useMemo(() => {
    const hiddenGroups = FILTER_GROUPS.filter((g) => !isFilterGroupSelected(g.key, activeFilters)).length;
    const trimmed = query.trim();
    const shownCount = items.filter((i) => activeFilters.includes(resolveItemType(i)) && itemMatchesQuery(i, query)).length;
    return {
      query: trimmed,
      hiddenGroups,
      isFiltered: !!trimmed || ALL_FILTER_TYPES.some((type) => !activeFilters.includes(type)),
      shownCount,
      totalCount: items.length,
    };
  }, [activeFilters, items, query]);
}

/** Short human summary, e.g. `“hotel” · 2 types hidden`. */
export function describeTimelineFilters(status: { query: string; hiddenGroups: number }): string {
  const parts: string[] = [];
  if (status.query) parts.push(`“${status.query}”`);
  if (status.hiddenGroups) parts.push(`${status.hiddenGroups} ${status.hiddenGroups === 1 ? 'type' : 'types'} hidden`);
  return parts.join(' · ');
}
