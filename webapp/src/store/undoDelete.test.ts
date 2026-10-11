import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUndoQueue, excludePending, removeById, restoreAt, type PendingDelete } from './undoDelete';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

function pending(overrides: Partial<PendingDelete> = {}): PendingDelete {
  return { key: 'k1', collection: 'todos', id: 'b', entity: { id: 'b' }, index: 1, tripId: 't1', label: 'b', ...overrides };
}

describe('list helpers', () => {
  it('removeById returns the removed entity and its index', () => {
    const r = removeById(list, 'b');
    expect(r.list.map((e) => e.id)).toEqual(['a', 'c']);
    expect(r.entity).toEqual({ id: 'b' });
    expect(r.index).toBe(1);
    expect(removeById(list, 'zzz')).toEqual({ list, index: -1 });
  });

  it('restoreAt reinserts at the original index (clamped) and is idempotent', () => {
    expect(restoreAt([{ id: 'a' }, { id: 'c' }], { id: 'b' }, 1).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(restoreAt([{ id: 'a' }], { id: 'b' }, 9).map((e) => e.id)).toEqual(['a', 'b']);
    expect(restoreAt(list, { id: 'b' }, 0)).toBe(list);
  });

  it('excludePending hides entities pending deletion for the same trip/collection only', () => {
    const p = [pending()];
    expect(excludePending(list, p, 'todos', 't1').map((e) => e.id)).toEqual(['a', 'c']);
    expect(excludePending(list, p, 'expenses', 't1')).toBe(list);
    expect(excludePending(list, p, 'todos', 'other')).toBe(list);
  });
});

describe('createUndoQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('commits after the delay', async () => {
    const onCommit = vi.fn();
    const q = createUndoQueue({ delayMs: 5000, onCommit });
    q.schedule(pending());
    await vi.advanceTimersByTimeAsync(4999);
    expect(onCommit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0].id).toBe('b');
    expect(q.size()).toBe(0);
  });

  it('undo cancels the commit and returns the pending entry', async () => {
    const onCommit = vi.fn();
    const q = createUndoQueue({ delayMs: 5000, onCommit });
    q.schedule(pending());
    const p = q.undo('k1');
    expect(p?.entity).toEqual({ id: 'b' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(onCommit).not.toHaveBeenCalled();
    expect(q.undo('k1')).toBeUndefined();
  });

  it('flush commits everything immediately, exactly once', async () => {
    const onCommit = vi.fn();
    const q = createUndoQueue({ delayMs: 5000, onCommit });
    q.schedule(pending({ key: 'k1' }));
    q.schedule(pending({ key: 'k2', id: 'c' }));
    await q.flush();
    expect(onCommit).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(onCommit).toHaveBeenCalledTimes(2);
  });
});
