import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, FileSpreadsheet, List, LogOut, Plus, Share2, Sparkles, Terminal } from 'lucide-react';
import { auth } from '../core/firebase';
import { DEFAULT_ROUTE, isDebugEnabled } from '../app/routes';
import { isFeatureEnabled } from '../core/featureFlags';
import { THEMES } from '../core/themes';
import { useIsWide, usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { cn } from '../lib/cn';
import { describeTimelineFilters, resetTimelineFilters, useTimelineFilterStatus } from '../store/timelineFilters';
import { useTripStore } from '../store/useTripStore';
import { downloadTripExcel } from '../utils/exportUtils';
import ShareSheet from './ShareSheet';
import TimelineFilters from './TimelineFilters';
import { Button, Field, Input, Modal, ScreenHeader } from './ui';
import { buttonVariants } from './ui/variants';

const sectionClass = 'scroll-mt-28';
const sectionTitle = 'mb-3 text-footnote font-extrabold uppercase tracking-wider text-label-secondary';

/**
 * Settings screen (reached from the tab bar / side rail). Replaces the old
 * hamburger drawer and, on mobile, hosts the timeline search & type filters.
 */
export default function SettingsScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trips = useTripStore((s) => s.trips);
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const addTrip = useTripStore((s) => s.addTrip);
  const theme = useTripStore((s) => s.theme);
  const setTheme = useTripStore((s) => s.setTheme);
  const tintedBackgrounds = useTripStore((s) => s.tintedBackgrounds);
  const setTintedBackgrounds = useTripStore((s) => s.setTintedBackgrounds);

  const navigate = useNavigate();
  const { hash } = useLocation();
  const isWide = useIsWide();
  const reducedMotion = usePrefersReducedMotion();
  const filterStatus = useTimelineFilterStatus();
  const sharingEnabled = isFeatureEnabled('sharing');
  const currentTrip = trips.find((t) => t.id === currentTripId);

  const [isAdding, setIsAdding] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // New screens open at the top. Deep links such as /settings#timeline-filters
  // instead scroll their target into view.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
        return;
      }
      const splitPane = rootRef.current?.closest<HTMLElement>('.split-right');
      if (splitPane) splitPane.scrollTo({ top: 0, behavior: 'auto' });
      else window.scrollTo({ top: 0, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, reducedMotion]);

  const handleSelectTrip = (id: string) => {
    setCurrentTrip(id);
    navigate(DEFAULT_ROUTE, { viewTransition: !reducedMotion });
  };

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;
    try {
      await addTrip(newTripTitle);
      setNewTripTitle('');
      setIsAdding(false);
      navigate(DEFAULT_ROUTE);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={rootRef} className="safe-area-inset min-h-dvh">
      <ScreenHeader title="Settings" subtitle={currentTrip ? currentTrip.title : 'No trip selected'} />

      <div className="mx-auto flex max-w-2xl flex-col gap-9 px-6 pt-2 pb-[120px]">
        {currentTrip && (
          <section id="timeline-filters" aria-labelledby="settings-filters" className={sectionClass}>
            <h2 id="settings-filters" className={sectionTitle}>Search &amp; filter timeline</h2>
            <TimelineFilters wrap />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="m-0 min-w-0 flex-1 text-footnote text-label-secondary" aria-live="polite">
                Showing {filterStatus.shownCount} of {filterStatus.totalCount} {filterStatus.totalCount === 1 ? 'item' : 'items'}
                {filterStatus.isFiltered && describeTimelineFilters(filterStatus) && <> · {describeTimelineFilters(filterStatus)}</>}
              </p>
              {filterStatus.isFiltered && (
                <Button variant="ghost" size="sm" onClick={resetTimelineFilters}>Reset</Button>
              )}
              {!isWide && (
                <Link to="/timeline" viewTransition={!reducedMotion} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                  <List size={16} aria-hidden="true" />
                  View timeline
                </Link>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="settings-trips" className={sectionClass}>
          <h2 id="settings-trips" className={sectionTitle}>Trips</h2>
          {trips.length > 0 && (
            <ul className="mb-3 flex flex-col gap-2">
              {trips.map((trip) => {
                const active = trip.id === currentTripId;
                return (
                  <li key={trip.id}>
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => handleSelectTrip(trip.id)}
                      className={cn(
                        'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-colors motion-reduce:transition-none',
                        active ? 'border-sys-blue/40 bg-sys-blue/12' : 'border-white/8 bg-white/4 hover:bg-white/8',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-label">{trip.title}</span>
                        <span className="mt-0.5 block text-caption text-label-secondary">
                          {trip.items.length} {trip.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </span>
                      {active && <Check size={18} className="shrink-0 text-sys-blue" aria-label="Current trip" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsAdding(true)}>
              <Plus size={18} aria-hidden="true" />
              New trip
            </Button>
            <Link to="/trips" viewTransition={!reducedMotion} className={cn(buttonVariants({ variant: 'secondary' }), 'flex-1')}>
              Manage trips
            </Link>
          </div>
        </section>

        {currentTrip && (
          <section aria-labelledby="settings-export" className={sectionClass}>
            <h2 id="settings-export" className={sectionTitle}>Export &amp; share</h2>
            <div className="flex flex-col gap-2.5">
              <Button block onClick={() => downloadTripExcel(currentTrip.title, currentTrip.items || [], currentTrip.expenses || [])}>
                <FileSpreadsheet size={18} aria-hidden="true" />
                Export to Sheets
              </Button>
              {sharingEnabled && (
                <Button block variant="secondary" onClick={() => setIsShareOpen(true)}>
                  <Share2 size={18} aria-hidden="true" />
                  Share trip
                </Button>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="settings-appearance" className={sectionClass}>
          <h2 id="settings-appearance" className={sectionTitle}>Appearance</h2>
          <div className="mb-4 rounded-2xl border border-white/8 bg-white/3 px-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={tintedBackgrounds}
              onClick={() => setTintedBackgrounds(!tintedBackgrounds)}
              className="flex min-h-12 w-full items-center justify-between gap-3 py-1 text-left"
            >
              <span className="flex items-center gap-2.5">
                <span className={cn('flex size-8 items-center justify-center rounded-chip bg-white/5', tintedBackgrounds ? 'text-sys-blue' : 'text-label-secondary')}>
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className={cn('text-[14px] font-semibold', tintedBackgrounds ? 'text-label' : 'text-label-secondary')}>Tinted timeline cards</span>
                  <span className="text-caption text-label-tertiary">Color each card to match its type</span>
                </span>
              </span>
              <span className={cn('relative h-6 w-11 shrink-0 rounded-xl transition-colors motion-reduce:transition-none', tintedBackgrounds ? 'bg-sys-blue' : 'bg-white/10')}>
                <span className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200 ease-ios motion-reduce:transition-none',
                  tintedBackgrounds ? 'left-[22px]' : 'left-0.5',
                )} />
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => {
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
                    <Icon size={20} className="text-white/90 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" aria-hidden="true" />
                    <span className="text-caption font-extrabold tracking-wide text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">{t.label}</span>
                  </div>
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="settings-account" className={sectionClass}>
          <h2 id="settings-account" className={sectionTitle}>Account</h2>
          <div className="flex gap-2.5">
            <Button variant="danger" className="flex-1" onClick={() => auth.signOut()}>
              <LogOut size={18} aria-hidden="true" />
              Sign out
            </Button>
            {isDebugEnabled() && (
              <Link to="/debug" className={buttonVariants({ variant: 'secondary' })} aria-label="System logs" title="System logs">
                <Terminal size={18} aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </div>

      {sharingEnabled && currentTrip && (
        <ShareSheet open={isShareOpen} onClose={() => setIsShareOpen(false)} tripTitle={currentTrip.title} />
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
                onChange={(e) => setNewTripTitle(e.target.value)}
              />
            )}
          </Field>
          <div className="mt-2.5 flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit" size="lg" className="flex-1 bg-white text-black shadow-none hover:bg-white/90">Create Trip</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
