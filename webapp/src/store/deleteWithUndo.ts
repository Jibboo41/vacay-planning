import { useTripStore } from './useTripStore';
import { toast } from './useToastStore';
import { UNDO_DELETE_DELAY_MS, type UndoCollection } from './undoDelete';

/**
 * Optimistically delete an entity from the current trip and show an Undo toast.
 * The deletion is committed to Firestore after ~5s unless Undo is pressed.
 */
export function deleteWithUndo(collection: UndoCollection, id: string, label: string) {
  const key = useTripStore.getState().softDelete(collection, id, label);
  if (!key) return;
  const toastId = `undo-${key}`;
  toast(`Deleted ${label}`, {
    id: toastId,
    duration: UNDO_DELETE_DELAY_MS,
    action: {
      label: 'Undo',
      onClick: () => {
        void useTripStore.getState().undoDelete(key);
        toast.dismiss(toastId);
      },
    },
  });
}
