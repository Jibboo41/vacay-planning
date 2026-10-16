import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import type { AddMenuAnchor } from '../store/useTripStore';

export interface AddMenuOption {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  background: string;
  onSelect: () => void;
}

interface AddMenuProps {
  anchor: AddMenuAnchor | null;
  tripTitle?: string;
  options: AddMenuOption[];
  onClose: () => void;
}

const VIEWPORT_MARGIN = 12;

function focusTrigger() {
  document.querySelector<HTMLElement>('[data-add-menu-trigger]')?.focus();
}

/**
 * "Add to timeline" chooser. Renders as a bottom sheet on mobile and as a
 * popover beside its trigger when opened with an anchor (desktop side rail).
 */
export default function AddMenu({ anchor, tripTitle, options, onClose }: AddMenuProps) {
  const panelRef = useRef<HTMLElement>(null);

  const dismiss = useCallback(() => {
    onClose();
    focusTrigger();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }

      const panel = panelRef.current;
      if (event.key !== 'Tab' || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusInside = panel.contains(document.activeElement);
      if (event.shiftKey && (!focusInside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!focusInside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !anchor) return;
    const maxTop = window.innerHeight - panel.offsetHeight - VIEWPORT_MARGIN;
    panel.style.left = `${anchor.right + VIEWPORT_MARGIN}px`;
    panel.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(anchor.top - 8, maxTop))}px`;
  }, [anchor]);

  return (
    <div
      className={`add-menu-overlay ${anchor ? 'add-menu-overlay--anchored' : ''}`}
      onClick={dismiss}
    >
      <section
        ref={panelRef}
        className={`add-menu ${anchor ? 'add-menu--popover' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-menu-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="add-menu__header">
          <div className="add-menu__heading">
            <h2 id="add-menu-title">Add to timeline</h2>
            {tripTitle && <p>{tripTitle}</p>}
          </div>
          <button
            type="button"
            className="add-menu__close"
            aria-label="Close add menu"
            onClick={dismiss}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="add-menu__grid">
          {options.map((option, index) => {
            const Icon = option.icon;

            return (
              <button
                key={option.key}
                type="button"
                className="add-menu__option"
                autoFocus={index === 0}
                onClick={() => {
                  onClose();
                  option.onSelect();
                }}
              >
                <span
                  className="add-menu__icon"
                  style={{ color: option.color, background: option.background }}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="add-menu__label">{option.label}</span>
                <span className="add-menu__description">{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
