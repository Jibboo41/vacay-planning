import type { HTMLAttributes, Ref } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cardVariants } from './variants';
import { cn } from '../../lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants> & { ref?: Ref<HTMLDivElement> };

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}
