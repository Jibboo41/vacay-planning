import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Visible heading; also used as the dialog's accessible name. */
  title?: ReactNode;
  /** Accessible name when no visible title is rendered. */
  ariaLabel?: string;
  /** `sheet` slides up from the bottom (mobile-first); `center` is a centered dialog. */
  variant?: 'sheet' | 'center';
  /** Extra elements rendered in the header row, left of the close button. */
  headerActions?: ReactNode;
  /** Hide the default close button (e.g. when the body renders its own). */
  hideClose?: boolean;
  /** Close when clicking the backdrop (default true). */
  dismissOnBackdrop?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Accessible glass dialog: portal to <body>, `role="dialog"` + `aria-modal`,
 * focus trap, Escape to close and focus restoration on close.
 */
export function Modal({
  open, onClose, title, ariaLabel, variant = 'sheet', headerActions, hideClose, dismissOnBackdrop = true,
  className, bodyClassName, children, footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        'modal-backdrop z-[9500] animate-fade-in motion-reduce:animate-none',
        variant === 'center' ? 'items-center p-4' : 'items-end md:items-center md:p-4',
      )}
      onMouseDown={(e) => {
        if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        className={cn(
          'modal-sheet animate-slide-up motion-reduce:animate-none md:max-w-xl md:rounded-sheet',
          variant === 'center' && 'max-w-md rounded-sheet',
          'pb-[calc(24px+env(safe-area-inset-bottom))]',
          className,
        )}
      >
        {variant === 'sheet' && <div className="modal-pull-indicator md:hidden" aria-hidden="true" />}
        {(title || !hideClose || headerActions) && (
          <div className="mb-4 flex items-center gap-3">
            {title && (
              <h2 id={titleId} className="flex min-w-0 flex-1 items-center gap-2 text-title font-extrabold tracking-tight text-label">
                {title}
              </h2>
            )}
            {!title && <div className="flex-1" />}
            {headerActions}
            {!hideClose && (
              <IconButton aria-label="Close" variant="glass" size="md" round onClick={onClose}>
                <X size={20} />
              </IconButton>
            )}
          </div>
        )}
        <div className={cn('-mx-1 flex-1 overflow-y-auto overscroll-contain px-1', bodyClassName)}>{children}</div>
        {footer && <div className="mt-4 flex gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Alias: bottom sheet presentation of {@link Modal}. */
export function Sheet(props: Omit<ModalProps, 'variant'>) {
  return <Modal {...props} variant="sheet" />;
}
