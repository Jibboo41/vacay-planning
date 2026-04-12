import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Map } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import TimelineItem from './TimelineItem';
import NoteCard from './NoteCard';
import type { ItineraryItem } from '../core/models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DayGroup {
  dateKey: string;
  label: string;
  items: ItineraryItem[];
}

function getDayKey(dateString: string) {
  if (!dateString) return '';
  // Force local interpretation by replacing dashes with slashes if no time present
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayLabel(dateString: string) {
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
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
  const dragId = item.id + (isCheckout ? (item.type === 'rental-car' ? '-return' : '-checkout') : '');
  const gripHandler = (e: React.TouchEvent) => {
    e.preventDefault();
    onGripTouchStart(dragId);
  };

  return (
    <div
      data-drag-id={dragId}
      draggable={true}
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
  const { items, currentTripId, trips, weather, reorderItems, setSidebarOpen, setEditingItem, activeFilters } = useTripStore();
  const currentTrip = trips.find(t => t.id === currentTripId);

  const [activeDayKey, setActiveDayKey] = useState<string>('');
  const isScrollingToDay = useRef(false);

  // Shared drag state (used by both HTML5 and touch paths)
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillBarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const touchRef = useRef<{
    draggingId: string | null;
    dropTargetId: string | null;
    ghost: HTMLElement | null;
    onMove: ((e: TouchEvent) => void) | null;
    onEnd: (() => void) | null;
  }>({ draggingId: null, dropTargetId: null, ghost: null, onMove: null, onEnd: null });

  // ── Flatten, filter & sort items ───────────────────────────────────────────
  const filtered = items.filter(i => activeFilters.includes(i.type));

  const flattened: (ItineraryItem & { _isCheckout?: boolean, _renderDate: string })[] = [];
  filtered.forEach(item => {
    flattened.push({ ...item, _renderDate: item.startDate });
    const isMultiDay = item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate);
    if ((item.type === 'hotel' || item.type === 'rental-car') && isMultiDay) {
      flattened.push({ ...item, _isCheckout: true, _renderDate: item.endDate! });
    }
  });

  flattened.sort((a, b) => {
    const dayA = getDayKey(a._renderDate), dayB = getDayKey(b._renderDate);
    if (dayA !== dayB) return dayA.localeCompare(dayB);
    
    // Independent sort orders: checkouts use endSortOrder
    const aOrder = a._isCheckout ? (a.endSortOrder ?? a.sortOrder ?? 0) : (a.sortOrder ?? 0);
    const bOrder = b._isCheckout ? (b.endSortOrder ?? b.sortOrder ?? 0) : (b.sortOrder ?? 0);
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a._renderDate.localeCompare(b._renderDate);
  });

  const dayGroups: DayGroup[] = [];
  const dayMap: Record<string, DayGroup> = {};

  flattened.forEach(item => {
    const key = getDayKey(item._renderDate);
    if (!dayMap[key]) {
      dayMap[key] = { dateKey: key, label: getDayLabel(item._renderDate), items: [] };
      dayGroups.push(dayMap[key]);
    }
    dayMap[key].items.push(item);
  });

  const getScrollContainer = () => {
    return document.querySelector('.split-left') || window;
  };

  const handleOpenMap = (group: DayGroup) => {
    // 1. Gather all items for this day that have valid lat/lng and are NOT flights.
    const drivingItems = group.items.filter(item => 
      item.type !== 'flight' && 
      item.type !== 'note' && 
      item.location && 
      item.location.latitude && 
      item.location.longitude
    );

    // 2. Filter consecutive duplicate coordinates to avoid redundant waypoints
    const uniqueDrivingItems: typeof drivingItems = [];
    drivingItems.forEach(item => {
      const prev = uniqueDrivingItems[uniqueDrivingItems.length - 1];
      if (!prev) {
        uniqueDrivingItems.push(item);
      } else if (prev.location.latitude !== item.location.latitude || prev.location.longitude !== item.location.longitude) {
        uniqueDrivingItems.push(item);
      }
    });

    if (uniqueDrivingItems.length === 0) return;

    if (uniqueDrivingItems.length === 1) {
      const point = uniqueDrivingItems[0];
      const url = `https://www.google.com/maps/search/?api=1&query=${point.location.latitude},${point.location.longitude}`;
      window.open(url, '_blank');
      return;
    }

    const origin = uniqueDrivingItems[0];
    const destination = uniqueDrivingItems[uniqueDrivingItems.length - 1];
    const waypoints = uniqueDrivingItems.slice(1, -1);

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.location.latitude},${origin.location.longitude}&destination=${destination.location.latitude},${destination.location.longitude}`;
    
    if (waypoints.length > 0) {
      const waypointsStr = waypoints.map(wp => `${wp.location.latitude},${wp.location.longitude}`).join('|');
      url += `&waypoints=${waypointsStr}`;
    }

    window.open(url, '_blank');
  };

  // ── Intersection Observer (Scroll Spy) ─────────────────────────────────────
  useEffect(() => {
    const container = getScrollContainer();
    const options = {
      root: container === window ? null : (container as Element),
      rootMargin: '-120px 0px -80% 0px', // Adjusted for double-height header
      threshold: [0, 1]
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingToDay.current) return;

      // Find the first intersecting entry that is within our top margin
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      
      if (visible.length > 0) {
        const key = visible[0].target.getAttribute('data-day-key');
        if (key && key !== activeDayKey) {
          setActiveDayKey(key);
          const pill = pillRefs.current[key];
          const bar = pillBarRef.current;
          if (pill && bar) {
            bar.scrollTo({ 
              left: pill.offsetLeft - bar.offsetWidth / 2 + pill.offsetWidth / 2, 
              behavior: 'smooth' 
            });
          }
        }
      }
    }, options);

    Object.values(dayRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [dayGroups, activeDayKey]);

  const scrollToDay = (key: string) => {
    const el = dayRefs.current[key];
    if (el) {
      isScrollingToDay.current = true;
      setActiveDayKey(key);
      
      const container = getScrollContainer();
      const fullHeaderHeight = headerRef.current?.offsetHeight ?? 140;
      
      // Calculate target scroll position - adjusted for 'above the title' cushion
      let targetTop = 0;
      const cushion = 16; // Tighter space above the title (user request)
      const offset = fullHeaderHeight + cushion;

      if (container === window) {
        targetTop = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        const cEl = container as HTMLElement;
        targetTop = el.offsetTop - offset;
        cEl.scrollTo({ top: targetTop, behavior: 'smooth' });
      }

      // Briefly disable observer
      setTimeout(() => {
        isScrollingToDay.current = false;
      }, 1000);
    }
  };

  // ── HTML5 drag handlers (desktop) ─────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnter = (id: string) => { if (id !== draggingId) setDropTargetId(id); };
  const handleDragEnd = () => { setDraggingId(null); setDropTargetId(null); };

  const handleDrop = (overId: string) => {
    if (!draggingId) return;
    if (overId.startsWith('end-of-')) {
      const targetDayKey = overId.replace('end-of-', '');
      reorderItems(draggingId, null, targetDayKey, true); // true for bottom
    } else if (overId.startsWith('start-of-')) {
      const targetDayKey = overId.replace('start-of-', '');
      reorderItems(draggingId, null, targetDayKey, false); // false for top
    } else if (draggingId !== overId) {
      const isOverCheckout = overId.endsWith('-checkout') || overId.endsWith('-return');
      const rawOverId = overId.replace('-checkout', '').replace('-return', '');
      const overItem = items.find(i => i.id === rawOverId);
      if (overItem) {
        const targetDayKey = (isOverCheckout && overItem.endDate) ? getDayKey(overItem.endDate) : getDayKey(overItem.startDate);
        reorderItems(draggingId, rawOverId, targetDayKey);
      }
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
      const cardUnder = elUnder?.closest('[data-drag-id]');
      const newTarget = cardUnder?.getAttribute('data-drag-id') ?? null;
      
      // Stickiness logic: if we hit a new target, update it. 
      // If we hit nothing, keep the old target as long as we're within the scrollable area
      // this prevents 'flickering' and 'picky' drops.
      if (newTarget) {
        if (newTarget !== ts.dropTargetId) {
          ts.dropTargetId = newTarget;
          setDropTargetId(newTarget);
        }
      } else {
        // Only clear if we are completely out of any day section
        const isOverDaySection = !!elUnder?.closest('.day-section-content') || !!elUnder?.closest('.day-section-header');
        if (!isOverDaySection && ts.dropTargetId) {
          ts.dropTargetId = null;
          setDropTargetId(null);
        }
      }
    };

    ts.onEnd = () => {
      ts.ghost?.remove();
      ts.ghost = null;
      if (ts.onMove) document.removeEventListener('touchmove', ts.onMove);
      if (ts.onEnd)  document.removeEventListener('touchend', ts.onEnd);
      
      const fromId = ts.draggingId;
      const toId   = ts.dropTargetId;
      
      // Clear state
      ts.draggingId   = null;
      ts.dropTargetId = null;
      setDraggingId(null);
      setDropTargetId(null);

      // Execute drop if we have source and target
      if (fromId && toId && fromId !== toId) {
        console.log(`[DND] Executing drop from ${fromId} to ${toId}`);
        if (toId.startsWith('end-of-')) {
          reorderItems(fromId, null, toId.replace('end-of-', ''), true);
        } else if (toId.startsWith('start-of-')) {
          reorderItems(fromId, null, toId.replace('start-of-',''), false);
        } else {
          const isOverCheckout = toId.endsWith('-checkout') || toId.endsWith('-return');
          const rawToId = toId.replace('-checkout', '').replace('-return', '');
          const overItem = items.find(i => i.id === rawToId);
          if (overItem) {
            const targetDayKey = (isOverCheckout && overItem.endDate) ? getDayKey(overItem.endDate) : getDayKey(overItem.startDate);
            reorderItems(fromId, rawToId, targetDayKey);
          }
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
    setEditingItem(item);
  };

  return (
    <>
      <header ref={headerRef} className="screen-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, paddingBottom: 0, paddingTop: 'calc(4px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '0' }}>
          <button 
            className="header-icon-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="page-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1.7rem' }}>
            {currentTrip?.title || 'Itinerary'}
          </h1>
        </div>

        <div className="day-timeline-strip" style={{ background: 'transparent', backdropFilter: 'none', borderBottom: 'none', padding: '0 0 4px 0' }}>
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
      </header>

      <main className="timeline-main">
        {dayGroups.map((group) => {
          const dayWeather = weather?.forecast.filter(f => f.date === group.dateKey);
          let high: number | null = null;
          let low: number | null = null;
          
          if (dayWeather && dayWeather.length > 0) {
            high = Math.max(...dayWeather.map(w => w.tempHigh));
            low = Math.min(...dayWeather.map(w => w.tempLow));
          }

          return (
              <div key={group.dateKey}>
                <div className="day-section-header" data-day-key={group.dateKey} ref={el => { dayRefs.current[group.dateKey] = el; }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="day-section-label">{group.label}</span>
                    <button 
                      onClick={() => handleOpenMap(group)}
                      className="btn-glass-blue"
                      style={{ padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', border: '1px solid rgba(10,132,255,0.3)', background: 'rgba(10,132,255,0.1)' }}
                      title="Open Directions in Google Maps"
                    >
                      <Map size={14} />
                      <span style={{ fontWeight: 700 }}>Map Day</span>
                    </button>
                  </div>
                  {high !== null && low !== null && (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sys-label-secondary)', letterSpacing: '0.02em' }}>
                      <span style={{ color: '#FF9F0A' }}>H: {high}°</span> <span style={{ color: '#0A84FF' }}>L: {low}°</span>
                    </span>
                  )}
                </div>

                <div
                  className="start-day-drop-zone"
                  data-drag-id={`start-of-${group.dateKey}`}
                  onDragEnter={() => handleDragEnter(`start-of-${group.dateKey}`)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(`start-of-${group.dateKey}`)}
                  style={{ height: '24px', marginBottom: '-16px', marginTop: '-4px', position: 'relative', zIndex: 5 }}
                >
                  {dropTargetId === `start-of-${group.dateKey}` && (
                    <div className="drop-line-container" style={{ top: '8px' }}>
                      <div className="drop-line" />
                    </div>
                  )}
                </div>

              {group.items.map((item, idx) => {
                const dragId = item.id + ((item as any)._isCheckout ? '-checkout' : '');
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
          );
        })}
      </main>
    </>
  );
}
