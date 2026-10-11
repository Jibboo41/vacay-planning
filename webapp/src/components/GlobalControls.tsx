import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, PenLine, StickyNote, Utensils } from 'lucide-react';
import { findRoute } from '../app/routes';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import EditItineraryModal from './modals/EditItineraryModal';
import AiScoutModal from './modals/AiScoutModal';

export default function GlobalControls() {
  const { items, addItem, updateItem, editingItem, editingExpense, isSidebarOpen, currentTripId } = useTripStore();
  const location = useLocation();

  const [isSparkleOpen, setIsSparkleOpen] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [scoutVisible, setScoutVisible] = useState(false);

  const route = findRoute(location.pathname);
  const showAddFab = !!route && route.key !== 'map' && !!currentTripId;
  const shouldHide = isSidebarOpen || !!editingItem || !!editingExpense || addVisible || addNoteVisible || editVisible;

  const getEarliestDate = () => {
    if (items.length === 0) return new Date().toISOString();
    const sorted = [...items].sort((a,b) => a.startDate.localeCompare(b.startDate));
    return sorted[0].startDate;
  };

  const getActiveDayKey = () => {
    const earliest = getEarliestDate();
    return earliest.split('T')[0];
  };

  return (
    <>
      {/* ── Sparkles Action FAB (Bottom Left) ── */}
      {showAddFab && !shouldHide && (
        <div className="fab-group left" style={{ alignItems: 'flex-start' }}>
        <button 
          className={`fab-main ${isSparkleOpen ? 'active' : ''}`} 
          onClick={() => setIsSparkleOpen(!isSparkleOpen)}
          aria-label="Add menu"
        >
          <Sparkles size={24} color="#fff" />
        </button>

        <div className={`fab-options ${isSparkleOpen ? 'open' : ''}`} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '8px',
          background: 'rgba(28, 28, 30, 0.7)',
          padding: '12px',
          borderRadius: '24px',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          minWidth: '160px',
          transform: isSparkleOpen ? 'translateY(-10px) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isSparkleOpen ? 1 : 0
        }}>
          <NavButton 
            icon={<Sparkles size={20} />} label="AI Parse" 
            onClick={() => { setAddVisible(true); setIsSparkleOpen(false); }} 
            isActive={false} 
          />
          <NavButton 
            icon={<PenLine size={20} />} label="Manual" 
            onClick={() => {
              const newItem: ItineraryItem = {
                id: `manual-${Date.now()}`,
                type: 'activity',
                title: 'New Activity',
                startDate: getEarliestDate(),
                location: { name: 'TBD', address: 'Location TBD', latitude: null, longitude: null }
              };
              addItem(newItem);
              setEditItem(newItem);
              setEditVisible(true);
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
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 6px',
        borderRadius: '16px',
        background: isActive ? 'rgba(10, 132, 255, 0.25)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(10, 132, 255, 0.4)' : '1px solid rgba(255,255,255,0.02)',
        color: isActive ? '#fff' : 'var(--sys-label-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gap: '4px'
      }}
    >
      <div style={{ opacity: isActive ? 1 : 0.8 }}>
        {icon}
      </div>
      <span style={{ 
        fontSize: '10px', 
        fontWeight: isActive ? 800 : 600,
        letterSpacing: '0.02em',
        opacity: isActive ? 1 : 0.7 
      }}>
        {label}
      </span>
    </button>
  );
}
