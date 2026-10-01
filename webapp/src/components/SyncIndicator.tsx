import { AlertTriangle, Check, CloudOff, RotateCw } from 'lucide-react';
import { cn } from '../lib/cn';
import { useTripStore } from '../store/useTripStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getSyncState } from '../core/syncState';

/**
 * Persistent cloud-sync indicator: Saved ✓ / Saving… / Offline / Error + Retry.
 * Firestore's persistent local cache queues writes while offline, so the
 * offline state reassures the user that changes will sync later.
 */
export default function SyncIndicator({ className }: { className?: string }) {
  const saving = useTripStore((s) => s.saving);
  const error = useTripStore((s) => s.lastSaveError);
  const retrySave = useTripStore((s) => s.retrySave);
  const online = useOnlineStatus();
  const state = getSyncState({ online, saving, error });

  return (
    <div
      role="status"
      aria-live="polite"
      title={state === 'error' && error ? error : undefined}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-full border px-3 text-caption font-bold whitespace-nowrap backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none',
        state === 'saved' && 'border-white/8 bg-black/35 text-label-secondary',
        state === 'saving' && 'border-white/10 bg-black/55 text-label',
        state === 'offline' && 'border-sys-orange/40 bg-sys-orange/15 text-sys-orange',
        state === 'error' && 'border-sys-red/50 bg-sys-red/20 text-[#ff8a80]',
        className,
      )}
    >
      {state === 'saved' && (<><Check size={14} aria-hidden="true" className="text-sys-green" /><span>Saved</span></>)}
      {state === 'saving' && (
        <>
          <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
          <span>Saving…</span>
        </>
      )}
      {state === 'offline' && (<><CloudOff size={14} aria-hidden="true" /><span>Offline — changes will sync</span></>)}
      {state === 'error' && (
        <>
          <AlertTriangle size={14} aria-hidden="true" />
          <span>Sync error</span>
          <button
            type="button"
            onClick={() => void retrySave()}
            className="-my-1 -mr-2 ml-1 inline-flex min-h-8 items-center gap-1 rounded-full bg-white/10 px-2.5 text-label hover:bg-white/20"
          >
            <RotateCw size={12} aria-hidden="true" /> Retry
          </button>
        </>
      )}
    </div>
  );
}
