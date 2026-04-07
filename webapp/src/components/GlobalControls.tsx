import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Compass, Calendar, BookOpen, PenLine, Layers } from 'lucide-react';
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
    return <Layers size={24} color="#fff" />;
  }, [location.pathname]);

  return (
    <>
      {/* ── View Switcher FAB (Bottom Left) ── */}
      <div className="fab-group left">
        <button 
          className={`fab-main ${isViewOpen ? 'active' : ''}`}
          onClick={() => { setIsViewOpen(!isViewOpen); setIsSparkleOpen(false); }}
          aria-label="Switch Views"
        >
          {currentIcon}
        </button>

        <div className={`fab-options ${isViewOpen ? 'open' : ''}`}>
          <NavButton icon={<Compass size={18} />} label="Map" onClick={() => { navigate('/map'); setIsViewOpen(false); }} isActive={location.pathname === '/map'} />
          <NavButton icon={<Calendar size={18} />} label="Timeline" onClick={() => { navigate('/timeline'); setIsViewOpen(false); }} isActive={location.pathname === '/timeline'} />
          <NavButton icon={<BookOpen size={18} />} label="Summary" onClick={() => { navigate('/summary'); setIsViewOpen(false); }} isActive={location.pathname === '/summary'} />
        </div>
      </div>

      {/* ── Sparkles Action FAB (Bottom Right) ── */}
      <div className="fab-group right">
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
            <span className="fab-sub-label">Note</span>
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
            <span className="fab-sub-label">Manual</span>
          </button>

          <button 
            className="fab-sub" 
            onClick={() => { setAddVisible(true); setIsSparkleOpen(false); }}
            aria-label="AI Parse"
          >
            <Sparkles size={20} color="#fff" />
            <span className="fab-sub-label">Parse AI</span>
          </button>
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

function NavButton({ icon, label, onClick, isActive }: { icon: React.ReactNode, label: string, onClick: () => void, isActive: boolean }) {
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
      <span className="fab-sub-label" style={{ opacity: isActive ? 1 : undefined }}>
        {label}
      </span>
    </button>
  );
}
