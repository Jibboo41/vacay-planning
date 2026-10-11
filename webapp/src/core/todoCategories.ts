import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, FileText, Home, ListTodo, ShoppingBag, Tag, Wallet } from 'lucide-react';
import type { TodoItem } from './models';

export const DEFAULT_TODO_CATEGORY = 'General';
export const MAX_TODO_CATEGORY_LENGTH = 32;

export const TODO_CATEGORY_PRESETS: readonly { name: string; icon: LucideIcon }[] = [
  { name: 'Bookings', icon: CalendarCheck },
  { name: 'Documents', icon: FileText },
  { name: 'Money', icon: Wallet },
  { name: 'Home', icon: Home },
  { name: 'Shopping', icon: ShoppingBag },
];

const PRESET_NAMES = TODO_CATEGORY_PRESETS.map(preset => preset.name);

const sameName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

export function normalizeTodoCategory(
  raw: string | null | undefined,
  known: readonly string[] = [],
): string | undefined {
  const cleaned = (raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TODO_CATEGORY_LENGTH)
    .trim();

  if (!cleaned || sameName(cleaned, DEFAULT_TODO_CATEGORY)) return undefined;
  return [...PRESET_NAMES, ...known].find(name => sameName(name, cleaned)) ?? cleaned;
}

export function todoCategoryOf(todo: Pick<TodoItem, 'category'>): string {
  return normalizeTodoCategory(todo.category) ?? DEFAULT_TODO_CATEGORY;
}

export function getTodoCategoryIcon(category: string): LucideIcon {
  if (sameName(category, DEFAULT_TODO_CATEGORY)) return ListTodo;
  return TODO_CATEGORY_PRESETS.find(preset => sameName(preset.name, category))?.icon ?? Tag;
}

function categoryRank(category: string): number {
  if (sameName(category, DEFAULT_TODO_CATEGORY)) return 0;
  const presetIndex = PRESET_NAMES.findIndex(name => sameName(name, category));
  return presetIndex === -1 ? PRESET_NAMES.length + 1 : presetIndex + 1;
}

function compareCategories(a: string, b: string): number {
  return categoryRank(a) - categoryRank(b)
    || a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export function listTodoCategories(todos: readonly Pick<TodoItem, 'category'>[]): string[] {
  const names = [DEFAULT_TODO_CATEGORY, ...PRESET_NAMES];

  for (const todo of todos) {
    const category = todoCategoryOf(todo);
    if (!names.some(name => sameName(name, category))) names.push(category);
  }

  return names.sort(compareCategories);
}

export interface TodoCategoryGroup<T> {
  category: string;
  todos: T[];
}

export function groupTodosByCategory<T extends Pick<TodoItem, 'category'>>(
  todos: readonly T[],
): TodoCategoryGroup<T>[] {
  const groups: TodoCategoryGroup<T>[] = [];

  for (const todo of todos) {
    const category = todoCategoryOf(todo);
    const existingGroup = groups.find(group => sameName(group.category, category));

    if (existingGroup) existingGroup.todos.push(todo);
    else groups.push({ category, todos: [todo] });
  }

  return groups.sort((a, b) => compareCategories(a.category, b.category));
}

export function moveTodo(
  todos: readonly TodoItem[],
  activeId: string,
  overId: string,
): TodoItem[] | null {
  if (activeId === overId) return null;

  const ordered = groupTodosByCategory(todos).flatMap(group => group.todos);
  const fromIndex = ordered.findIndex(todo => todo.id === activeId);
  const toIndex = ordered.findIndex(todo => todo.id === overId);

  if (fromIndex === -1 || toIndex === -1) return null;

  const target = ordered[toIndex];
  const [moved] = ordered.splice(fromIndex, 1);
  const movedCategory = todoCategoryOf(moved);
  const targetCategory = todoCategoryOf(target);
  const recategorized = sameName(movedCategory, targetCategory)
    ? moved
    : { ...moved, category: target.category };

  ordered.splice(toIndex, 0, recategorized);
  return ordered;
}
