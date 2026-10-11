import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Pulsing placeholder block. Size it with Tailwind classes (`h-4 w-32`). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-control bg-white/8 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
