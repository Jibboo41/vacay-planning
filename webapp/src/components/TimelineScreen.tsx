import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import TimelineItem from './TimelineItem';
import NoteCard from './NoteCard';
import DetailsModal from './modals/DetailsModal';
import EditItineraryModal from './modals/EditItineraryModal';
import type { ItineraryItem } from '../core/models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DayGroup {
  dateKey: string;
  label: string;
  items: ItineraryItem[];
}

function getDayKey(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayLabel(dateString: string) {
  const d = new Date(dateString);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Draggable Card Wrapper ───────────────────────────────────────────────────

interface DraggableCardProps {
  item: ItineraryItem;
  isDragging: boolean;
  isDropTarget: boolean;
  onPress: () => void;
  // HTML5 drag (desktop)
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (overId: string) => void;
  // iOS touch
  onGripTouchStart: (id: string) => void;
  groupPosition?: 'start' | 'middle' | 'end' | 'single';
}

function DraggableCard({
  item, isDragging, isDropTarget, onPress,
  onDragStart, onDragEnter, onDragEnd, onDrop,
  onGripTouchStart, isCheckout, groupPosition
}: DraggableCardProps & { isCheckout?: boolean }) {
  const dragId = item.id + (isCheckout ? '-checkout' : '');
  const gripHandler = (e: React.TouchEvent) => {
    e.preventDefault();
    onGripTouchStart(dragId);
  };

  return (
    <div
      data-drag-id={dragId}
      draggable={!isCheckout}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(dragId); }}
      onDragEnter={e => { e.preventDefault(); onDragEnter(dragId); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop(dragId); }}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative',
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      {isDropTarget && (
        <div className="drop-line-container">
          <div className="drop-line" />
        </div>
      )}

      {item.type === 'note' ? (
        <NoteCard item={item} onPress={onPress} onGripTouchStart={gripHandler} />
      ) : (
        <TimelineItem 
          item={item} 
          onPress={onPress} 
          onGripTouchStart={gripHandler} 
          isCheckout={isCheckout} 
          groupPosition={groupPosition}
        />
      )}
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const { items, updateItem, deleteItem, reorderItems, setSidebarOpen } = useTripStore();

  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [activeDayKey, setActiveDayKey] = useState<string>('');

  // Shared drag state (used by both HTML5 and touch paths)
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillBarRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const touchRef = useRef<{
    draggingId: string | null;
    dropTargetId: string | null;
    ghost: HTMLElement | null;
    onMove: ((e: TouchEvent) => void) | null;
    onEnd: (() => void) | null;
  }>({ draggingId: null, dropTargetId: null, ghost: null, onMove: null, onEnd: null });

  // ── Group & sort items by day ──────────────────────────────────────────────
  const sortedItems = [...items].sort((a, b) => {
    const dayA = getDayKey(a.startDate), dayB = getDayKey(b.startDate);
    if (dayA !== dayB) return dayA.localeCompare(dayB);
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder;
    if (a.sortOrder !== undefined) return -1;
    if (b.sortOrder !== undefined) return 1;
    return a.startDate.localeCompare(b.startDate);
  });

  const dayGroups: DayGroup[] = [];
  const dayMap: Record<string, DayGroup> = {};

  // Helper to add item to dayMap
  const addToDay = (dateStr: string, item: ItineraryItem, checkout = false) => {
    const key = getDayKey(dateStr);
    if (!dayMap[key]) {
      dayMap[key] = { dateKey: key, label: getDayLabel(dateStr), items: [] };
      dayGroups.push(dayMap[key]);
    }
    // Use type assertion to allow virtual field or handle it cleanly
    dayMap[key].items.push(checkout ? ({ ...item, _isCheckout: true } as any) : item);
  };

  for (const item of sortedItems) {
    // Add primary entry (Check-in / Start)
    addToDay(item.startDate, item);

    // If it's a hotel or rental car with a different end date, add a checkout/return entry
    const isMultiDay = item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate);
    if ((item.type === 'hotel' || item.type === 'rental-car') && isMultiDay) {
      addToDay(item.endDate!, item, true);
    }
  }

  // Sort groups by dateKey
  dayGroups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  useEffect(() => {
    if (dayGroups.length > 0 && !activeDayKey) setActiveDayKey(dayGroups[0].dateKey);
  }, [dayGroups, activeDayKey]);

  // ── Scroll spy ─────────────────────────────────────────────────────────────
  const handleWindowScroll = useCallback(() => {
    if (touchRef.current.draggingId) return; 
    const stripHeight = stripRef.current?.offsetHeight ?? 52;
    const triggerY = window.scrollY + stripHeight + 20;
    let current = dayGroups[0]?.dateKey ?? '';
    for (const group of dayGroups) {
      const el = dayRefs.current[group.dateKey];
      if (el) {
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        if (elTop <= triggerY) current = group.dateKey;
      }
    }
    if (current !== activeDayKey) {
      setActiveDayKey(current);
      const pill = pillRefs.current[current];
      const bar = pillBarRef.current;
      if (pill && bar)
        bar.scrollTo({ left: pill.offsetLeft - bar.offsetWidth / 2 + pill.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [dayGroups, activeDayKey]);

  useEffect(() => {
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [handleWindowScroll]);

  const scrollToDay = (key: string) => {
    const el = dayRefs.current[key];
    if (el) {
      const strip = stripRef.current?.offsetHeight ?? 52;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - strip - 8, behavior: 'smooth' });
    }
    setActiveDayKey(key);
  };

  // ── HTML5 drag handlers (desktop) ─────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnter = (id: string) => { if (id !== draggingId) setDropTargetId(id); };
  const handleDragEnd = () => { setDraggingId(null); setDropTargetId(null); };

  const handleDrop = (overId: string) => {
    if (!draggingId) return;
    
    // Always strip -checkout from the dragging item to get its base ID
    const rawDraggingId = draggingId.replace('-checkout', '');

    // Check if it's an "End of Day" drop zone
    if (overId.startsWith('end-of-')) {
      const targetDayKey = overId.replace('end-of-', '');
      reorderItems(rawDraggingId, null, targetDayKey);
    } else if (draggingId !== overId) {
      // Normal between-items drop
      const rawOverId = overId.replace('-checkout', '');
      const overItem = items.find(i => i.id === rawOverId);
      if (overItem) reorderItems(rawDraggingId, rawOverId, getDayKey(overItem.startDate));
    }
    handleDragEnd();
  };

  // ── Touch drag (iOS Safari) ───────────────────────────────────────────────
  const startTouchDrag = useCallback((id: string) => {
    const ts = touchRef.current;
    const cardEl = document.querySelector(`[data-drag-id="${id}"]`) as HTMLElement | null;
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();

    const ghost = cardEl.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, {
      position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`,
      zIndex: '999', pointerEvents: 'none', opacity: '0.88', transform: 'scale(1.04) rotate(1deg)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.65)', margin: '0', transition: 'transform 0.12s, box-shadow 0.12s',
      borderRadius: '16px', overflow: 'hidden',
    });
    document.body.appendChild(ghost);
    ts.ghost = ghost;
    ts.draggingId = id;
    setDraggingId(id);

    const offsetY = 50;

    ts.onMove = (e: TouchEvent) => {
      e.preventDefault(); 
      const t = e.touches[0];
      if (ts.ghost) {
        ts.ghost.style.left = `${t.clientX - rect.width / 2}px`;
        ts.ghost.style.top = `${t.clientY - offsetY}px`;
      }
      ts.ghost!.style.visibility = 'hidden';
      const elUnder = document.elementFromPoint(t.clientX, t.clientY);
      ts.ghost!.style.visibility = 'visible';
      const cardUnder = elUnder?.closest('[data-drag-id]');
      const newTarget = cardUnder?.getAttribute('data-drag-id') ?? null;
      if (newTarget !== ts.dropTargetId) {
        ts.dropTargetId = newTarget;
        setDropTargetId(newTarget);
      }
    };

    ts.onEnd = () => {
      ts.ghost?.remove();
      ts.ghost = null;
      if (ts.onMove) document.removeEventListener('touchmove', ts.onMove);
      if (ts.onEnd)  document.removeEventListener('touchend', ts.onEnd);
      const fromId = ts.draggingId;
      const toId   = ts.dropTargetId;
      ts.draggingId   = null;
      ts.dropTargetId = null;
      setDraggingId(null);
      setDropTargetId(null);

      if (fromId && toId && fromId !== toId) {
        const rawFromId = fromId.replace('-checkout', '');
        if (toId.startsWith('end-of-')) {
          reorderItems(rawFromId, null, toId.replace('end-of-', ''));
        } else {
          const rawToId = toId.replace('-checkout', '');
          const overItem = items.find(i => i.id === rawToId);
          if (overItem) reorderItems(rawFromId, rawToId, getDayKey(overItem.startDate));
        }
      }
    };
    document.addEventListener('touchmove', ts.onMove, { passive: false });
    document.addEventListener('touchend',  ts.onEnd);
  }, [items, reorderItems]);

  useEffect(() => () => {
    const ts = touchRef.current;
    ts.ghost?.remove();
    if (ts.onMove) document.removeEventListener('touchmove', ts.onMove);
    if (ts.onEnd)  document.removeEventListener('touchend',  ts.onEnd);
  }, []);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const handlePressItem = (item: ItineraryItem) => {
    if (draggingId) return;
    setSelectedItem(item); setDetailsVisible(true);
  };
  const handleDelete = (id: string) => { deleteItem(id); setDetailsVisible(false); };

  return (
    <>
      <header className="screen-header">
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <h1 className="page-title">Itinerary</h1>
      </header>

      <div className="day-timeline-strip" ref={stripRef}>
        <div className="day-pill-bar" ref={pillBarRef}>
          {dayGroups.map((group) => (
            <button
              key={group.dateKey}
              ref={el => { pillRefs.current[group.dateKey] = el; }}
              className={`day-pill ${activeDayKey === group.dateKey ? 'day-pill--active' : ''}`}
              onClick={() => scrollToDay(group.dateKey)}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <main className="timeline-main" style={{ paddingTop: '20px' }}>
        {dayGroups.map((group) => (
          <div key={group.dateKey}>
            <div className="day-section-header" ref={el => { dayRefs.current[group.dateKey] = el; }}>
              <span className="day-section-label">{group.label}</span>
            </div>

            {group.items.map((item, idx) => {
              const dragId = item.id + ((item as any)._isCheckout ? '-checkout' : '');
              
              // Grouping logic
              const prev = group.items[idx - 1];
              const next = group.items[idx + 1];
              const hasGroup = !!item.groupId;
              let groupPosition: 'start' | 'middle' | 'end' | 'single' = 'single';
              if (hasGroup) {
                const samePrev = prev?.groupId === item.groupId;
                const sameNext = next?.groupId === item.groupId;
                if (samePrev && sameNext) groupPosition = 'middle';
                else if (samePrev) groupPosition = 'end';
                else if (sameNext) groupPosition = 'start';
              }

              return (
                <DraggableCard
                  key={dragId}
                  item={item}
                  isDragging={draggingId === dragId}
                  isDropTarget={dropTargetId === dragId}
                  onPress={() => handlePressItem(item)}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onGripTouchStart={startTouchDrag}
                  isCheckout={(item as any)._isCheckout}
                  groupPosition={groupPosition}
                />
              );
            })}

            <div
              className="end-day-drop-zone"
              data-drag-id={`end-of-${group.dateKey}`}
              onDragEnter={() => handleDragEnter(`end-of-${group.dateKey}`)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(`end-of-${group.dateKey}`)}
            >
              {dropTargetId === `end-of-${group.dateKey}` && (
                <div className="drop-line-container">
                  <div className="drop-line" style={{ top: '8px' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {detailsVisible && <DetailsModal item={selectedItem} onClose={() => setDetailsVisible(false)} onEdit={() => { setEditVisible(true); setDetailsVisible(false); }} onDelete={handleDelete} />}
      {editVisible && selectedItem && (
        <EditItineraryModal
          item={selectedItem}
          onClose={() => setEditVisible(false)}
          onSave={(id, updates) => { updateItem(id, updates); setSelectedItem(prev => prev ? { ...prev, ...updates } : null); }}
        />
      )}
    </>
  );
}
