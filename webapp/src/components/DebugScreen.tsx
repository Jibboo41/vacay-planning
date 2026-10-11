import { useTripStore } from '../store/useTripStore';
import { ArrowLeft, Terminal, Trash2, Clock, Info } from 'lucide-react';

export default function DebugScreen({ onBack }: { onBack: () => void }) {
  const { debugLogs, clearDebugLogs } = useTripStore();

  return (
    <div className="safe-area-inset" style={{ minHeight: '100vh', background: '#000' }}>
      <div className="screen-header glass-effect" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="header-icon-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF', margin: 0 }}>System Logs</h1>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', margin: 0 }}>API & Background Sync Trace</p>
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

      <div style={{ padding: '20px' }}>
        {debugLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'rgba(255,255,255,0.2)' }}>
            <Terminal size={48} style={{ marginBottom: '16px' }} />
            <p>No system logs recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {debugLogs.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px', 
                  padding: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 900, 
                    color: log.category === 'Weather' ? '#0EA5E9' : (log.category === 'Directions' ? '#BF5AF2' : '#30D158'),
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
                <p style={{ margin: 0, fontSize: '13px', color: '#FFF', fontWeight: 500, lineHeight: 1.4 }}>
                  {log.message}
                </p>
                {log.data && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--sys-label-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Raw Data Detail</div>
                    <pre style={{ 
                      margin: 0, 
                      fontSize: '11px', 
                      color: '#30D158', 
                      background: 'rgba(0,0,0,0.6)',
                      padding: '12px',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      border: '1px solid rgba(255,255,255,0.05)',
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
      
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Info size={12} /> These logs are stored in-memory and cleared on refresh.
        </p>
      </div>
    </div>
  );
}
