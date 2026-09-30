/**
 * Undo-able ("soft") deletes.
 *
 * A delete is applied optimistically to local state and held for a short
 * window. If the user presses Undo the entity is restored; otherwise the
 * deletion is committed (persisted) when the timer fires.
 *
 * This module is framework-agnostic so it can be unit-tested with fake timers.
 */

export type UndoCollection = 'items' | 'expenses' | 'todos' | 'packingItems' | 'generalNotes';

export interface PendingDelete<T = unknown> {
  /** Unique key for this pending delete (not the entity id). */
  key: string;
  collection: UndoCollection;
  id: string;
  entity: T;
  /** Original index of the entity so Undo restores ordering. */
  index: number;
  tripId: string;
  label: string;
}

export const UNDO_DELETE_DELAY_MS = 5000;

export function removeById<T extends { id: string }>(list: T[], id: string): { list: T[]; entity?: T; index: number } {
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return { list, index: -1 };
  return { list: [...list.slice(0, index), ...list.slice(index + 1)], entity: list[index], index };
}

/** Re-insert `entity` at `index` (clamped). No-op if an entity with the same id is already present. */
export function restoreAt<T extends { id: string }>(list: T[], entity: T, index: number): T[] {
  if (list.some((e) => e.id === entity.id)) return list;
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), entity, ...list.slice(at)];
}

/** Hide entities that are pending deletion (used when fresh server snapshots arrive). */
export function excludePending<T extends { id: string }>(
  list: T[],
  pending: readonly PendingDelete[],
  collection: UndoCollection,
  tripId: string | null,
): T[] {
  const ids = new Set(pending.filter((p) => p.collection === collection && p.tripId === tripId).map((p) => p.id));
  return ids.size ? list.filter((e) => !ids.has(e.id)) : list;
}

export interface UndoQueueOptions {
  delayMs?: number;
  onCommit: (pending: PendingDelete) => void | Promise<void>;
}

export interface UndoQueue {
  schedule: (pending: PendingDelete) => void;
  /** Cancel a pending delete. Returns it so the caller can restore the entity. */
  undo: (key: string) => PendingDelete | undefined;
  /** Commit one pending delete immediately. */
  commit: (key: string) => Promise<void>;
  /** Commit every pending delete immediately (e.g. on trip switch / page hide). */
  flush: () => Promise<void>;
  has: (key: string) => boolean;
  size: () => number;
}

export function createUndoQueue({ delayMs = UNDO_DELETE_DELAY_MS, onCommit }: UndoQueueOptions): UndoQueue {
  const pending = new Map<string, PendingDelete>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const clear = (key: string) => {
    const t = timers.get(key);
    if (t !== undefined) clearTimeout(t);
    timers.delete(key);
  };

  const commit = async (key: string) => {
    const p = pending.get(key);
    clear(key);
    if (!p) return;
    pending.delete(key);
    await onCommit(p);
  };

  return {
    schedule(p) {
      clear(p.key);
      pending.set(p.key, p);
      timers.set(p.key, setTimeout(() => { void commit(p.key); }, delayMs));
    },
    undo(key) {
      const p = pending.get(key);
      clear(key);
      pending.delete(key);
      return p;
    },
    commit,
    async flush() {
      await Promise.all([...pending.keys()].map(commit));
    },
    has: (key) => pending.has(key),
    size: () => pending.size,
  };
}
