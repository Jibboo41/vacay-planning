import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, Map as MapIcon, Plus, Search } from 'lucide-react';
import { APP_ROUTES, SETTINGS_ROUTE, isDebugEnabled } from '../app/routes';
import { getItemTypeMeta } from '../core/itemTypes';
import { cn } from '../lib/cn';
import { startNewItem } from '../store/itemActions';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { getDayLabel } from '../utils/dates';
import { Modal } from './ui';

interface Command {
  id: string;
  group: 'Actions' | 'Screens' | 'Trips' | 'Itinerary';
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

function matches(cmd: Command, q: string) {
  if (!q) return true;
  const hay = `${cmd.label} ${cmd.hint ?? ''} ${cmd.keywords ?? ''} ${cmd.group}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
}

/** ⌘K / Ctrl+K / "/" command palette. Mounted by App when open. */
export default function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  if (!open) return null;
  return <PaletteDialog onClose={() => setOpen(false)} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const trips = useTripStore((s) => s.trips);
  const items = useTripStore((s) => s.items);
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const focusItem = useUiStore((s) => s.focusItem);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];
    if (currentTripId) {
      cmds.push({
        id: 'new-item', group: 'Actions', label: 'New item', hint: 'N', icon: <Plus size={18} />,
        keywords: 'add create activity manual',
        run: () => { navigate('/timeline', { viewTransition: true }); startNewItem(); },
      });
    }
    for (const r of APP_ROUTES) {
      const Icon = r.icon;
      cmds.push({
        id: `route-${r.key}`, group: 'Screens', label: `Go to ${r.label}`, icon: <Icon size={18} />,
        keywords: `${r.description} ${r.keywords.join(' ')}`,
        run: () => navigate(r.path, { viewTransition: true }),
      });
    }
    cmds.push({
      id: 'route-trips', group: 'Screens', label: 'Go to All Trips', icon: <MapIcon size={18} />,
      keywords: 'trip selector list', run: () => navigate('/trips', { viewTransition: true }),
    });
    cmds.push({
      id: 'route-settings', group: 'Screens', label: `Go to ${SETTINGS_ROUTE.label}`, icon: <SETTINGS_ROUTE.icon size={18} />,
      keywords: 'preferences theme appearance filters tint export share sign out logout account',
      run: () => navigate(SETTINGS_ROUTE.path, { viewTransition: true }),
    });
    if (isDebugEnabled()) {
      cmds.push({ id: 'route-debug', group: 'Screens', label: 'Open Debug', icon: <Bug size={18} />, run: () => navigate('/debug') });
    }
    for (const t of trips) {
      cmds.push({
        id: `trip-${t.id}`, group: 'Trips', label: t.title || 'Untitled trip',
        hint: t.id === currentTripId ? 'Current' : undefined, icon: <MapIcon size={18} />, keywords: 'switch trip',
        run: () => { setCurrentTrip(t.id); navigate('/timeline', { viewTransition: true }); },
      });
    }
    for (const it of items) {
      const meta = getItemTypeMeta(it);
      const Icon = meta.icon;
      cmds.push({
        id: `item-${it.id}`, group: 'Itinerary', label: it.title || meta.label,
        hint: getDayLabel(it.startDate), icon: <Icon size={18} className={meta.textClass} />,
        keywords: `${meta.label} ${it.location?.name ?? ''} ${it.confirmationNumber ?? ''}`,
        run: () => { navigate('/timeline', { viewTransition: true }); focusItem(it.id); },
      });
    }
    return cmds;
  }, [currentTripId, trips, items, navigate, setCurrentTrip, focusItem]);

  const filtered = useMemo(() => commands.filter((c) => matches(c, query)).slice(0, 60), [commands, query]);
  const activeIndex = Math.min(active, Math.max(0, filtered.length - 1));

  const run = (cmd: Command | undefined) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const move = (delta: number) => {
    if (!filtered.length) return;
    const next = (activeIndex + delta + filtered.length) % filtered.length;
    setActive(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  let lastGroup: string | null = null;

  return (
    <Modal open onClose={onClose} ariaLabel="Command palette" variant="center" hideClose className="max-w-lg p-3 md:max-w-lg" bodyClassName="flex flex-col">
      <div className="flex items-center gap-2 rounded-control border border-white/10 bg-white/6 px-3">
        <Search size={18} aria-hidden="true" className="text-label-secondary" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-list"
          aria-activedescendant={filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined}
          aria-label="Search commands, screens, trips and items"
          placeholder="Search screens, trips, items…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); run(filtered[activeIndex]); }
          }}
          className="min-h-12 flex-1 bg-transparent text-body text-label outline-none placeholder:text-label-tertiary"
        />
        <kbd className="rounded-md border border-white/15 px-1.5 text-caption text-label-tertiary">Esc</kbd>
      </div>
      <ul id="command-palette-list" ref={listRef} role="listbox" aria-label="Results" className="mt-2 max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-footnote text-label-secondary">No matches for “{query}”.</li>
        )}
        {filtered.map((cmd, i) => {
          const header = cmd.group !== lastGroup ? cmd.group : null;
          lastGroup = cmd.group;
          return (
            <li key={cmd.id} role="presentation">
              {header && <div role="presentation" className="px-3 pt-3 pb-1 text-caption font-bold tracking-wider text-label-tertiary uppercase">{header}</div>}
              <div
                id={`cmd-${cmd.id}`}
                role="option"
                aria-selected={i === activeIndex}
                data-index={i}
                onMouseMove={() => { if (i !== activeIndex) setActive(i); }}
                onClick={() => run(cmd)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 text-body text-label',
                  i === activeIndex ? 'bg-sys-blue/25' : 'hover:bg-white/6',
                )}
              >
                <span aria-hidden="true" className="flex size-6 items-center justify-center text-label-secondary">{cmd.icon}</span>
                <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                {cmd.hint && <span className="shrink-0 text-caption text-label-tertiary">{cmd.hint}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
