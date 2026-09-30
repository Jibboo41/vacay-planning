export type SyncState = 'offline' | 'error' | 'saving' | 'saved';

export function getSyncState({ online, saving, error }: { online: boolean; saving: boolean; error: string | null }): SyncState {
  if (!online) return 'offline';
  if (error) return 'error';
  if (saving) return 'saving';
  return 'saved';
}
