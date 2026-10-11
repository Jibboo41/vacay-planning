import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Map as MapIcon, MoreHorizontal, Search } from 'lucide-react';
import { APP_ROUTES, SETTINGS_ROUTE, findRoute, isAppRoute, withTimelineAddAction } from '../app/routes';
import { cn } from '../lib/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { useTimelineFilterStatus } from '../store/timelineFilters';
import { Sheet } from './ui';

const tabClass = (active: boolean) =>
  cn(
    'flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-card border px-0.5 text-caption font-semibold transition-all disabled:cursor-default disabled:opacity-40',
    active ? 'border-white/20 bg-white/12 text-label' : 'border-transparent text-label-secondary hover:bg-white/6 hover:text-label',
  );

const tabLabel = 'max-w-full truncate';

/** Mobile bottom tab bar driven by `APP_ROUTES` (primary routes + "More" sheet) plus Settings. */
export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const addMenuOpen = useUiStore((s) => s.addMenuOpen);
  const setAddMenuOpen = useUiStore((s) => s.setAddMenuOpen);
  const hasTrip = useTripStore((s) => !!s.currentTripId);
  // Timeline search/filters live in Settings on mobile, so flag them on its tab.
  const filtersActive = useTimelineFilterStatus().isFiltered && hasTrip;
  const SettingsIcon = SETTINGS_ROUTE.icon;
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = withTimelineAddAction(APP_ROUTES.filter((r) => r.primary));
  const secondary = APP_ROUTES.filter((r) => !r.primary);
  const current = findRoute(location.pathname);
  const moreActive = !!current && !current.primary;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[2400] border-t border-white/8 bg-surface/35 px-1 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] shadow-[0_-4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[40px] backdrop-saturate-200"
      >
        <ul className="mx-auto flex max-w-xl items-stretch">
          {primary.map((item) => {
            const Icon = item.icon;
            if (!isAppRoute(item)) {
              return (
                <li key={item.key} className="flex flex-1">
                  <button
                    type="button"
                    className={tabClass(addMenuOpen)}
                    aria-label={item.description}
                    aria-haspopup="dialog"
                    aria-expanded={addMenuOpen}
                    disabled={!hasTrip}
                    onClick={() => setAddMenuOpen(true)}
                  >
                    <Icon size={22} aria-hidden="true" />
                    <span className={tabLabel}>{item.label}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={item.key} className="flex flex-1">
                <NavLink
                  to={item.path}
                  viewTransition={!reducedMotion}
                  aria-label={item.description}
                  className={({ isActive }) => tabClass(isActive)}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span className={tabLabel}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              type="button"
              className={tabClass(moreActive)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal size={22} aria-hidden="true" />
              <span className={tabLabel}>More</span>
            </button>
          </li>
          <li className="flex flex-1">
            <NavLink
              to={SETTINGS_ROUTE.path}
              viewTransition={!reducedMotion}
              aria-label={filtersActive ? `${SETTINGS_ROUTE.label} (timeline filters active)` : SETTINGS_ROUTE.label}
              className={({ isActive }) => tabClass(isActive)}
            >
              <span className="relative">
                <SettingsIcon size={22} aria-hidden="true" />
                {filtersActive && (
                  <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-surface bg-sys-blue" aria-hidden="true" />
                )}
              </span>
              <span className={tabLabel}>{SETTINGS_ROUTE.label}</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-3 gap-3 pb-2">
          {secondary.map((r) => {
            const Icon = r.icon;
            const active = current?.key === r.key;
            return (
              <button
                key={r.key}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => { setMoreOpen(false); navigate(r.path, { viewTransition: !reducedMotion }); }}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border text-footnote font-semibold',
                  active ? 'border-sys-blue/50 bg-sys-blue/20 text-label' : 'border-white/8 bg-white/5 text-label-secondary hover:bg-white/10 hover:text-label',
                )}
              >
                <Icon size={22} aria-hidden="true" />
                {r.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setMoreOpen(false); navigate('/trips', { viewTransition: !reducedMotion }); }}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border border-white/8 bg-white/5 text-footnote font-semibold text-label-secondary hover:bg-white/10 hover:text-label"
          >
            <MapIcon size={22} aria-hidden="true" />
            All Trips
          </button>
          <button
            type="button"
            onClick={() => { setMoreOpen(false); setPaletteOpen(true); }}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border border-white/8 bg-white/5 text-footnote font-semibold text-label-secondary hover:bg-white/10 hover:text-label"
          >
            <Search size={22} aria-hidden="true" />
            Search
          </button>
        </div>
      </Sheet>
    </>
  );
}
