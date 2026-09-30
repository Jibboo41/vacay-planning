import {
  BookOpen, Calendar, CheckSquare, CloudSun, Compass, DollarSign, Luggage, StickyNote,
  type LucideIcon,
} from 'lucide-react';

export type AppRouteKey = 'timeline' | 'map' | 'summary' | 'todo' | 'costs' | 'weather' | 'notes' | 'packing';

export interface AppRoute {
  key: AppRouteKey;
  path: `/${string}`;
  label: string;
  /** Longer accessible description (tab bar / palette). */
  description: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar. */
  primary: boolean;
  /** Extra search terms for the command palette. */
  keywords: string[];
}

/**
 * Single source of truth for the trip screens. Consumed by the router (App),
 * the mobile tab bar, the desktop side rail, the view-switcher FAB, the
 * sidebar and the command palette.
 */
export const APP_ROUTES: readonly AppRoute[] = [
  { key: 'timeline', path: '/timeline', label: 'Timeline', description: 'Itinerary timeline', icon: Calendar, primary: true, keywords: ['itinerary', 'schedule', 'days'] },
  { key: 'map', path: '/map', label: 'Map', description: 'Destinations map', icon: Compass, primary: true, keywords: ['places', 'locations'] },
  { key: 'summary', path: '/summary', label: 'Summary', description: 'Trip summary outline', icon: BookOpen, primary: true, keywords: ['overview', 'outline'] },
  { key: 'todo', path: '/todo', label: 'Todo', description: 'Trip to-do list', icon: CheckSquare, primary: true, keywords: ['tasks', 'checklist'] },
  { key: 'costs', path: '/costs', label: 'Costs', description: 'Cost tracker', icon: DollarSign, primary: true, keywords: ['budget', 'expenses', 'money'] },
  { key: 'weather', path: '/weather', label: 'Weather', description: 'Weather forecast', icon: CloudSun, primary: false, keywords: ['forecast', 'temperature'] },
  { key: 'notes', path: '/notes', label: 'Notes', description: 'Trip notes', icon: StickyNote, primary: false, keywords: ['memo'] },
  { key: 'packing', path: '/packing', label: 'Packing', description: 'Packing list', icon: Luggage, primary: false, keywords: ['luggage', 'bags'] },
] as const;

export const DEFAULT_ROUTE = '/timeline';

export function findRoute(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find((r) => pathname === r.path || pathname.startsWith(`${r.path}/`));
}

/** `/debug` is only reachable in dev builds or when `localStorage['vacay:debug'] === '1'`. */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem('vacay:debug') === '1';
  } catch {
    return false;
  }
}
