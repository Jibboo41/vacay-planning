import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TODO_CATEGORY,
  getTodoCategoryIcon,
  groupTodosByCategory,
  listTodoCategories,
  moveTodo,
  normalizeTodoCategory,
  todoCategoryOf,
} from './todoCategories';

const todo = (id: string, category?: string) => ({ id, category });

describe('normalizeTodoCategory', () => {
  it('treats blank and "General" as unset', () => {
    expect(normalizeTodoCategory(undefined)).toBeUndefined();
    expect(normalizeTodoCategory(null)).toBeUndefined();
    expect(normalizeTodoCategory('   ')).toBeUndefined();
    expect(normalizeTodoCategory('general')).toBeUndefined();
  });

  it('trims, collapses whitespace and caps the length', () => {
    expect(normalizeTodoCategory('  Hiking   prep ')).toBe('Hiking prep');
    expect(normalizeTodoCategory('x'.repeat(50))).toHaveLength(32);
  });

  it('reuses preset and known casing', () => {
    expect(normalizeTodoCategory('bookings')).toBe('Bookings');
    expect(normalizeTodoCategory('HIKING PREP', ['Hiking prep'])).toBe('Hiking prep');
    expect(normalizeTodoCategory('Brand new')).toBe('Brand new');
  });
});

describe('todoCategoryOf / icons', () => {
  it('falls back to General', () => {
    expect(todoCategoryOf({})).toBe(DEFAULT_TODO_CATEGORY);
    expect(todoCategoryOf({ category: 'documents' })).toBe('Documents');
  });

  it('uses a generic tag icon for custom categories', () => {
    expect(getTodoCategoryIcon('Custom')).not.toBe(getTodoCategoryIcon('Bookings'));
    expect(getTodoCategoryIcon('Custom')).toBe(getTodoCategoryIcon('Another'));
  });
});

describe('listTodoCategories', () => {
  it('lists General, presets, then custom categories alphabetically without duplicates', () => {
    const list = listTodoCategories([todo('1', 'zebra'), todo('2', 'Apple'), todo('3', 'bookings'), todo('4', 'ZEBRA')]);
    expect(list).toEqual(['General', 'Bookings', 'Documents', 'Money', 'Home', 'Shopping', 'Apple', 'zebra']);
  });
});

describe('groupTodosByCategory', () => {
  it('groups case-insensitively in display order and keeps item order', () => {
    const groups = groupTodosByCategory([
      todo('a', 'Snacks'), todo('b'), todo('c', 'Money'), todo('d', 'snacks'), todo('e', 'Bookings'), todo('f'),
    ]);
    expect(groups.map((g) => [g.category, g.todos.map((t) => t.id)])).toEqual([
      ['General', ['b', 'f']],
      ['Bookings', ['e']],
      ['Money', ['c']],
      ['Snacks', ['a', 'd']],
    ]);
  });
});

describe('moveTodo', () => {
  const list = [todo('g1'), todo('b1', 'Bookings'), todo('g2'), todo('b2', 'Bookings')];
  // Display order: g1, g2 (General) | b1, b2 (Bookings)

  it('reorders within a category and stores display order', () => {
    expect(moveTodo(list, 'g2', 'g1')?.map((t) => t.id)).toEqual(['g2', 'g1', 'b1', 'b2']);
  });

  it('moves into the category of the drop target', () => {
    const moved = moveTodo(list, 'g1', 'b1')!;
    expect(moved.map((t) => t.id)).toEqual(['g2', 'b1', 'g1', 'b2']);
    expect(moved.find((t) => t.id === 'g1')?.category).toBe('Bookings');
    expect(groupTodosByCategory(moved).map((g) => g.todos.map((t) => t.id))).toEqual([['g2'], ['b1', 'g1', 'b2']]);
  });

  it('moves back into General by clearing the category', () => {
    const moved = moveTodo(list, 'b2', 'g1')!;
    expect(moved.find((t) => t.id === 'b2')?.category).toBeUndefined();
    expect(groupTodosByCategory(moved)[0].todos.map((t) => t.id)).toEqual(['b2', 'g1', 'g2']);
  });

  it('returns null for no-op moves', () => {
    expect(moveTodo(list, 'g1', 'g1')).toBeNull();
    expect(moveTodo(list, 'missing', 'g1')).toBeNull();
  });
});
