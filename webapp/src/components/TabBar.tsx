import { NavLink } from 'react-router-dom';
import { Calendar, Compass } from 'lucide-react';

export default function TabBar() {
  return (
    <div className="floating-tab-bar">
      <NavLink
        to="/map"
        aria-label="Destinations map"
        className={({ isActive }) =>
          `floating-tab-btn ${isActive ? 'floating-tab-btn--active' : ''}`
        }
      >
        <Compass size={22} />
      </NavLink>

      <NavLink
        to="/timeline"
        aria-label="Itinerary timeline"
        className={({ isActive }) =>
          `floating-tab-btn ${isActive ? 'floating-tab-btn--active' : ''}`
        }
      >
        <Calendar size={22} />
      </NavLink>
    </div>
  );
}
