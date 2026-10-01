import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, FileText, Home, ListTodo, ShoppingBag, Tag, Wallet } from 'lucide-react';
import type { TodoItem } from './models';

/**
 * To-do categories are free-form strings stored on `TodoItem.category`.
 * A missing category means "General", so lists created before categories
 * existed keep working unchanged. Presets are always offered in the picker;
 * custom categories are derived from the trip's existing to-dos.
 */

export const DEFAULT_TODO_CATEGORY = 'General';
export const MAX_TODO_CATEGORY_LENGTH = 32;

export const TODO_CATEGORY_PRESETS: readonly { name: string; icon: LucideIcon }[] = [
  { name: 'Bookings', icon: CalendarCheck },
  { name: 'Documents', icon: FileText },
  { name: 'Money', icon: Wallet },
  { name: 'Home', icon: Home },
  { name: 'Shopping', icon: ShoppingBag },
];

const PRESET_NAMES = TODO_CATEGORY_PRESETS.map((p) => p.name);

const sameName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/**
 * Canonical stored value for a category: whitespace-collapsed and trimmed,
 * reusing the casing of a preset or `known` category that matches
 * case-insensitively. Blank or "General" returns `undefined` (not stored).
 */
export function normalizeTodoCategory(raw: string | null | undefined, known: readonly string[] = []): string | undefined {
  const cleaned = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TODO_CATEGORY_LENGTH).trim();
  if (!cleaned || sameName(cleaned, DEFAULT_TODO_CATEGORY)) return undefined;
  return [...PRESET_NAMES, ...known].find((name) => sameName(name, cleaned)) ?? cleaned;
}

/** Display category for a to-do ("General" when unset). */
export function todoCategoryOf(todo: Pick<TodoItem, 'category'>): string {
  return normalizeTodoCategory(todo.category) ?? DEFAULT_TODO_CATEGORY;
}

export function getTodoCategoryIcon(category: string): LucideIcon {
  if (sameName(category, DEFAULT_TODO_CATEGORY)) return ListTodo;
  return TODO_CATEGORY_PRESETS.find((p) => sameName(p.name, category))?.icon ?? Tag;
}

function categoryRank(category: string): number {
  if (sameName(category, DEFAULT_TODO_CATEGORY)) return 0;
  const preset = PRESET_NAMES.findIndex((name) => sameName(name, category));
  return preset === -1 ? PRESET_NAMES.length + 1 : preset + 1;
}

function compareCategories(a: string, b: string): number {
  return categoryRank(a) - categoryRank(b) || a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/** Picker options: General, the presets, then custom categories in use (alphabetical). */
export function listTodoCategories(todos: readonly Pick<TodoItem, 'category'>[]): string[] {
  const names = [DEFAULT_TODO_CATEGORY, ...PRESET_NAMES];
  for (const todo of todos) {
    const category = todoCategoryOf(todo);
    if (!names.some((name) => sameName(name, category))) names.push(category);
  }
  return names.sort(compareCategories);
}

export interface TodoCategoryGroup<T> {
  category: string;
  todos: T[];
}

/**
 * Non-empty groups in display order (General, presets, custom A–Z). Items
 * keep their stored order inside a group; names match case-insensitively.
 */
export function groupTodosByCategory<T extends Pick<TodoItem, 'category'>>(todos: readonly T[]): TodoCategoryGroup<T>[] {
  const groups: TodoCategoryGroup<T>[] = [];
  for (const todo of todos) {
    const category = todoCategoryOf(todo);
    const group = groups.find((g) => sameName(g.category, category));
    if (group) group.todos.push(todo);
    else groups.push({ category, todos: [todo] });
  }
  return groups.sort((a, b) => compareCategories(a.category, b.category));
}

/**
 * Drag-and-drop move in display order. Dropping onto a to-do in another
 * category moves the dragged to-do into that category. Returns the new list
 * (stored in display order) or `null` when nothing changes.
 */
export function moveTodo<T extends Pick<TodoItem, 'id' | 'category'>>(todos: readonly T[], activeId: string, overId: string): T[] | null {
  if (activeId === overId) return null;
  const ordered = groupTodosByCategory(todos).flatMap((g) => g.todos);
  const from = ordered.findIndex((t) => t.id === activeId);
  const to = ordered.findIndex((t) => t.id === overId);
  if (from === -1 || to === -1) return null;
  const over = ordered[to];
  const [moved] = ordered.splice(from, 1);
  const recategorize = !sameName(todoCategoryOf(moved), todoCategoryOf(over));
  ordered.splice(to, 0, recategorize ? { ...moved, category: over.category } : moved);
  return ordered;
}
