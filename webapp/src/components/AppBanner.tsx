import { AlertTriangle, RotateCw, X } from 'lucide-react';
import { useUiStore } from '../store/useUiStore';
import { IconButton } from './ui';

/** Dismissible banner for recoverable auth / Firestore errors. */
export default function AppBanner() {
  const banner = useUiStore((s) => s.banner);
  const dismiss = useUiStore((s) => s.dismissBanner);
  if (!banner) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-[11000] mx-auto flex max-w-xl items-center gap-3 rounded-card border border-sys-red/40 bg-[#3a0d0d]/90 py-2 pr-2 pl-4 text-footnote text-white shadow-elevated backdrop-blur-xl animate-fade-in motion-reduce:animate-none"
    >
      <AlertTriangle size={18} aria-hidden="true" className="shrink-0 text-sys-red" />
      <p className="min-w-0 flex-1 break-words">{banner.message}</p>
      {banner.retry && (
        <button
          type="button"
          onClick={() => { const retry = banner.retry; dismiss(banner.id); retry?.(); }}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control bg-white/12 px-3 font-bold hover:bg-white/20"
        >
          <RotateCw size={14} aria-hidden="true" /> Retry
        </button>
      )}
      <IconButton aria-label="Dismiss" variant="ghost" onClick={() => dismiss(banner.id)}>
        <X size={18} />
      </IconButton>
    </div>
  );
}
