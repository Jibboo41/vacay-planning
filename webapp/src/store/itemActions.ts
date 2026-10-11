import type { ItineraryItem } from '../core/models';
import { suggestNewItemStart } from '../utils/itinerary';
import { toLocalDateTime } from '../utils/dates';
import { useTripStore } from './useTripStore';

/**
 * Create a blank manual item and open it in the editor.
 * The start date/time is prefilled from the last item of the currently
 * selected timeline day (falls back to the trip's first day, then now).
 */
export function startNewItem() {
  const { items, selectedDayKey, addItem, setEditingItem, currentTripId } = useTripStore.getState();
  if (!currentTripId) return;
  const firstDay = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]?.startDate.split('T')[0];
  const startDate =
    suggestNewItemStart(items, selectedDayKey) ??
    suggestNewItemStart(items, firstDay) ??
    toLocalDateTime(new Date());
  const newItem: ItineraryItem = {
    id: `manual-${Date.now()}`,
    type: 'activity',
    title: 'New Activity',
    startDate,
    location: { name: 'TBD', address: 'Location TBD', latitude: null, longitude: null },
  };
  void addItem(newItem);
  setEditingItem(newItem);
}
