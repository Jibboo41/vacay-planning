import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const linkChipVariants = cva(
  'inline-flex min-h-9 items-center gap-1.5 rounded-chip border px-3 text-caption font-black no-underline shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors duration-200 motion-reduce:transition-none',
  {
    variants: {
      tone: {
        green: 'border-sys-green/30 bg-sys-green/25 text-sys-green hover:bg-sys-green/35',
        blue: 'border-sys-blue/30 bg-sys-blue/25 text-sys-blue hover:bg-sys-blue/35',
        neutral: 'border-white/12 bg-white/6 text-label hover:bg-white/12',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type LinkChipProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> &
  VariantProps<typeof linkChipVariants> & { href: string; icon?: ReactNode };

/**
 * External link rendered as a chip. Always a real `<a>` that opens in a new tab
 * with `noopener noreferrer`, and stops click propagation so it can live inside
 * clickable cards.
 */
export function LinkChip({ className, tone, icon, children, onClick, ...props }: LinkChipProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(linkChipVariants({ tone }), className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {icon}
      {children}
    </a>
  );
}
