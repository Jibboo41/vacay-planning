import type { ButtonHTMLAttributes, Ref } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from './variants';
import { cn } from '../../lib/cn';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { ref?: Ref<HTMLButtonElement> };

export function Button({ className, variant, size, block, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
