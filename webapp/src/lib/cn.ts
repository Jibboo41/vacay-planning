import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge needs to know about our custom `text-*` font-size tokens,
 * otherwise `text-caption` (a size) and `text-label` (a color) would be
 * treated as conflicting and one would be dropped.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'footnote', 'body', 'headline', 'title', 'large-title'],
      radius: ['chip', 'control', 'card', 'panel', 'sheet'],
      shadow: ['glass', 'elevated', 'fab', 'glow-blue'],
      blur: ['glass', 'sheet'],
    },
  },
});

/** Compose conditional class names and resolve Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
