import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, Menu, Map, RefreshCw, Search, SearchX, X } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import TimelineItem from './TimelineItem';
import NoteCard from './NoteCard';
import type { ItineraryItem } from '../core/models';
import { FILTER_GROUPS, ITEM_TYPES, resolveItemType, type FilterGroup, type ItemTypeKey } from '../core/itemTypes';
import { cn } from '../lib/cn';
import { Button, Chip, EmptyState, IconButton, Input } from './ui';
import { getDayKey, getDayLabel, todayKey } from '../utils/dates';
import { itemMatchesQuery } from '../utils/itinerary';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { isDialogOpen, useHotkeys } from '../hooks/useHotkeys';
import { startNewItem } from '../store/itemActions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DayGroup {
  dateKey: string;
  label: string;
  items: RenderedTimelineItem[];
}

type RenderedTimelineItem = ItineraryItem & { _isCheckout?: boolean; _renderDate: string };

const ALL_FILTER_TYPES = Object.keys(ITEM_TYPES) as ItemTypeKey[];

function filterTypesForGroup(group: FilterGroup) {
  return ALL_FILTER_TYPES.filter((type) => ITEM_TYPES[type].filterGroup === group);
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
  isHighlighted?: boolean;
}

function DraggableCard({
  item, isDragging, isDropTarget, onPress,
  onDragStart, onDragEnter, onDragEnd, onDrop,
  onGripTouchStart, isCheckout, groupPosition, isHighlighted
}: DraggableCardProps & { isCheckout?: boolean }) {
  const dragId = item.id + (isCheckout ? (item.type === 'rental-car' ? '-return' : '-checkout') : '');
  const gripHandler = (e: React.TouchEvent) => {
    e.preventDefault();
    onGripTouchStart(dragId);
  };

  return (
    <div
      data-drag-id={dragId}
      data-timeline-item
      data-timeline-item-id={item.id}
      tabIndex={0}
      draggable={true}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(dragId); }}
      onDragEnter={e => { e.preventDefault(); onDragEnter(dragId); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop(dragId); }}
      onDragEnd={onDragEnd}
      className={cn(
        'relative transition-opacity duration-150 motion-reduce:transition-none',
        isDragging && 'opacity-[0.35]',
        isHighlighted && 'rounded-2xl ring-2 ring-sys-blue ring-offset-2 ring-offset-black/40',
      )}
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
  const { items, currentTripId, trips, weather, reorderItems, setSidebarOpen, setEditingItem, activeFilters, toggleFilter, isWeatherRefreshing } = useTripStore();
  const { focusItemId, focusItem } = useUiStore();
  const currentTrip = trips.find(t => t.id === currentTripId);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [activeDayKey, setActiveDayKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [pendingFocusItemId, setPendingFocusItemId] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(140);
  const [todayHeaderVisible, setTodayHeaderVisible] = useState(false);
  const isScrollingToDay = useRef(false);
  const autoScrolledTripIds = useRef<Set<string>>(new Set());

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
  const dayGroups = useMemo<DayGroup[]>(() => {
    const filtered = items.filter(i => activeFilters.includes(resolveItemType(i)) && itemMatchesQuery(i, searchQuery));
    const flattened: RenderedTimelineItem[] = [];

    filtered.forEach(item => {
      flattened.push({ ...item, _renderDate: item.startDate });
      const isMultiDay = item.endDate && getDayKey(item.startDate) !== getDayKey(item.endDate);
      if ((item.type === 'hotel' || item.type === 'rental-car') && isMultiDay && item.endDate) {
        flattened.push({ ...item, _isCheckout: true, _renderDate: item.endDate });
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

    const groups: DayGroup[] = [];
    const dayMap: Record<string, DayGroup> = {};

    flattened.forEach(item => {
      const key = getDayKey(item._renderDate);
      if (!dayMap[key]) {
        dayMap[key] = { dateKey: key, label: getDayLabel(item._renderDate, 'short'), items: [] };
        groups.push(dayMap[key]);
      }
      dayMap[key].items.push(item);
    });

    return groups;
  }, [activeFilters, items, searchQuery]);

  const getScrollContainer = useCallback(() => {
    return document.querySelector('.split-left') || window;
  }, []);

  useEffect(() => {
    const update = () => setHeaderHeight(headerRef.current?.offsetHeight ?? 140);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [dayGroups.length, searchQuery, activeFilters]);

  const today = todayKey();
  const tripIncludesToday = useMemo(() => {
    if (items.length === 0) return false;
    const keys = items.flatMap((item) => [getDayKey(item.startDate), item.endDate ? getDayKey(item.endDate) : getDayKey(item.startDate)]).filter(Boolean);
    if (keys.length === 0) return false;
    keys.sort();
    return today >= keys[0] && today <= keys[keys.length - 1] && dayGroups.some((group) => group.dateKey === today);
  }, [dayGroups, items, today]);

  const setActiveDay = useCallback((key: string) => {
    setActiveDayKey(key);
    useTripStore.getState().setSelectedDayKey(key);
  }, []);

  const ensureFiltersEnabled = useCallback((types: ItemTypeKey[]) => {
    const current = useTripStore.getState().activeFilters;
    types.forEach((type) => {
      if (!current.includes(type)) toggleFilter(type);
    });
  }, [toggleFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    ensureFiltersEnabled(ALL_FILTER_TYPES);
  }, [ensureFiltersEnabled]);

  const toggleFilterGroup = useCallback((group: FilterGroup) => {
    const types = filterTypesForGroup(group);
    const allSelected = types.every((type) => activeFilters.includes(type));
    types.forEach((type) => {
      if (allSelected ? activeFilters.includes(type) : !activeFilters.includes(type)) toggleFilter(type);
    });
  }, [activeFilters, toggleFilter]);

  const handleOpenMap = (group: DayGroup) => {
    // 1. Gather all items for this day that have valid lat/lng and are NOT flights.
    const drivingItems = group.items.filter(item => 
      item.type !== 'flight' && 
      item.type !== 'note' && 
      item.location && 
      item.location.latitude && 
      item.location.longitude
    );

    // 2. Identify active stay for Hotel-Origin routing
    const activeStay = items.find(item => {
      if (item.type !== 'hotel' && item.type !== 'rental-car') return false;
      if (!item.location.latitude) return false;
      const startK = getDayKey(item.startDate);
      const endK = item.endDate ? getDayKey(item.endDate) : startK;
      return group.dateKey >= startK && group.dateKey <= endK;
    });

    let stops: ItineraryItem[] = [...drivingItems];
    if (activeStay) {
      const startK = getDayKey(activeStay.startDate);
      const endK = activeStay.endDate ? getDayKey(activeStay.endDate) : startK;
      
      const isCheckinDay = group.dateKey === startK;
      const isCheckoutDay = group.dateKey === endK;

      if (!isCheckinDay && stops[0]?.id !== activeStay.id) {
        stops = [activeStay, ...stops];
      }
      if (!isCheckoutDay && stops[stops.length - 1]?.id !== activeStay.id) {
        stops.push(activeStay);
      }
    }

    // 3. Filter consecutive duplicate coordinates to avoid redundant waypoints
    const uniqueDrivingItems: ItineraryItem[] = [];
    stops.forEach(item => {
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
      rootMargin: `-${headerHeight + 8}px 0px -80% 0px`,
      threshold: [0, 1]
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingToDay.current) return;

      // Find the first intersecting entry that is within our top margin
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      
      if (visible.length > 0) {
        const key = visible[0].target.getAttribute('data-day-key');
        if (key && key !== activeDayKey) {
          setActiveDay(key);
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
  }, [dayGroups, activeDayKey, getScrollContainer, headerHeight, setActiveDay]);

  const scrollToDay = useCallback((key: string, behavior: ScrollBehavior = 'smooth') => {
    const el = dayRefs.current[key];
    if (el) {
      isScrollingToDay.current = true;
      setActiveDay(key);
      
      const container = getScrollContainer();
      const fullHeaderHeight = headerRef.current?.offsetHeight ?? 140;
      
      // Calculate target scroll position - adjusted for 'above the title' cushion
      let targetTop = 0;
      const cushion = 16; // Tighter space above the title (user request)
      const offset = fullHeaderHeight + cushion;

      if (container === window) {
        targetTop = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: targetTop, behavior });
      } else {
        const cEl = container as HTMLElement;
        targetTop = el.offsetTop - offset;
        cEl.scrollTo({ top: targetTop, behavior });
      }

      // Briefly disable observer
      setTimeout(() => {
        isScrollingToDay.current = false;
      }, 1000);
    }
  }, [getScrollContainer, setActiveDay]);

  useEffect(() => {
    if (!currentTripId || !tripIncludesToday || autoScrolledTripIds.current.has(currentTripId)) return;
    autoScrolledTripIds.current.add(currentTripId);
    requestAnimationFrame(() => scrollToDay(today, prefersReducedMotion ? 'auto' : 'smooth'));
  }, [currentTripId, prefersReducedMotion, scrollToDay, today, tripIncludesToday]);

  useEffect(() => {
    if (!tripIncludesToday) return;
    const el = dayRefs.current[today];
    if (!el) return;
    const container = getScrollContainer();
    const observer = new IntersectionObserver(
      ([entry]) => setTodayHeaderVisible(entry.isIntersecting),
      {
        root: container === window ? null : (container as Element),
        rootMargin: `-${headerHeight}px 0px -70% 0px`,
        threshold: 0,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [getScrollContainer, headerHeight, today, tripIncludesToday]);

  const focusTimelineItem = useCallback((id: string, behavior: ScrollBehavior = 'smooth') => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-item]'));
    const card = cards.find((el) => el.dataset.timelineItemId === id);
    if (!card) return false;
    card.scrollIntoView({ block: 'nearest', behavior });
    card.focus({ preventScroll: true });
    setHighlightedItemId(id);
    window.setTimeout(() => setHighlightedItemId((current) => current === id ? null : current), 1500);
    return true;
  }, []);

  const moveTimelineFocus = useCallback((delta: 1 | -1) => {
    if (isDialogOpen()) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-item]'));
    if (cards.length === 0) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>('[data-timeline-item]') : null;
    const index = active ? cards.indexOf(active) : -1;
    const nextIndex = index === -1 ? (delta > 0 ? 0 : cards.length - 1) : Math.min(cards.length - 1, Math.max(0, index + delta));
    const card = cards[nextIndex];
    card.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    card.focus({ preventScroll: true });
  }, [prefersReducedMotion]);

  useHotkeys({
    j: (e) => {
      e.preventDefault();
      moveTimelineFocus(1);
    },
    k: (e) => {
      e.preventDefault();
      moveTimelineFocus(-1);
    },
  });

  useEffect(() => {
    if (!focusItemId) return;
    const item = items.find((candidate) => candidate.id === focusItemId);
    if (!item) {
      focusItem(null);
      return;
    }
    const type = resolveItemType(item);
    if (!activeFilters.includes(type)) ensureFiltersEnabled([type]);
    if (!itemMatchesQuery(item, searchQuery)) window.setTimeout(() => setSearchQuery(''), 0);
    window.setTimeout(() => setPendingFocusItemId(focusItemId), 0);
    focusItem(null);
  }, [activeFilters, ensureFiltersEnabled, focusItem, focusItemId, items, searchQuery]);

  useEffect(() => {
    if (!pendingFocusItemId) return;
    const frame = requestAnimationFrame(() => {
      if (focusTimelineItem(pendingFocusItemId, prefersReducedMotion ? 'auto' : 'smooth')) {
        setPendingFocusItemId(null);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [dayGroups, focusTimelineItem, pendingFocusItemId, prefersReducedMotion]);

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
      <header ref={headerRef} className="screen-header flex-col items-stretch gap-0 pb-0 pt-[calc(4px+env(safe-area-inset-top))]">
        <div className="flex items-center gap-4 pb-0">
          <IconButton
            variant="ghost"
            size="md"
            className="header-icon-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </IconButton>
          <h1 className="page-title flex-1 truncate text-[1.7rem]">
            {currentTrip?.title || 'Itinerary'}
          </h1>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label-tertiary" />
            <Input
              aria-label="Search itinerary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search itinerary"
              className="h-11 rounded-full pr-11 pl-9"
            />
            {searchQuery && (
              <IconButton
                aria-label="Clear search"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </IconButton>
            )}
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Itinerary type filters">
            {FILTER_GROUPS.map((group) => {
              const types = filterTypesForGroup(group.key);
              const selected = types.every((type) => activeFilters.includes(type));
              return (
                <Chip
                  key={group.key}
                  selected={selected}
                  aria-label={`Filter ${group.label}`}
                  onClick={() => toggleFilterGroup(group.key)}
                >
                  {group.label}
                </Chip>
              );
            })}
          </div>
        </div>

        <div className="day-timeline-strip border-b-0 bg-transparent pb-1 backdrop-blur-none">
          <div className="day-pill-bar" ref={pillBarRef}>
            {dayGroups.map((group) => (
              <button
                key={group.dateKey}
                ref={el => { pillRefs.current[group.dateKey] = el; }}
                className={cn('day-pill', activeDayKey === group.dateKey && 'day-pill--active')}
                onClick={() => scrollToDay(group.dateKey)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="timeline-main">
        {items.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={30} />}
            title="No plans yet"
            description={<>Add your first itinerary item, or use the ✨ menu to parse plans with AI.</>}
            action={<Button onClick={startNewItem}>Add first item</Button>}
          />
        ) : dayGroups.length === 0 ? (
          <EmptyState
            icon={<SearchX size={30} />}
            title="No matching plans"
            description="Search and filters are hiding every itinerary item."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : dayGroups.map((group) => {
          const dayWeather = weather?.forecast.filter(f => f.date === group.dateKey);
          let high: number | null = null;
          let low: number | null = null;
          
          if (dayWeather && dayWeather.length > 0) {
            high = Math.max(...dayWeather.map(w => w.tempHigh));
            low = Math.min(...dayWeather.map(w => w.tempLow));
          }

          return (
              <div key={group.dateKey}>
                <div
                  className="day-section-header sticky z-30 flex items-center justify-between border-b border-white/8 bg-black/20 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/10"
                  style={{ top: headerHeight }}
                  data-day-key={group.dateKey}
                  ref={el => { dayRefs.current[group.dateKey] = el; }}
                >
                  <div className="flex items-center gap-3">
                    <span className="day-section-label">{group.label}</span>
                    <Button
                      size="sm"
                      onClick={() => handleOpenMap(group)}
                      className="border-sys-blue/30 bg-sys-blue/10 text-caption"
                      title="Open Directions in Google Maps"
                    >
                      <Map size={14} />
                      <span className="font-bold">Map Day</span>
                    </Button>
                  </div>
                  {isWeatherRefreshing ? (
                    <div className="spinning flex items-center opacity-60">
                      <RefreshCw className="size-3.5 text-sys-blue" />
                    </div>
                  ) : (high !== null && low !== null && (
                    <span className="text-footnote font-bold tracking-wide text-label-secondary">
                      <span className="text-sys-orange">H: {high}°</span> <span className="text-sys-blue">L: {low}°</span>
                    </span>
                  ))}
                </div>

                <div
                  className="start-day-drop-zone relative z-[5] -mt-1 -mb-4 h-6"
                  data-drag-id={`start-of-${group.dateKey}`}
                  onDragEnter={() => handleDragEnter(`start-of-${group.dateKey}`)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(`start-of-${group.dateKey}`)}
                >
                  {dropTargetId === `start-of-${group.dateKey}` && (
                    <div className="drop-line-container top-2">
                      <div className="drop-line" />
                    </div>
                  )}
                </div>

              {group.items.map((item, idx) => {
                const dragId = item.id + (item._isCheckout ? (item.type === 'rental-car' ? '-return' : '-checkout') : '');
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
                    isCheckout={item._isCheckout}
                    groupPosition={groupPosition}
                    isHighlighted={highlightedItemId === item.id}
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
                    <div className="drop-line top-2" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
      {tripIncludesToday && !todayHeaderVisible && (
        <Button
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-offset,0px)+76px)] left-1/2 z-[2600] -translate-x-1/2 rounded-full shadow-glow-blue"
          onClick={() => scrollToDay(today, prefersReducedMotion ? 'auto' : 'smooth')}
        >
          Today
        </Button>
      )}
    </>
  );
}
