import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTripStore } from '../../store/useTripStore';
import { IconButton } from './IconButton';

export interface ScreenHeaderProps {
  title: ReactNode;
  /** Optional small line above/below the title. */
  subtitle?: ReactNode;
  /** Right-aligned actions. */
  actions?: ReactNode;
  /** Extra content under the title row (filters, day pills…). */
  children?: ReactNode;
  className?: string;
  /** Hide the sidebar (hamburger) button. */
  hideMenu?: boolean;
}

/** Sticky frosted header shared by every screen. */
export function ScreenHeader({ title, subtitle, actions, children, className, hideMenu }: ScreenHeaderProps) {
  const setSidebarOpen = useTripStore((s) => s.setSidebarOpen);
  return (
    <header className={cn('screen-header flex-col items-stretch gap-2', className)}>
      <div className="flex items-center gap-4">
        {!hideMenu && (
          <IconButton aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="page-title truncate text-[1.7rem]">{title}</h1>
          {subtitle && <p className="truncate text-footnote text-label-secondary">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
