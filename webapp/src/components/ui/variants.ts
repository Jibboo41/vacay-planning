import { cva } from 'class-variance-authority';

/* Shared cva variant definitions for ui components (kept out of .tsx files for React Fast Refresh). */

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-bold select-none whitespace-nowrap transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-ios active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-sys-blue text-white shadow-glow-blue hover:bg-sys-blue/85',
        glass: 'border border-sys-blue/45 bg-sys-blue/18 text-white shadow-glow-blue backdrop-blur-md hover:border-sys-blue/65 hover:bg-sys-blue/28',
        secondary: 'border border-white/10 bg-white/6 text-label backdrop-blur-md hover:bg-white/12',
        danger: 'border border-sys-red/25 bg-sys-red/10 text-sys-red hover:bg-sys-red/20',
        ghost: 'bg-transparent text-label-secondary hover:bg-white/8 hover:text-label',
      },
      size: {
        sm: 'min-h-9 rounded-chip px-3 text-footnote',
        md: 'min-h-11 rounded-control px-4 text-[14px]',
        lg: 'min-h-13 rounded-2xl px-6 text-body',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  },
);

export const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center transition-[background-color,border-color,transform,color] duration-200 active:scale-[0.92] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        glass: 'border border-white/10 bg-white/5 text-label backdrop-blur-sm hover:bg-white/12',
        ghost: 'text-label-secondary hover:bg-white/8 hover:text-label',
        danger: 'border border-sys-red/20 bg-sys-red/10 text-sys-red hover:bg-sys-red/20',
        primary: 'border border-sys-blue/45 bg-sys-blue/20 text-white hover:bg-sys-blue/30',
      },
      size: {
        sm: 'size-9 rounded-chip',
        md: 'size-11 rounded-control',
        lg: 'size-13 rounded-2xl',
      },
      round: { true: 'rounded-full' },
    },
    defaultVariants: { variant: 'glass', size: 'md' },
  },
);

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-chip font-extrabold tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'bg-white/6 text-label-secondary',
        blue: 'bg-sys-blue/15 text-sys-blue',
        green: 'bg-sys-green/15 text-sys-green',
        orange: 'bg-sys-orange/15 text-sys-orange',
        red: 'bg-sys-red/15 text-sys-red',
        purple: 'bg-sys-purple/15 text-sys-purple',
        /** Colors supplied via className (e.g. item-type classes from itemTypes.ts). */
        custom: '',
      },
      size: {
        sm: 'px-2 py-0.5 text-caption',
        md: 'px-2.5 py-1 text-caption',
      },
      bordered: { true: 'border border-white/8' },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
);

export const cardVariants = cva('relative', {
  variants: {
    variant: {
      /** Frosted glass panel used across screens. */
      glass: 'glass-card rounded-panel',
      /** Timeline travel card (heavier blur + inset highlight). */
      travel: 'travel-card',
      /** Subtle inset surface for grouping inside other cards. */
      inset: 'rounded-control border border-white/6 bg-white/4',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: { variant: 'glass', padding: 'md' },
});
