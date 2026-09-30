import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findRoute } from '../app/routes';
import { Sparkles, PenLine, StickyNote, Utensils } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { cn } from '../lib/cn';

const fabPanel = 'fab-options grid transform-none gap-2 rounded-panel border border-white/10 bg-surface/70 p-3 shadow-elevated backdrop-blur-[30px]';
import type { ItineraryItem } from '../core/models';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import { startNewItem } from '../store/itemActions';
import EditItineraryModal from './modals/EditItineraryModal';
import AiScoutModal from './modals/AiScoutModal';

export default function GlobalControls() {
  const { items, addItem, updateItem, editingItem, editingExpense, isSidebarOpen, selectedDayKey, currentTripId } = useTripStore();
  const location = useLocation();

  const [isSparkleOpen, setIsSparkleOpen] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [scoutVisible, setScoutVisible] = useState(false);

  // The add menu appears on trip screens (from the shared route config), except the full-bleed map.
  const route = findRoute(location.pathname);
  const showAddFab = !!route && route.key !== 'map' && !!currentTripId;
  const shouldHide = isSidebarOpen || !!editingItem || !!editingExpense || addVisible || addNoteVisible || editVisible;

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
      {/* ── Sparkles Action FAB (Bottom Left) ── */}
      {showAddFab && !shouldHide && (
        <div className="fab-group left items-start">
        <button 
          className={cn('fab-main', isSparkleOpen && 'active')}
          onClick={() => { setIsSparkleOpen(!isSparkleOpen); }}
          aria-label="Add menu"
          aria-expanded={isSparkleOpen}
        >
          <Sparkles size={24} className="text-white" />
        </button>

        <div className={cn(fabPanel, 'min-w-40 grid-cols-2', isSparkleOpen ? 'open -translate-y-2.5' : 'translate-y-5 scale-95')}>
          <NavButton 
            icon={<Sparkles size={20} />} label="AI Parse" 
            onClick={() => { setAddVisible(true); setIsSparkleOpen(false); }} 
            isActive={false} 
          />
          <NavButton 
            icon={<PenLine size={20} />} label="Manual" 
            onClick={() => {
              startNewItem();
              setIsSparkleOpen(false);
            }} 
            isActive={false} 
          />
          <NavButton 
            icon={<StickyNote size={20} />} label="Note" 
            onClick={() => { setAddNoteVisible(true); setIsSparkleOpen(false); }} 
            isActive={false} 
          />
          <NavButton 
            icon={<Utensils size={20} />} label="Scout" 
            onClick={() => { setScoutVisible(true); setIsSparkleOpen(false); }} 
            isActive={false} 
          />
        </div>
      </div>
      )}

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

function NavButton({ icon, label, onClick, isActive }: { icon: React.ReactNode, label: string, onClick: () => void, isActive: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-3 transition-colors duration-200 motion-reduce:transition-none',
        isActive
          ? 'border-sys-blue/40 bg-sys-blue/25 text-white'
          : 'border-white/2 bg-white/5 text-label-secondary hover:bg-white/10 hover:text-label',
      )}
    >
      <span className={isActive ? 'opacity-100' : 'opacity-80'}>{icon}</span>
      <span className={cn('text-caption tracking-wide', isActive ? 'font-extrabold' : 'font-semibold')}>{label}</span>
    </button>
  );
}
