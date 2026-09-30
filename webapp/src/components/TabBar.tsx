import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Menu, MoreHorizontal, Search } from 'lucide-react';
import { APP_ROUTES, findRoute } from '../app/routes';
import { cn } from '../lib/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { Sheet } from './ui';

const tabClass = (active: boolean) =>
  cn(
    'flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-control text-caption font-semibold transition-colors',
    active ? 'text-sys-blue' : 'text-label-secondary hover:text-label',
  );

/** Mobile bottom tab bar driven by `APP_ROUTES` (primary routes + "More" sheet). */
export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const setSidebarOpen = useTripStore((s) => s.setSidebarOpen);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = APP_ROUTES.filter((r) => r.primary);
  const secondary = APP_ROUTES.filter((r) => !r.primary);
  const current = findRoute(location.pathname);
  const moreActive = !!current && !current.primary;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[2400] border-t border-white/10 bg-surface/80 px-2 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] backdrop-blur-[30px]"
      >
        <ul className="mx-auto flex max-w-xl items-stretch gap-1">
          {primary.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.key} className="flex flex-1">
                <NavLink
                  to={r.path}
                  viewTransition={!reducedMotion}
                  aria-label={r.description}
                  className={({ isActive }) => tabClass(isActive)}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{r.label}</span>
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
              <span>More</span>
            </button>
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
          <button
            type="button"
            onClick={() => { setMoreOpen(false); setSidebarOpen(true); }}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border border-white/8 bg-white/5 text-footnote font-semibold text-label-secondary hover:bg-white/10 hover:text-label"
          >
            <Menu size={22} aria-hidden="true" />
            Settings
          </button>
        </div>
      </Sheet>
    </>
  );
}
