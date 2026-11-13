import { useTripStore } from '../store/useTripStore';
import { ArrowLeft, Terminal, Trash2, Clock, Info } from 'lucide-react';

export default function DebugScreen({ onBack }: { onBack: () => void }) {
  const { debugLogs, clearDebugLogs } = useTripStore();

  return (
    <div className="screen safe-area-inset">
      <div className="screen-header">
        <button className="header-icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">System Logs</h1>
          <p className="page-subtitle">API & Background Sync Trace</p>
        </div>
        <button
          className="header-icon-btn"
          onClick={clearDebugLogs}
          style={{ opacity: debugLogs.length > 0 ? 1 : 0.5, pointerEvents: debugLogs.length > 0 ? 'auto' : 'none' }}
          title="Clear Logs"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="screen-body">
        {debugLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Terminal size={26} /></div>
            <p className="empty-state__text">No system logs recorded yet.</p>
          </div>
        ) : (
          <div className="list-stack">
            {debugLogs.map((log, idx) => (
              <div
                key={idx}
                className="card debug-log"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 900, 
                    color: log.category === 'Weather' ? 'var(--sys-sky)' : (log.category === 'Directions' ? 'var(--sys-purple)' : 'var(--sys-green)'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {log.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sys-label-secondary)', fontSize: '11px' }}>
                    <Clock size={10} />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--sys-label-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                  {log.message}
                </p>
                {log.data && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--sys-label-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Raw Data Detail</div>
                    <pre style={{ 
                      margin: 0, 
                      fontSize: '11px', 
                      color: 'var(--sys-green)',
                      background: 'var(--surface-inset)',
                      padding: '12px',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      border: '1px solid rgba(var(--neutral-rgb), 0.05)',
                      lineHeight: 1.5
                    }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="debug-footnote">
        <Info size={12} /> These logs are stored in-memory and cleared on refresh.
      </p>
    </div>
  );
}
