import { useState } from 'react';
import { Map as MapIcon, MoreHorizontal, Settings, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES, findRoute, isAppRoute, withTimelineAddAction } from '../app/routes';
import { useTripStore } from '../store/useTripStore';

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSidebarOpen = useTripStore(state => state.setSidebarOpen);
  const isSidebarOpen = useTripStore(state => state.isSidebarOpen);
  const isAddMenuOpen = useTripStore(state => state.isAddMenuOpen);
  const openAddMenu = useTripStore(state => state.openAddMenu);
  const hasTrip = useTripStore(state => !!state.currentTripId);
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryEntries = withTimelineAddAction(APP_ROUTES.filter(route => route.primary));
  const secondaryRoutes = APP_ROUTES.filter(route => !route.primary);
  const currentRoute = findRoute(location.pathname);
  const moreActive = (!!currentRoute && !currentRoute.primary) || location.pathname === '/trips';

  return (
    <>
      <nav className="mobile-tab-bar" aria-label="Primary">
        <ul className="mobile-tab-bar__list">
          {primaryEntries.map(entry => {
            const Icon = entry.icon;

            if (!isAppRoute(entry)) {
              return (
                <li key={entry.key}>
                  <button
                    type="button"
                    data-add-menu-trigger
                    className={`mobile-tab-bar__item ${isAddMenuOpen ? 'mobile-tab-bar__item--active' : ''}`}
                    aria-label={entry.description}
                    aria-haspopup="dialog"
                    aria-expanded={isAddMenuOpen}
                    disabled={!hasTrip}
                    onClick={() => openAddMenu()}
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
                  aria-label={entry.description}
                  className={({ isActive }) =>
                    `mobile-tab-bar__item ${isActive ? 'mobile-tab-bar__item--active' : ''}`
                  }
                >
                  <Icon size={22} aria-hidden="true" />
                  <span>{entry.label}</span>
                </NavLink>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              className={`mobile-tab-bar__item ${moreActive ? 'mobile-tab-bar__item--active' : ''}`}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal size={22} aria-hidden="true" />
              <span>More</span>
            </button>
          </li>

          <li>
            <button
              type="button"
              data-settings-trigger
              className={`mobile-tab-bar__item ${isSidebarOpen ? 'mobile-tab-bar__item--active' : ''}`}
              aria-label="Open settings"
              aria-haspopup="dialog"
              aria-expanded={isSidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <Settings size={22} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)}>
          <section
            className="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="mobile-more-sheet__header">
              <h2 id="mobile-more-title">More</h2>
              <button
                type="button"
                className="mobile-more-sheet__close"
                aria-label="Close more menu"
                onClick={() => setMoreOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-more-sheet__grid">
              {secondaryRoutes.map(route => {
                const Icon = route.icon;
                const active = currentRoute?.key === route.key;

                return (
                  <button
                    key={route.key}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    className={`mobile-more-sheet__item ${active ? 'mobile-more-sheet__item--active' : ''}`}
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(route.path);
                    }}
                  >
                    <Icon size={23} aria-hidden="true" />
                    <span>{route.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                className={`mobile-more-sheet__item ${location.pathname === '/trips' ? 'mobile-more-sheet__item--active' : ''}`}
                onClick={() => {
                  setMoreOpen(false);
                  navigate('/trips');
                }}
              >
                <MapIcon size={23} aria-hidden="true" />
                <span>All Trips</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
