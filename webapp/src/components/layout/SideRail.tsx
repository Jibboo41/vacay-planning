import { Map as MapIcon, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { APP_ROUTES, isAppRoute, withTimelineAddAction } from '../../app/routes';
import { useTripStore } from '../../store/useTripStore';

const RAIL_ENTRIES = withTimelineAddAction(APP_ROUTES);

export default function SideRail() {
  const setSidebarOpen = useTripStore(state => state.setSidebarOpen);
  const isSidebarOpen = useTripStore(state => state.isSidebarOpen);
  const isAddMenuOpen = useTripStore(state => state.isAddMenuOpen);
  const openAddMenu = useTripStore(state => state.openAddMenu);
  const hasTrip = useTripStore(state => !!state.currentTripId);

  return (
    <nav className="desktop-side-rail" aria-label="Primary">
      <button
        type="button"
        data-settings-trigger
        className={`desktop-side-rail__item ${isSidebarOpen ? 'desktop-side-rail__item--active' : ''}`}
        aria-label="Open settings"
        aria-haspopup="dialog"
        aria-expanded={isSidebarOpen}
        title="Settings"
        onClick={() => setSidebarOpen(true)}
      >
        <Settings size={22} aria-hidden="true" />
        <span>Settings</span>
      </button>

      <div className="desktop-side-rail__divider" aria-hidden="true" />

      <ul className="desktop-side-rail__list">
        {RAIL_ENTRIES.map(entry => {
          const Icon = entry.icon;

          if (!isAppRoute(entry)) {
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  data-add-menu-trigger
                  className={`desktop-side-rail__item ${isAddMenuOpen ? 'desktop-side-rail__item--active' : ''}`}
                  aria-label={entry.description}
                  aria-haspopup="dialog"
                  aria-expanded={isAddMenuOpen}
                  title={hasTrip ? entry.description : 'Select a trip before adding an item'}
                  disabled={!hasTrip}
                  onClick={event => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    openAddMenu({ top: bounds.top, right: bounds.right });
                  }}
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{entry.label}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={entry.key}>
              <NavLink
                to={entry.path}
                end
                title={entry.description}
                className={({ isActive }) =>
                  `desktop-side-rail__item ${isActive ? 'desktop-side-rail__item--active' : ''}`
                }
              >
                <Icon size={22} aria-hidden="true" />
                <span>{entry.label}</span>
              </NavLink>
            </li>
          );
        })}

        <li>
          <NavLink
            to="/trips"
            end
            title="All trips"
            className={({ isActive }) =>
              `desktop-side-rail__item ${isActive ? 'desktop-side-rail__item--active' : ''}`
            }
          >
            <MapIcon size={22} aria-hidden="true" />
            <span>Trips</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
