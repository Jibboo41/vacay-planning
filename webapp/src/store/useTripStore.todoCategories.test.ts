import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateDoc = vi.fn<(ref: unknown, data: Record<string, unknown>) => Promise<void>>(() => Promise.resolve());

vi.mock('../core/firebase', () => ({ db: {}, auth: { currentUser: null } }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db: unknown, _col: string, id: string) => ({ id })),
  updateDoc: (ref: unknown, data: Record<string, unknown>) => updateDoc(ref, data),
}));
vi.mock('../data/weatherApi', () => ({ fetchWeather: vi.fn() }));

const { useTripStore } = await import('./useTripStore');
const { useUiStore } = await import('./useUiStore');
const { resetTimelineFilters, toggleFilterGroup, filterTypesForGroup, ALL_FILTER_TYPES } = await import('./timelineFilters');

type StoredTodos = { todos: Record<string, unknown>[] };
const lastWrite = () => updateDoc.mock.calls.at(-1)![1] as StoredTodos;

describe('todo categories in the store', () => {
  beforeEach(() => {
    updateDoc.mockClear();
    useTripStore.setState({
      currentTripId: 'trip', initialized: true, trips: [], pendingDeletes: [],
      todos: [{ id: 'c1', text: 'Custom', completed: false, createdAt: 1, category: 'Hiking prep' }],
    });
  });

  it('stores a normalized category and omits "General"', async () => {
    await useTripStore.getState().addTodo('Book hotel', undefined, undefined, '  bookings ');
    await useTripStore.getState().addTodo('Misc', undefined, undefined, 'General');
    await useTripStore.getState().addTodo('Snacks', undefined, undefined, 'HIKING PREP');
    const stored = lastWrite().todos;
    expect(stored.map((t) => t.category)).toEqual(['Hiking prep', 'Bookings', undefined, 'Hiking prep']);
    expect('category' in stored[2]).toBe(false);
  });

  it('updates, clears and preserves categories', async () => {
    const { updateTodo } = useTripStore.getState();
    await updateTodo('c1', { text: 'Renamed' });
    expect(useTripStore.getState().todos[0].category).toBe('Hiking prep');
    await updateTodo('c1', { category: 'Money' });
    expect(useTripStore.getState().todos[0].category).toBe('Money');
    await updateTodo('c1', { category: 'General' });
    expect(useTripStore.getState().todos[0].category).toBeUndefined();
    expect('category' in lastWrite().todos[0]).toBe(false);
  });
});

describe('timeline filters', () => {
  beforeEach(() => {
    useTripStore.setState({ currentTripId: 'trip', activeFilters: [...ALL_FILTER_TYPES] });
    useUiStore.setState({ timelineQuery: '' });
  });

  it('toggles every type in a group and resets everything', () => {
    toggleFilterGroup('transit');
    const transit = filterTypesForGroup('transit');
    expect(transit.length).toBeGreaterThan(1);
    expect(useTripStore.getState().activeFilters.some((t) => (transit as string[]).includes(t))).toBe(false);
    toggleFilterGroup('transit');
    expect(transit.every((t) => useTripStore.getState().activeFilters.includes(t))).toBe(true);

    toggleFilterGroup('food');
    useUiStore.getState().setTimelineQuery('hotel');
    resetTimelineFilters();
    expect(useUiStore.getState().timelineQuery).toBe('');
    expect([...useTripStore.getState().activeFilters].sort()).toEqual([...ALL_FILTER_TYPES].sort());
  });

  it('clears the search query when the trip changes', () => {
    useUiStore.getState().setTimelineQuery('hike');
    useTripStore.setState({ currentTripId: 'other-trip' });
    expect(useUiStore.getState().timelineQuery).toBe('');
  });
});
