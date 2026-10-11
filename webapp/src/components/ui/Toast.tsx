import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useToastStore, type Toast } from '../../store/useToastStore';

const toneIcon = {
  default: null,
  info: <Info size={18} className="shrink-0 text-sys-blue" aria-hidden="true" />,
  success: <CheckCircle2 size={18} className="shrink-0 text-sys-green" aria-hidden="true" />,
  error: <AlertTriangle size={18} className="shrink-0 text-sys-red" aria-hidden="true" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!toast.duration) return;
    const t = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-glass-strong px-4 py-3 shadow-elevated backdrop-blur-xl animate-slide-up motion-reduce:animate-none',
        toast.tone === 'error' ? 'border-sys-red/40' : 'border-white/12',
      )}
    >
      {toneIcon[toast.tone]}
      <div className="min-w-0 flex-1">
        <p className="text-footnote font-bold text-label">{toast.message}</p>
        {toast.description && <p className="mt-0.5 text-caption text-label-secondary">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="min-h-9 shrink-0 rounded-chip px-3 text-footnote font-extrabold text-sys-blue hover:bg-sys-blue/15"
          onClick={() => {
            toast.action!.onClick();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-label-tertiary hover:bg-white/10 hover:text-label"
        onClick={() => dismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Renders the toast stack. Mount once near the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom)+var(--bottom-nav-offset))] z-[12000] mx-auto flex w-full max-w-md flex-col gap-2 px-4 min-[1000px]:bottom-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
