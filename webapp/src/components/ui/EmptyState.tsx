import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Primary call-to-action (usually a <Button>). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-8 py-16 text-center', className)}>
      {icon && (
        <div className="mb-1 flex size-16 items-center justify-center rounded-panel border border-white/10 bg-white/5 text-label-secondary">
          {icon}
        </div>
      )}
      <h2 className="text-headline font-extrabold text-label">{title}</h2>
      {description && <p className="max-w-xs text-footnote text-label-secondary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
