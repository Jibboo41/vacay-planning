import { Map as MapIcon, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../app/routes';
import { useTripStore } from '../../store/useTripStore';

export default function SideRail() {
  const setSidebarOpen = useTripStore(state => state.setSidebarOpen);

  return (
    <nav className="desktop-side-rail" aria-label="Primary">
      <button
        type="button"
        className="desktop-side-rail__item"
        aria-label="Open trip menu"
        title="Menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={22} aria-hidden="true" />
        <span>Menu</span>
      </button>

      <div className="desktop-side-rail__divider" aria-hidden="true" />

      <ul className="desktop-side-rail__list">
        {APP_ROUTES.map(route => {
          const Icon = route.icon;

          return (
            <li key={route.key}>
              <NavLink
                to={route.path}
                end
                title={route.description}
                className={({ isActive }) =>
                  `desktop-side-rail__item ${isActive ? 'desktop-side-rail__item--active' : ''}`
                }
              >
                <Icon size={22} aria-hidden="true" />
                <span>{route.label}</span>
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
