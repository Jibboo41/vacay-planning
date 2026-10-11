import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { iconButtonVariants } from './variants';
import { cn } from '../../lib/cn';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> &
  VariantProps<typeof iconButtonVariants> & {
    /** Accessible name — required because the button has no visible text. */
    'aria-label': string;
    children: ReactNode;
    ref?: Ref<HTMLButtonElement>;
  };

/**
 * Icon-only button. `aria-label` is required by the type signature and is also
 * used as the tooltip. Size `sm` keeps a 44×44 hit area via an invisible
 * pseudo-element.
 */
export function IconButton({ className, variant, size, round, type = 'button', title, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      title={title ?? props['aria-label']}
      className={cn(
        iconButtonVariants({ variant, size, round }),
        size === 'sm' && 'relative before:absolute before:-inset-1 before:content-[""]',
        className,
      )}
      {...props}
    />
  );
}
