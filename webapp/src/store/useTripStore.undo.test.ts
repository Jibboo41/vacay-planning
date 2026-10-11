import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const todos = [
  { id: 't1', text: 'One', completed: false, createdAt: 1 },
  { id: 't2', text: 'Two', completed: false, createdAt: 2 },
];

describe('useTripStore undo-delete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateDoc.mockClear();
    useTripStore.setState({ currentTripId: 'trip', initialized: true, todos, pendingDeletes: [], trips: [] });
  });
  afterEach(() => vi.useRealTimers());

  it('removes optimistically and commits to Firestore after the undo window', async () => {
    const key = useTripStore.getState().softDelete('todos', 't1', 'One');
    expect(key).toBeTruthy();
    expect(useTripStore.getState().todos.map((t) => t.id)).toEqual(['t2']);
    expect(useTripStore.getState().pendingDeletes).toHaveLength(1);
    expect(updateDoc).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toEqual({ todos: [todos[1]] });
    expect(useTripStore.getState().pendingDeletes).toHaveLength(0);
  });

  it('undo restores the entity at its original position and never commits the delete', async () => {
    const key = useTripStore.getState().softDelete('todos', 't1', 'One')!;
    await useTripStore.getState().undoDelete(key);
    expect(useTripStore.getState().todos.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(useTripStore.getState().pendingDeletes).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(10_000);
    // Only the restore write happened.
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toEqual({ todos });
  });

  it('keeps pending deletes hidden when a server snapshot arrives', () => {
    useTripStore.getState().softDelete('todos', 't1', 'One');
    useTripStore.getState().syncTrips([
      { id: 'trip', title: 'Trip', userId: 'u', createdAt: 1, items: [], todos },
    ]);
    expect(useTripStore.getState().todos.map((t) => t.id)).toEqual(['t2']);
  });

  it('returns null for unknown ids', () => {
    expect(useTripStore.getState().softDelete('todos', 'nope', 'x')).toBeNull();
  });
});
