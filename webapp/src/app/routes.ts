import {
  BookOpen,
  Calendar,
  CheckSquare,
  CirclePlus,
  CloudSun,
  Compass,
  CreditCard,
  DollarSign,
  Luggage,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';

export type AppRouteKey =
  | 'timeline'
  | 'map'
  | 'summary'
  | 'todo'
  | 'costs'
  | 'weather'
  | 'notes'
  | 'packing'
  | 'cards';

export interface AppRoute {
  key: AppRouteKey;
  path: `/${string}`;
  label: string;
  description: string;
  icon: LucideIcon;
  primary: boolean;
}

export const APP_ROUTES: readonly AppRoute[] = [
  { key: 'timeline', path: '/timeline', label: 'Timeline', description: 'Itinerary timeline', icon: Calendar, primary: true },
  { key: 'map', path: '/map', label: 'Map', description: 'Destinations map', icon: Compass, primary: true },
  { key: 'summary', path: '/summary', label: 'Summary', description: 'Trip summary outline', icon: BookOpen, primary: false },
  { key: 'todo', path: '/todo', label: 'Todo', description: 'Trip to-do list', icon: CheckSquare, primary: true },
  { key: 'costs', path: '/costs', label: 'Costs', description: 'Cost tracker', icon: DollarSign, primary: true },
  { key: 'weather', path: '/weather', label: 'Weather', description: 'Weather forecast', icon: CloudSun, primary: false },
  { key: 'notes', path: '/notes', label: 'Notes', description: 'Trip notes', icon: StickyNote, primary: false },
  { key: 'packing', path: '/packing', label: 'Packing', description: 'Packing list', icon: Luggage, primary: false },
  { key: 'cards', path: '/cards', label: 'Cards', description: 'Credit card strategy', icon: CreditCard, primary: false },
] as const;

export function findRoute(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find(route =>
    pathname === route.path || pathname.startsWith(`${route.path}/`));
}

export interface NavAction {
  key: 'add';
  label: string;
  description: string;
  icon: LucideIcon;
}

export type NavEntry = AppRoute | NavAction;

export const ADD_TIMELINE_ACTION: NavAction = {
  key: 'add',
  label: 'Add',
  description: 'Add to timeline',
  icon: CirclePlus,
};

/** Places the "Add to timeline" action right after the Todo route. */
export function withTimelineAddAction(routes: readonly AppRoute[]): NavEntry[] {
  const todoIndex = routes.findIndex(route => route.key === 'todo');
  const insertAt = todoIndex === -1 ? routes.length : todoIndex + 1;
  return [...routes.slice(0, insertAt), ADD_TIMELINE_ACTION, ...routes.slice(insertAt)];
}

export function isAppRoute(entry: NavEntry): entry is AppRoute {
  return 'path' in entry;
}
