import { useState } from 'react';
import { PenLine, Sparkles, StickyNote, Utensils } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import AddMenu, { type AddMenuOption } from './AddMenu';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import EditItineraryModal from './modals/EditItineraryModal';
import AiScoutModal from './modals/AiScoutModal';

export default function GlobalControls() {
  const items = useTripStore(state => state.items);
  const addItem = useTripStore(state => state.addItem);
  const updateItem = useTripStore(state => state.updateItem);
  const isAddMenuOpen = useTripStore(state => state.isAddMenuOpen);
  const addMenuAnchor = useTripStore(state => state.addMenuAnchor);
  const closeAddMenu = useTripStore(state => state.closeAddMenu);
  const hasTrip = useTripStore(state => !!state.currentTripId);
  const tripTitle = useTripStore(state =>
    state.trips.find(trip => trip.id === state.currentTripId)?.title);

  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [scoutVisible, setScoutVisible] = useState(false);

  const getEarliestDate = () => {
    if (items.length === 0) return new Date().toISOString();
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return sorted[0].startDate;
  };

  const getActiveDayKey = () => getEarliestDate().split('T')[0];

  const addManualItem = () => {
    const newItem: ItineraryItem = {
      id: `manual-${Date.now()}`,
      type: 'activity',
      title: 'New Activity',
      startDate: getEarliestDate(),
      location: { name: 'TBD', address: 'Location TBD', latitude: null, longitude: null }
    };
    addItem(newItem);
    setEditItem(newItem);
  };

  const addMenuOptions: AddMenuOption[] = [
    {
      key: 'parse',
      label: 'AI Parse',
      description: 'Paste a confirmation email',
      icon: Sparkles,
      color: 'var(--sys-purple)',
      background: 'rgba(191, 90, 242, 0.16)',
      onSelect: () => setAddVisible(true),
    },
    {
      key: 'manual',
      label: 'Manual',
      description: 'Create an item yourself',
      icon: PenLine,
      color: 'var(--sys-blue)',
      background: 'rgba(10, 132, 255, 0.16)',
      onSelect: addManualItem,
    },
    {
      key: 'note',
      label: 'Note',
      description: 'Jot down a note for the trip',
      icon: StickyNote,
      color: 'var(--sys-orange)',
      background: 'rgba(255, 159, 10, 0.16)',
      onSelect: () => setAddNoteVisible(true),
    },
    {
      key: 'scout',
      label: 'Scout',
      description: 'Find places to eat with AI',
      icon: Utensils,
      color: 'var(--sys-green)',
      background: 'rgba(48, 209, 88, 0.16)',
      onSelect: () => setScoutVisible(true),
    },
  ];

  return (
    <>
      {isAddMenuOpen && hasTrip && (
        <AddMenu
          anchor={addMenuAnchor}
          tripTitle={tripTitle}
          options={addMenuOptions}
          onClose={closeAddMenu}
        />
      )}

      {addVisible && <AddItineraryModal onClose={() => setAddVisible(false)} onAdd={(item) => {
        addItem(item);
        if (item.id.startsWith('manual-')) {
          setEditItem(item);
        }
      }} />}

      {addNoteVisible && <AddNoteModal activeDayKey={getActiveDayKey()} onClose={() => setAddNoteVisible(false)} onAdd={(dayKey, title, content) => {
          const note: ItineraryItem = {
            id: `note-${Date.now()}`,
            type: 'note', title: title.trim() || 'Note', description: content,
            startDate: dayKey,
            location: { name: '', address: '', latitude: null, longitude: null },
          };
          addItem(note);
      }} />}

      {editItem && (
        <EditItineraryModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(id, updates) => updateItem(id, updates)}
        />
      )}

      {scoutVisible && (
        <AiScoutModal
          onClose={() => setScoutVisible(false)}
          onAdd={(item: ItineraryItem) => {
            addItem(item);
            setScoutVisible(false);
          }}
        />
      )}
    </>
  );
}
