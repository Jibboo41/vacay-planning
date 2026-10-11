import { NavLink } from 'react-router-dom';
import { Map as MapIcon, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { APP_ROUTES, SETTINGS_ROUTE, isAppRoute, withTimelineAddAction } from '../../app/routes';
import { cn } from '../../lib/cn';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { useTripStore } from '../../store/useTripStore';
import { useUiStore } from '../../store/useUiStore';

const railItem = (active: boolean) =>
  cn(
    'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-control text-[12px] font-semibold transition-colors',
    active ? 'bg-sys-blue/25 text-label' : 'text-label-secondary hover:bg-white/8 hover:text-label',
  );

/** Desktop navigation rail driven by `APP_ROUTES`, plus Trips and Settings. */
export default function SideRail({ showTimelineToggle }: { showTimelineToggle: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const SettingsIcon = SETTINGS_ROUTE.icon;
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const addMenuOpen = useUiStore((s) => s.addMenuOpen);
  const setAddMenuOpen = useUiStore((s) => s.setAddMenuOpen);
  const hasTrip = useTripStore((s) => !!s.currentTripId);
  const collapsed = useUiStore((s) => s.timelineCollapsed);
  const setCollapsed = useUiStore((s) => s.setTimelineCollapsed);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-[2400] flex w-(--side-rail-w) flex-col items-center gap-1 overflow-y-auto border-r border-white/8 bg-surface/60 px-2 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 backdrop-blur-[30px]"
    >
      <button
        type="button"
        aria-label={`Search (${isMac ? '⌘' : 'Ctrl+'}K)`}
        title={`Search (${isMac ? '⌘' : 'Ctrl+'}K)`}
        className={railItem(false)}
        onClick={() => setPaletteOpen(true)}
      >
        <Search size={22} aria-hidden="true" />
      </button>
      <div className="my-1 h-px w-8 bg-white/10" aria-hidden="true" />
      <ul className="flex w-full flex-col gap-1">
        {withTimelineAddAction(APP_ROUTES).map((item) => {
          const Icon = item.icon;
          if (!isAppRoute(item)) {
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={cn(railItem(addMenuOpen), 'disabled:cursor-default disabled:opacity-40')}
                  title={hasTrip ? item.description : 'Select a trip before adding an item'}
                  aria-label={item.description}
                  aria-haspopup="dialog"
                  aria-expanded={addMenuOpen}
                  disabled={!hasTrip}
                  onClick={() => setAddMenuOpen(true)}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          }
          return (
            <li key={item.key}>
              <NavLink to={item.path} viewTransition={!reducedMotion} title={item.description} className={({ isActive }) => railItem(isActive)}>
                <Icon size={22} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li>
          <NavLink to="/trips" viewTransition={!reducedMotion} title="All trips" className={({ isActive }) => railItem(isActive)}>
            <MapIcon size={22} aria-hidden="true" />
            <span>Trips</span>
          </NavLink>
        </li>
        <li>
          <NavLink to={SETTINGS_ROUTE.path} viewTransition={!reducedMotion} title={SETTINGS_ROUTE.description} className={({ isActive }) => railItem(isActive)}>
            <SettingsIcon size={22} aria-hidden="true" />
            <span>{SETTINGS_ROUTE.label}</span>
          </NavLink>
        </li>
      </ul>
      {showTimelineToggle && (
        <button
          type="button"
          className={cn(railItem(false), 'mt-auto')}
          aria-pressed={!collapsed}
          aria-label={collapsed ? 'Show timeline pane' : 'Hide timeline pane'}
          title={collapsed ? 'Show timeline pane' : 'Hide timeline pane'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen size={22} aria-hidden="true" /> : <PanelLeftClose size={22} aria-hidden="true" />}
        </button>
      )}
    </nav>
  );
}
