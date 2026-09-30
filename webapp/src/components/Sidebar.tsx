import React, { useRef, useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, LogOut, X, Sparkles, ArrowLeft, Terminal, ChevronDown, FileSpreadsheet, Share2 } from 'lucide-react';
import { auth } from '../core/firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES, DEFAULT_ROUTE, isDebugEnabled } from '../app/routes';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { isFeatureEnabled } from '../core/featureFlags';
import ShareSheet from './ShareSheet';
import { downloadTripExcel } from '../utils/exportUtils';
import { ITEM_TYPES, type ItemTypeKey } from '../core/itemTypes';
import { THEMES } from '../core/themes';
import { cn } from '../lib/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Button, IconButton, Modal, Field, Input } from './ui';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTER_TYPES: ItemTypeKey[] = ['flight', 'hotel', 'rental-car', 'activity', 'hiking', 'food', 'note', 'transit'];

const sectionTitle = 'mb-3.5 text-footnote font-extrabold uppercase tracking-wider text-label-secondary';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    trips, currentTripId, setCurrentTrip, addTrip,
    theme, setTheme, activeFilters, toggleFilter,
    tintedBackgrounds, setTintedBackgrounds
  } = useTripStore();

  const [newTripTitle, setNewTripTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const sharingEnabled = isFeatureEnabled('sharing');
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, isOpen && !isAdding, onClose);

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;
    try {
      await addTrip(newTripTitle);
      setNewTripTitle('');
      setIsAdding(false);
      onClose();
      navigate(DEFAULT_ROUTE);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTrip = (id: string) => {
    setCurrentTrip(id);
    onClose();
    navigate(DEFAULT_ROUTE);
  };

  return (
    <>
      <div
        className={cn('sidebar-overlay', isOpen && 'active')}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={cn('sidebar-panel', isOpen && 'open')}
        aria-label="Trips and settings"
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
      >
        <div className="sidebar-header pb-2.5">
          <div className="flex flex-1 flex-col">
            <h2 className="m-0 text-[1.8rem] font-extrabold">My Trips</h2>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/trips'); }}
              className="mt-1 -ml-1 inline-flex min-h-9 items-center gap-1 self-start rounded-chip px-1 text-footnote font-bold text-sys-blue hover:bg-sys-blue/10"
            >
              <ArrowLeft size={14} /> Back to Selector
            </button>
          </div>
          <IconButton aria-label="Close sidebar" variant="ghost" onClick={onClose}>
            <X size={24} />
          </IconButton>
        </div>

        <div className="sidebar-content">
          <nav aria-label="Trips">
            <ul className="trip-mini-list">
              {trips.map(trip => (
                <li key={trip.id}>
                  <button
                    type="button"
                    aria-current={currentTripId === trip.id ? 'true' : undefined}
                    className={cn('trip-pill w-full border border-transparent text-left hover:bg-white/8', currentTripId === trip.id && 'active')}
                    onClick={() => handleSelectTrip(trip.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold">{trip.title}</div>
                      <div className="mt-0.5 text-caption text-label-secondary">
                        {trip.items.length} {trip.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <Button block size="lg" className="add-trip-pill" onClick={() => setIsAdding(true)}>
            <Plus size={20} />
            <span>Add Trip</span>
          </Button>

          {currentTripId && (
            <nav aria-label="Screens" className="pt-6 pb-2.5">
              <h3 className={sectionTitle}>Go To</h3>
              <ul className="grid grid-cols-4 gap-2.5">
                {APP_ROUTES.map(route => {
                  const Icon = route.icon;
                  const active = location.pathname === route.path;
                  return (
                    <li key={route.key}>
                      <button
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { onClose(); navigate(route.path, { viewTransition: !reducedMotion }); }}
                        className={cn(
                          'flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-caption font-bold transition-colors motion-reduce:transition-none',
                          active
                            ? 'border-sys-blue/40 bg-sys-blue/15 text-label'
                            : 'border-white/8 bg-white/4 text-label-secondary hover:bg-white/8 hover:text-label',
                        )}
                      >
                        <Icon size={18} aria-hidden="true" />
                        <span>{route.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <section className="pt-6 pb-2.5">
            <h3 className={sectionTitle}>Filter Views</h3>
            <div className="grid grid-cols-4 gap-2.5">
              {FILTER_TYPES.map(type => {
                const meta = ITEM_TYPES[type];
                const Icon = meta.icon;
                const isActive = activeFilters.includes(type);
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleFilter(type)}
                    aria-pressed={isActive}
                    aria-label={`Show ${meta.label}`}
                    title={meta.label}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-control border transition-colors duration-200 motion-reduce:transition-none',
                      isActive
                        ? 'border-white/30 bg-sys-blue text-white'
                        : 'border-white/10 bg-white/5 text-label-secondary hover:bg-white/10',
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="pt-6 pb-2.5">
            <h3 className={sectionTitle}>Portability</h3>
            <Button
              block
              className="rounded-full py-3.5"
              onClick={() => {
                const trip = trips.find(t => t.id === currentTripId);
                if (trip) {
                  downloadTripExcel(trip.title, trip.items || [], trip.expenses || []);
                }
              }}
            >
              <FileSpreadsheet size={18} />
              <span>Export to Sheets</span>
            </Button>
            {sharingEnabled && currentTripId && (
              <Button
                block
                variant="glass"
                className="mt-2.5 rounded-full py-3.5"
                onClick={() => setIsShareOpen(true)}
              >
                <Share2 size={18} />
                <span>Share Trip</span>
              </Button>
            )}
          </section>

          <section className="pt-6 pb-2.5">
            <button
              type="button"
              onClick={() => setAppearanceExpanded(!appearanceExpanded)}
              aria-expanded={appearanceExpanded}
              aria-controls="sidebar-appearance"
              className="flex min-h-11 w-full items-center justify-between rounded-chip text-label-secondary hover:text-label"
            >
              <h3 className="m-0 text-footnote font-extrabold uppercase tracking-wider">Appearance</h3>
              <ChevronDown size={16} className={cn('transition-transform motion-reduce:transition-none', appearanceExpanded && 'rotate-180')} />
            </button>

            {appearanceExpanded && (
              <div id="sidebar-appearance">
                <div className="mt-3.5 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Theme">
                  {THEMES.map(t => {
                    const Icon = t.icon;
                    const selected = theme === t.key;
                    return (
                      <button
                        type="button"
                        key={t.key}
                        role="radio"
                        aria-checked={selected}
                        data-theme={t.key}
                        onClick={() => setTheme(t.key)}
                        className={cn(
                          'relative aspect-[1.8] overflow-hidden rounded-[14px] border-2 p-0 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none',
                          selected ? 'border-white/70 shadow-[0_0_18px_rgba(255,255,255,0.25)]' : 'border-transparent hover:border-white/25',
                        )}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--blob-1)_0%,var(--blob-2)_55%,var(--blob-3)_100%)] opacity-90" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/25">
                          <Icon size={20} className="text-white/90 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                          <span className="text-caption font-extrabold tracking-wide text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">{t.label}</span>
                        </div>
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tintedBackgrounds}
                    onClick={() => setTintedBackgrounds(!tintedBackgrounds)}
                    className="flex min-h-11 w-full items-center justify-between py-1"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn('flex size-8 items-center justify-center rounded-chip bg-white/5', tintedBackgrounds ? 'text-sys-blue' : 'text-label-secondary')}>
                        <Sparkles size={18} />
                      </span>
                      <span className={cn('text-[14px] font-semibold', tintedBackgrounds ? 'text-label' : 'text-label-secondary')}>Tinted backgrounds</span>
                    </span>
                    <span className={cn('relative h-6 w-11 rounded-xl transition-colors motion-reduce:transition-none', tintedBackgrounds ? 'bg-sys-blue' : 'bg-white/10')}>
                      <span className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200 ease-ios motion-reduce:transition-none',
                        tintedBackgrounds ? 'left-[22px]' : 'left-0.5',
                      )} />
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="sidebar-footer flex gap-2.5">
          <button type="button" onClick={() => auth.signOut()} className="logout-pill flex-1 gap-2 hover:bg-sys-red/15">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          {isDebugEnabled() && <button
            type="button"
            onClick={() => { onClose(); navigate('/debug'); }}
            className="logout-pill w-[50px] justify-center bg-white/3 text-label-secondary hover:bg-white/8"
            aria-label="System logs"
            title="System Logs"
          >
            <Terminal size={18} />
          </button>}
        </div>
      </aside>

      {sharingEnabled && (
        <ShareSheet
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          tripTitle={trips.find(t => t.id === currentTripId)?.title ?? 'this trip'}
        />
      )}

      <Modal open={isAdding} onClose={() => setIsAdding(false)} title="Plan New Trip" variant="center">
        <form onSubmit={handleAddTrip}>
          <Field label="Trip Name">
            {(id) => (
              <Input
                id={id}
                autoFocus
                type="text"
                placeholder="e.g. Rome 2025"
                value={newTripTitle}
                onChange={e => setNewTripTitle(e.target.value)}
              />
            )}
          </Field>
          <div className="mt-2.5 flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit" size="lg" className="flex-1 bg-white text-black shadow-none hover:bg-white/90">Create Trip</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
