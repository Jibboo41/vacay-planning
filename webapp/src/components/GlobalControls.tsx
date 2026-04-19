import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Compass, Calendar, BookOpen, PenLine, Layers, CheckSquare, DollarSign, CloudSun, StickyNote, Utensils, Luggage } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import EditItineraryModal from './modals/EditItineraryModal';
import AiScoutModal from './modals/AiScoutModal';

export default function GlobalControls() {
  const { items, addItem, updateItem, editingItem, editingExpense, isSidebarOpen } = useTripStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSparkleOpen, setIsSparkleOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [scoutVisible, setScoutVisible] = useState(false);

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

  const currentIcon = useMemo(() => {
    if (location.pathname === '/map') return <Compass size={24} color="#fff" />;
    if (location.pathname === '/timeline') return <Calendar size={24} color="#fff" />;
    if (location.pathname === '/summary') return <BookOpen size={24} color="#fff" />;
    if (location.pathname === '/todo') return <CheckSquare size={24} color="#fff" />;
    if (location.pathname === '/costs') return <DollarSign size={24} color="#fff" />;
    if (location.pathname === '/weather') return <CloudSun size={24} color="#fff" />;
    if (location.pathname === '/notes') return <StickyNote size={24} color="#fff" />;
    if (location.pathname === '/packing') return <Luggage size={24} color="#fff" />;
    return <Layers size={24} color="#fff" />;
  }, [location.pathname]);

  return (
    <>
      {/* ── Sparkles Action FAB (Bottom Left) ── */}
      {location.pathname !== '/map' && !shouldHide && (
        <div className="fab-group left">
        <button 
          className={`fab-main ${isSparkleOpen ? 'active' : ''}`} 
          onClick={() => { setIsSparkleOpen(!isSparkleOpen); setIsViewOpen(false); }}
          aria-label="Add menu"
        >
          <Sparkles size={24} color="#fff" />
        </button>

        <div className={`fab-options ${isSparkleOpen ? 'open' : ''}`}>
          <button 
            className="fab-sub" 
            onClick={() => { setScoutVisible(true); setIsSparkleOpen(false); }}
            aria-label="Dining Scout"
          >
            <Utensils size={18} color="#fff" />
          </button>

          <button 
            className="fab-sub" 
            onClick={() => { setAddNoteVisible(true); setIsSparkleOpen(false); }}
            aria-label="Add note"
          >
            <StickyNote size={18} color="#fff" />
          </button>

          <button 
            className="fab-sub" 
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
            aria-label="Manual Entry"
          >
            <PenLine size={18} color="#fff" />
          </button>

          <button 
            className="fab-sub" 
            onClick={() => { setAddVisible(true); setIsSparkleOpen(false); }}
            aria-label="AI Parse"
          >
            <Sparkles size={18} color="#fff" />
          </button>
        </div>
      </div>
      )}

      {/* ── View Switcher FAB (Bottom Right) ── */}
      {!shouldHide && (
        <div className="fab-group right">
          <button 
          className={`fab-main ${isViewOpen ? 'active' : ''}`}
          onClick={() => { setIsViewOpen(!isViewOpen); setIsSparkleOpen(false); }}
          aria-label="Switch Views"
        >
          {currentIcon}
        </button>

        <div className={`fab-options ${isViewOpen ? 'open' : ''}`} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '8px',
          background: 'rgba(28, 28, 30, 0.7)',
          padding: '12px',
          borderRadius: '24px',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          minWidth: '240px',
          transform: isViewOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isViewOpen ? 1 : 0
        }}>
          <NavButton 
            icon={<Calendar size={20} />} label="Timeline" 
            onClick={() => { navigate('/timeline'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/timeline'} 
          />
          <NavButton 
            icon={<Compass size={20} />} label="Map" 
            onClick={() => { navigate('/map'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/map'} 
          />
          <NavButton 
            icon={<BookOpen size={20} />} label="Summary" 
            onClick={() => { navigate('/summary'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/summary'} 
          />
          <NavButton 
            icon={<CheckSquare size={20} />} label="Todo" 
            onClick={() => { navigate('/todo'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/todo'} 
          />
          <NavButton 
            icon={<DollarSign size={20} />} label="Costs" 
            onClick={() => { navigate('/costs'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/costs'} 
          />
          <NavButton 
            icon={<CloudSun size={20} />} label="Weather" 
            onClick={() => { navigate('/weather'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/weather'} 
          />
          <NavButton 
            icon={<StickyNote size={20} />} label="Notes" 
            onClick={() => { navigate('/notes'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/notes'} 
          />
          <NavButton 
            icon={<Luggage size={20} />} label="Packing" 
            onClick={() => { navigate('/packing'); setIsViewOpen(false); }} 
            isActive={location.pathname === '/packing'} 
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
