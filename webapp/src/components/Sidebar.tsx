import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react';
import {
  BedDouble,
  Car,
  Check,
  ChevronRight,
  FileSpreadsheet,
  LogOut,
  MountainSnow,
  Moon,
  Sun,
  Navigation,
  Plane,
  Plus,
  Sparkles,
  StickyNote,
  Terminal,
  TrainFront,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../core/firebase';
import { useTripStore } from '../store/useTripStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_FILTERS: { type: string; label: string; icon: LucideIcon }[] = [
  { type: 'flight', label: 'Flights', icon: Plane },
  { type: 'hotel', label: 'Hotels', icon: BedDouble },
  { type: 'rental-car', label: 'Cars', icon: Car },
  { type: 'activity', label: 'Activities', icon: Navigation },
  { type: 'hiking', label: 'Hiking', icon: MountainSnow },
  { type: 'food', label: 'Food', icon: Utensils },
  { type: 'transit', label: 'Transit', icon: TrainFront },
  { type: 'note', label: 'Notes', icon: StickyNote },
];

const THEMES = [
  { key: 'default', label: 'Default', swatch: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)' },
  { key: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg, #FF3B30 0%, #FF9F0A 50%, #FFD60A 100%)' },
  { key: 'midnight', label: 'Midnight', swatch: 'linear-gradient(135deg, #5E5CE6 0%, #BF5AF2 60%, #32ADE6 100%)' },
  { key: 'forest', label: 'Forest', swatch: 'linear-gradient(135deg, #30D158 0%, #34C759 50%, #32ADE6 100%)' },
  { key: 'aurora', label: 'Aurora', swatch: 'linear-gradient(135deg, #00F5A0 0%, #8B5CF6 55%, #06B6D4 100%)' },
  { key: 'desert', label: 'Desert Rose', swatch: 'linear-gradient(135deg, #E2A57E 0%, #C9415A 55%, #EDCA7F 100%)' },
  { key: 'ocean', label: 'Deep Ocean', swatch: 'linear-gradient(135deg, #0EA5E9 0%, #0D9488 50%, #6366F1 100%)' },
  { key: 'vulcan', label: 'Vulcan', swatch: 'linear-gradient(135deg, #FF4500 0%, #FF8C00 50%, #FF2D55 100%)' },
  { key: 'sakura', label: 'Sakura', swatch: 'linear-gradient(135deg, #FF85A2 0%, #D891EF 55%, #FFB6CE 100%)' },
  { key: 'cyberpunk', label: 'Cyberpunk', swatch: 'linear-gradient(135deg, #FF00AA 0%, #00FFEA 55%, #FFE600 100%)' },
  { key: 'slate', label: 'Slate', swatch: '#708090' },
  { key: 'black', label: 'Black', swatch: '#000000' },
];

const TRIP_COLORS = ['var(--sys-blue)', 'var(--sys-purple)', 'var(--sys-green)', 'var(--sys-orange)', 'var(--sys-pink-alt)', 'var(--sys-cyan)', 'var(--sys-indigo)', 'var(--sys-yellow)'];

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function tripColor(tripId: string) {
  let hash = 0;
  for (let index = 0; index < tripId.length; index += 1) {
    hash = (hash * 31 + tripId.charCodeAt(index)) | 0;
  }
  return TRIP_COLORS[Math.abs(hash) % TRIP_COLORS.length];
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const trips = useTripStore(state => state.trips);
  const currentTripId = useTripStore(state => state.currentTripId);
  const setCurrentTrip = useTripStore(state => state.setCurrentTrip);
  const addTrip = useTripStore(state => state.addTrip);
  const appearance = useTripStore(state => state.appearance);
  const setAppearance = useTripStore(state => state.setAppearance);
  const theme = useTripStore(state => state.theme);
  const setTheme = useTripStore(state => state.setTheme);
  const activeFilters = useTripStore(state => state.activeFilters);
  const toggleFilter = useTripStore(state => state.toggleFilter);
  const showAllFilters = useTripStore(state => state.showAllFilters);
  const tintedBackgrounds = useTripStore(state => state.tintedBackgrounds);
  const setTintedBackgrounds = useTripStore(state => state.setTintedBackgrounds);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLElement>(null);

  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const currentTrip = trips.find(trip => trip.id === currentTripId);
  const user = auth.currentUser;
  const userLabel = user?.displayName || user?.email || 'Signed in';
  const hasHiddenFilters = ITEM_FILTERS.some(filter => !activeFilters.includes(filter.type));

  const cancelNewTrip = () => {
    setIsAddingTrip(false);
    setNewTripTitle('');
  };

  const close = () => {
    cancelNewTrip();
    onClose();
  };

  const requestClose = useEffectEvent(close);

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    panel.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const focusInside = !!active && active !== panel && panel.contains(active);

      if (event.shiftKey && (!focusInside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!focusInside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const active = document.activeElement;
      if (!active || active === document.body || panel.contains(active)) {
        document.querySelector<HTMLElement>('[data-settings-trigger]')?.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  const handleSelectTrip = (tripId: string) => {
    setCurrentTrip(tripId);
    goTo('/timeline');
  };

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTripTitle.trim();
    if (!title || isCreatingTrip) return;

    setIsCreatingTrip(true);
    try {
      await addTrip(title);
      goTo('/timeline');
    } catch (error) {
      console.error('Failed to create trip', error);
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleExport = async () => {
    if (!currentTrip || isExporting) return;
    setIsExporting(true);
    try {
      const { downloadTripExcel } = await import('../utils/excelExport');
      await downloadTripExcel(currentTrip.title, currentTrip.items || [], currentTrip.expenses || [], currentTrip.dayDescriptions || {});
    } catch (error) {
      console.error('Failed to export trip', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = () => {
    close();
    auth.signOut();
  };

  return (
    <>
      <div
        className={`settings-overlay ${isOpen ? 'settings-overlay--open' : ''}`}
        aria-hidden="true"
        onClick={close}
      />

      <section
        ref={panelRef}
        className={`settings-panel ${isOpen ? 'settings-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        inert={!isOpen}
      >
        <header className="settings-header">
          <div className="settings-header__text">
            <h2 id="settings-title">Settings</h2>
            <p>{currentTrip?.title || 'No trip selected'}</p>
          </div>
          <button
            type="button"
            className="settings-icon-button"
            aria-label="Close settings"
            onClick={close}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section" aria-labelledby="settings-trips-heading">
            <div className="settings-section__header">
              <h3 id="settings-trips-heading">Trips</h3>
              <button type="button" className="settings-link" onClick={() => goTo('/trips')}>
                All trips
              </button>
            </div>

            <div className="settings-group">
              {trips.map(trip => {
                const selected = trip.id === currentTripId;
                const color = tripColor(trip.id);
                const itemCount = trip.items?.length ?? 0;

                return (
                  <button
                    key={trip.id}
                    type="button"
                    className={`settings-row ${selected ? 'settings-row--selected' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => handleSelectTrip(trip.id)}
                  >
                    <span className="settings-row__icon" style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }} aria-hidden="true">
                      {trip.title.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="settings-row__text">
                      <span className="settings-row__title">{trip.title}</span>
                      <span className="settings-row__subtitle">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </span>
                    {selected && <Check size={18} className="settings-row__check" aria-hidden="true" />}
                  </button>
                );
              })}

              {isAddingTrip ? (
                <form className="settings-new-trip" onSubmit={handleCreateTrip}>
                  <input
                    autoFocus
                    type="text"
                    aria-label="Trip name"
                    placeholder="Trip name, e.g. Rome 2025"
                    value={newTripTitle}
                    disabled={isCreatingTrip}
                    onChange={event => setNewTripTitle(event.target.value)}
                    onKeyDown={event => {
                      if (event.key !== 'Escape') return;
                      event.stopPropagation();
                      cancelNewTrip();
                    }}
                  />
                  <button type="button" className="settings-text-button" onClick={cancelNewTrip}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings-primary-button"
                    disabled={!newTripTitle.trim() || isCreatingTrip}
                  >
                    {isCreatingTrip ? 'Creating…' : 'Create'}
                  </button>
                </form>
              ) : (
                <button type="button" className="settings-row" onClick={() => setIsAddingTrip(true)}>
                  <span className="settings-row__icon settings-row__icon--accent" aria-hidden="true">
                    <Plus size={18} />
                  </span>
                  <span className="settings-row__text">
                    <span className="settings-row__title settings-row__title--accent">New trip</span>
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="settings-section" aria-labelledby="settings-filters-heading">
            <div className="settings-section__header">
              <h3 id="settings-filters-heading">Filters</h3>
              {hasHiddenFilters && (
                <button type="button" className="settings-link" onClick={showAllFilters}>
                  Show all
                </button>
              )}
            </div>
            <div className="settings-chips">
              {ITEM_FILTERS.map(filter => {
                const Icon = filter.icon;
                const active = activeFilters.includes(filter.type);

                return (
                  <button
                    key={filter.type}
                    type="button"
                    className={`settings-chip ${active ? 'settings-chip--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleFilter(filter.type)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="settings-section__footnote">Item types shown on the timeline and map.</p>
          </section>

          {currentTrip && (
            <section className="settings-section" aria-labelledby="settings-export-heading">
              <div className="settings-section__header">
                <h3 id="settings-export-heading">Export</h3>
              </div>
              <div className="settings-group">
                <button type="button" className="settings-row" disabled={isExporting} onClick={handleExport}>
                  <span
                    className="settings-row__icon"
                    style={{ color: 'var(--sys-green)', background: 'rgba(48, 209, 88, 0.16)' }}
                    aria-hidden="true"
                  >
                    <FileSpreadsheet size={18} />
                  </span>
                  <span className="settings-row__text">
                    <span className="settings-row__title">Export spreadsheet</span>
                    <span className="settings-row__subtitle">
                      {isExporting ? 'Preparing download…' : 'Itinerary & costs as .xlsx'}
                    </span>
                  </span>
                  <ChevronRight size={18} className="settings-row__chevron" aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          <section className="settings-section" aria-labelledby="settings-appearance-heading">
            <div className="settings-section__header">
              <h3 id="settings-appearance-heading">Appearance</h3>
            </div>
            <div className="appearance-options" role="group" aria-label="Color appearance">
              {(['dark', 'light'] as const).map(mode => (
                <button type="button" key={mode} aria-pressed={appearance === mode} onClick={() => setAppearance(mode)} className={`appearance-option appearance-option--${mode}`}>
                  <span className="appearance-option__sample" aria-hidden="true"><span /><span /><span /></span>
                  <span>{mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}{mode === 'dark' ? 'Dark' : 'Light'}{appearance === mode && <Check size={15} />}</span>
                </button>
              ))}
            </div>
            <div className="settings-group">
              <button
                type="button"
                role="switch"
                aria-checked={tintedBackgrounds}
                className="settings-row"
                onClick={() => setTintedBackgrounds(!tintedBackgrounds)}
              >
                <span
                  className="settings-row__icon"
                  style={{ color: 'var(--sys-purple)', background: 'rgba(191, 90, 242, 0.16)' }}
                  aria-hidden="true"
                >
                  <Sparkles size={18} />
                </span>
                <span className="settings-row__text">
                  <span className="settings-row__title">Tinted cards</span>
                  <span className="settings-row__subtitle">Color timeline cards by type</span>
                </span>
                <span className={`settings-switch ${tintedBackgrounds ? 'settings-switch--on' : ''}`} aria-hidden="true" />
              </button>
            </div>

            <div className="settings-themes" role="group" aria-label="Dark background theme" hidden={appearance === 'light'}>
              {THEMES.map(option => {
                const selected = theme === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`settings-theme ${selected ? 'settings-theme--selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => setTheme(option.key)}
                  >
                    <span className="settings-theme__swatch" style={{ background: option.swatch }} aria-hidden="true">
                      {selected && <Check size={18} strokeWidth={3} />}
                    </span>
                    <span className="settings-theme__label">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="settings-footer">
          <div className="settings-account">
            {user?.photoURL && !avatarFailed ? (
              <img
                className="settings-account__avatar"
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="settings-account__avatar" aria-hidden="true">
                {userLabel.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="settings-account__text">
              <span className="settings-account__name">{userLabel}</span>
              {user?.displayName && user.email && (
                <span className="settings-account__email">{user.email}</span>
              )}
            </div>
            <button
              type="button"
              className="settings-icon-button"
              aria-label="Open system logs"
              title="System logs"
              onClick={() => goTo('/debug')}
            >
              <Terminal size={18} aria-hidden="true" />
            </button>
          </div>

          <button type="button" className="settings-signout" onClick={handleSignOut}>
            <LogOut size={18} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </footer>
      </section>
    </>
  );
}
