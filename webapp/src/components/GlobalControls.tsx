import { useEffect, useState } from 'react';
import { Sparkles, PenLine, StickyNote, Utensils } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import type { ItineraryItem } from '../core/models';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import { startNewItem } from '../store/itemActions';
import EditItineraryModal from './modals/EditItineraryModal';
import AiScoutModal from './modals/AiScoutModal';
import { Sheet } from './ui';

export default function GlobalControls() {
  const { items, addItem, updateItem, selectedDayKey, currentTripId } = useTripStore();
  const addMenuOpen = useUiStore((s) => s.addMenuOpen);
  const setAddMenuOpen = useUiStore((s) => s.setAddMenuOpen);
  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [scoutVisible, setScoutVisible] = useState(false);

  useEffect(() => {
    if (!currentTripId && addMenuOpen) setAddMenuOpen(false);
  }, [addMenuOpen, currentTripId, setAddMenuOpen]);

  const getEarliestDate = () => {
    if (items.length === 0) return new Date().toISOString();
    const sorted = [...items].sort((a,b) => a.startDate.localeCompare(b.startDate));
    return sorted[0].startDate;
  };

  const getActiveDayKey = () => {
    return selectedDayKey ?? getEarliestDate().split('T')[0];
  };

  return (
    <>
      <Sheet open={addMenuOpen && !!currentTripId} onClose={() => setAddMenuOpen(false)} title="Add to timeline">
        <div className="grid grid-cols-2 gap-3 pb-2">
          <NavButton
            icon={<Sparkles size={20} />} label="AI Parse"
            onClick={() => { setAddMenuOpen(false); setAddVisible(true); }}
          />
          <NavButton
            icon={<PenLine size={20} />} label="Manual"
            onClick={() => {
              setAddMenuOpen(false);
              startNewItem();
            }}
          />
          <NavButton
            icon={<StickyNote size={20} />} label="Note"
            onClick={() => { setAddMenuOpen(false); setAddNoteVisible(true); }}
          />
          <NavButton
            icon={<Utensils size={20} />} label="Scout"
            onClick={() => { setAddMenuOpen(false); setScoutVisible(true); }}
          />
        </div>
      </Sheet>

      {/* Modals */}
      {addVisible && <AddItineraryModal onClose={() => setAddVisible(false)} onAdd={(item) => {
        addItem(item);
        if (item.id.startsWith('manual-')) {
          setEditItem(item);
          setEditVisible(true);
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
      
      {editVisible && editItem && (
        <EditItineraryModal
          item={editItem}
          onClose={() => setEditVisible(false)}
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

function NavButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border border-white/8 bg-white/5 px-1.5 py-3 text-label-secondary transition-colors duration-200 hover:bg-white/10 hover:text-label motion-reduce:transition-none"
    >
      <span className="opacity-80">{icon}</span>
      <span className="text-caption font-semibold tracking-wide">{label}</span>
    </button>
  );
}
