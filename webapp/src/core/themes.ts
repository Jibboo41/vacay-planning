import type { LucideIcon } from 'lucide-react';
import { Layout, Sunrise, Moon, TreePine, Sparkles, Flower2, Waves, Flame, Flower, Zap, Plus } from 'lucide-react';

/** Ambient themes. Colors live in `src/styles/themes.css` under `[data-theme="<key>"]`. */
export const THEMES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'default', label: 'Default', icon: Layout },
  { key: 'sunset', label: 'Sunset', icon: Sunrise },
  { key: 'midnight', label: 'Midnight', icon: Moon },
  { key: 'forest', label: 'Forest', icon: TreePine },
  { key: 'aurora', label: 'Aurora', icon: Sparkles },
  { key: 'desert', label: 'Desert Rose', icon: Flower2 },
  { key: 'ocean', label: 'Deep Ocean', icon: Waves },
  { key: 'vulcan', label: 'Vulcan', icon: Flame },
  { key: 'sakura', label: 'Sakura', icon: Flower },
  { key: 'cyberpunk', label: 'Cyberpunk', icon: Zap },
  { key: 'slate', label: 'Slate', icon: Plus },
  { key: 'black', label: 'Black', icon: Moon },
];
