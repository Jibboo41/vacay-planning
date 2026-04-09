import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Compass, Calendar, BookOpen, PenLine, Layers, CheckSquare, DollarSign, CloudSun } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import AddItineraryModal from './modals/AddItineraryModal';
import AddNoteModal from './modals/AddNoteModal';
import EditItineraryModal from './modals/EditItineraryModal';

export default function GlobalControls() {
  const { items, addItem, updateItem } = useTripStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSparkleOpen, setIsSparkleOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);

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
    return <Layers size={24} color="#fff" />;
  }, [location.pathname]);

  return (
    <>
      {/* ── Sparkles Action FAB (Bottom Left) ── */}
      {location.pathname !== '/map' && (
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
            onClick={() => { setAddNoteVisible(true); setIsSparkleOpen(false); }}
            aria-label="Add note"
          >
            <span style={{ fontSize: '18px' }}>📝</span>
            <span className="fab-sub-label" style={{ left: '60px', right: 'auto' }}>Note</span>
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
            <span className="fab-sub-label" style={{ left: '60px', right: 'auto' }}>Manual</span>
          </button>

          <button 
            className="fab-sub" 
            onClick={() => { setAddVisible(true); setIsSparkleOpen(false); }}
            aria-label="AI Parse"
          >
            <Sparkles size={20} color="#fff" />
            <span className="fab-sub-label" style={{ left: '60px', right: 'auto' }}>Parse AI</span>
          </button>
        </div>
      </div>
      )}

      {/* ── View Switcher FAB (Bottom Right) ── */}
      <div className="fab-group right">
        <button 
          className={`fab-main ${isViewOpen ? 'active' : ''}`}
          onClick={() => { setIsViewOpen(!isViewOpen); setIsSparkleOpen(false); }}
          aria-label="Switch Views"
        >
          {currentIcon}
        </button>

        <div className={`fab-options ${isViewOpen ? 'open' : ''}`}>
          <NavButton icon={<Calendar size={18} />} label="Timeline" onClick={() => { navigate('/timeline'); setIsViewOpen(false); }} isActive={location.pathname === '/timeline'} isRightSide={true} />
          <NavButton icon={<Compass size={18} />} label="Map" onClick={() => { navigate('/map'); setIsViewOpen(false); }} isActive={location.pathname === '/map'} isRightSide={true} />
          <NavButton icon={<BookOpen size={18} />} label="Outline" onClick={() => { navigate('/summary'); setIsViewOpen(false); }} isActive={location.pathname === '/summary'} isRightSide={true} />
          <NavButton icon={<CheckSquare size={18} />} label="Todos" onClick={() => { navigate('/todo'); setIsViewOpen(false); }} isActive={location.pathname === '/todo'} isRightSide={true} />
          <NavButton icon={<DollarSign size={18} />} label="Costs" onClick={() => { navigate('/costs'); setIsViewOpen(false); }} isActive={location.pathname === '/costs'} isRightSide={true} />
          <NavButton icon={<CloudSun size={18} />} label="Weather" onClick={() => { navigate('/weather'); setIsViewOpen(false); }} isActive={location.pathname === '/weather'} isRightSide={true} />
        </div>
      </div>

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
    </>
  );
}

function NavButton({ icon, label, onClick, isActive, isRightSide }: { icon: React.ReactNode, label: string, onClick: () => void, isActive: boolean, isRightSide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`fab-sub ${isActive ? 'active' : ''}`}
      style={{
        background: isActive ? 'var(--sys-blue)' : 'var(--sys-bg-elevated-2)',
        borderColor: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
        position: 'relative',
      }}
    >
      <div style={{ opacity: isActive ? 1 : 0.7 }}>
        {icon}
      </div>
      <span 
        className="fab-sub-label" 
        style={{ 
          opacity: isActive ? 1 : undefined,
          right: isRightSide ? '60px' : 'auto',
          left: isRightSide ? 'auto' : '60px'
        }}
      >
        {label}
      </span>
    </button>
  );
}
