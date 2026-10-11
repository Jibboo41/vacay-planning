import type { HTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from './variants';
import { cn } from '../../lib/cn';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

/** Non-interactive label (status, metadata, type). */
export function Badge({ className, tone, size, bordered, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size, bordered }), className)} {...props} />;
}

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/** Interactive, toggleable pill (filters, day pills). Exposes `aria-pressed`. */
export function Chip({ className, selected = false, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-footnote font-semibold transition-colors duration-200 motion-reduce:transition-none',
        selected
          ? 'border-white/20 bg-white/12 text-label'
          : 'border-transparent bg-white/4 text-label-secondary hover:bg-white/8 hover:text-label',
        className,
      )}
      {...props}
    />
  );
}
