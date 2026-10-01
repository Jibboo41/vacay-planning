import { useTripStore } from '../store/useTripStore';
import { ArrowLeft, Terminal, Trash2, Clock, Info } from 'lucide-react';
import { cn } from '../lib/cn';

export default function DebugScreen({ onBack }: { onBack: () => void }) {
  const { debugLogs, clearDebugLogs } = useTripStore();
  const categoryClass = (category: string) => {
    if (category === 'Weather') return 'text-sky-500';
    if (category === 'Directions') return 'text-sys-purple';
    return 'text-sys-green';
  };

  return (
    <div className="safe-area-inset min-h-dvh bg-black">
      <div className="screen-header glass-effect border-b border-white/10">
        <button type="button" className="header-icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-1 flex-col">
          <h1 className="m-0 text-title font-extrabold text-label">System Logs</h1>
          <p className="m-0 text-footnote text-label-secondary">API & Background Sync Trace</p>
        </div>
        <button
          type="button"
          className="header-icon-btn" 
          onClick={clearDebugLogs}
          disabled={debugLogs.length === 0}
          title="Clear Logs"
          aria-label="Clear logs"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="p-5">
        {debugLogs.length === 0 ? (
          <div className="px-5 py-[100px] text-center text-white/20">
            <Terminal size={48} className="mb-4 inline-block" />
            <p>No system logs recorded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {debugLogs.map((log, idx) => (
              <div 
                key={idx} 
                className="rounded-control border border-white/8 bg-white/5 p-3.5 font-mono"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={cn('text-caption font-black uppercase tracking-[0.05em]', categoryClass(log.category))}>
                    {log.category}
                  </span>
                  <div className="flex items-center gap-1 text-caption text-label-secondary">
                    <Clock size={10} />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                <p className="m-0 text-footnote font-medium leading-[1.4] text-label">
                  {log.message}
                </p>
                {log.data !== undefined && (
                  <div className="mt-3">
                    <div className="mb-1 text-caption font-bold uppercase text-label-secondary">Raw Data Detail</div>
                    <pre className="m-0 overflow-x-auto rounded-chip border border-white/5 bg-black/60 p-3 text-caption leading-[1.5] text-sys-green">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-5 py-10 text-center">
        <p className="flex items-center justify-center gap-1.5 text-caption text-white/30">
          <Info size={12} /> These logs are stored in-memory and cleared on refresh.
        </p>
      </div>
    </div>
  );
}
