import { useRef, useState, useCallback } from 'react';
import type { ItineraryItem } from '../../core/models';
import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../../store/useTripStore';

// ── Linkify helper ────────────────────────────────────────────────────────────
// Splits text on URLs and renders http/https links as tappable <a> elements.
// Newlines are preserved as <br>.
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                color: 'var(--sys-blue)',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              {part}
            </a>
          );
        }
        // Preserve newlines as <br>
        return part.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ));
      })}
    </>
  );
}

interface DetailsModalProps {
  item: ItineraryItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

/** Distance (px) the user must drag down to trigger dismiss */
const DISMISS_THRESHOLD = 100;

export default function DetailsModal({ item, onClose, onEdit, onDelete }: DetailsModalProps) {
  const navigate = useNavigate();
  const setFocusedLocation = useTripStore(s => s.setFocusedLocation);

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Shared drag handlers ──────────────────────────────────────
  const onDragStart = useCallback((clientY: number) => {
    startYRef.current = clientY;
    setIsDragging(true);
  }, []);

  const onDragMove = useCallback(
    (clientY: number) => {
      if (startYRef.current === null) return;
      const delta = clientY - startYRef.current;
      if (delta > 0) setDragY(delta); // only allow downward drag
    },
    []
  );

  const onDragEnd = useCallback(() => {
    if (dragY >= DISMISS_THRESHOLD) {
      onClose();
    } else {
      // Spring back
      setDragY(0);
    }
    startYRef.current = null;
    setIsDragging(false);
  }, [dragY, onClose]);

  // ── Touch events ──────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => onDragStart(e.touches[0].clientY);
  const handleTouchMove  = (e: React.TouchEvent) => onDragMove(e.touches[0].clientY);
  const handleTouchEnd   = () => onDragEnd();

  // ── Mouse events (desktop fallback) ───────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(e.clientY);
    const onMove = (ev: MouseEvent) => onDragMove(ev.clientY);
    const onUp   = () => {
      onDragEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!item) return null;

  const startDateObj = new Date(item.startDate);
  const dateStr = startDateObj.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });

  let endDateStr = null;
  if (item.endDate) {
    const endDateObj = new Date(item.endDate);
    const isSameDay = startDateObj.toDateString() === endDateObj.toDateString();
    
    if (isSameDay) {
      endDateStr = endDateObj.toLocaleString([], { timeStyle: 'short' });
    } else {
      endDateStr = endDateObj.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
    }
  }

  // While dragging use instant transform; when releasing animate back
  const sheetStyle: React.CSSProperties = {
    transform:  `translateY(${dragY}px)`,
    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    opacity:    dragY > 0 ? Math.max(0, 1 - dragY / 260) : 1,
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      // Prevent the backdrop click from firing while dragging
      onMouseDown={e => e.stopPropagation()}
    >
      <div
        ref={sheetRef}
        className="modal-sheet"
        style={sheetStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drag handle zone ── */}
        <div
          style={{ cursor: 'grab', paddingBottom: '4px', marginBottom: '4px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="modal-pull-indicator" />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            {item.title}
          </h2>
          {item.type === 'hotel' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#30D158', background: 'rgba(48, 209, 88, 0.1)', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.05em' }}>
                  CHECK-IN
                </div>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--sys-label-secondary)' }}>{dateStr}</span>
              </div>
              {endDateStr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF3B30', background: 'rgba(255, 59, 48, 0.1)', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.05em' }}>
                    CHECK-OUT
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--sys-label-secondary)' }}>{endDateStr}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--sys-label-secondary)', marginBottom: '24px' }}>
              {dateStr} {endDateStr && <> <span style={{ opacity: 0.5, margin: '0 4px' }}>➔</span> {endDateStr}</>}
            </p>
          )}

          <div 
            style={{ 
              display: 'flex', alignItems: 'center', marginBottom: '16px', padding: '16px', backgroundColor: 'var(--sys-bg-elevated-2)', borderRadius: '16px',
              cursor: (typeof item.location.latitude === 'number') ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number') {
                setFocusedLocation({ lat: item.location.latitude, lng: item.location.longitude });
                onClose();
                navigate('/map');
              }
            }}
            onMouseEnter={e => {
               if (typeof item.location.latitude === 'number') e.currentTarget.style.backgroundColor = 'var(--sys-bg-elevated-3)';
            }}
            onMouseLeave={e => {
               e.currentTarget.style.backgroundColor = 'var(--sys-bg-elevated-2)';
            }}
          >
            <MapPin size={22} color="var(--sys-blue)" style={{ flexShrink: 0 }} />
            <div style={{ marginLeft: '12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {item.location.name && item.location.name !== item.location.address && (
                <span style={{ fontSize: '16px', color: '#FFF', fontWeight: 700, marginBottom: '2px', wordBreak: 'break-word' }}>
                  {item.location.name}
                </span>
              )}
              <span style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', fontWeight: 500, lineHeight: '20px', wordBreak: 'break-word' }}>
                {item.location.address || item.location.name}
              </span>
            </div>
          </div>

          {item.confirmationNumber && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderLeft: '4px solid var(--sys-blue)', backgroundColor: 'rgba(10, 132, 255, 0.1)', padding: '16px', marginBottom: '16px', borderRadius: '0 16px 16px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-blue)', letterSpacing: '1.2px', marginBottom: '6px' }}>
                CONFIRMATION #
              </span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', letterSpacing: '2px' }}>
                {item.confirmationNumber}
              </span>
            </div>
          )}

          {item.description && (
            <div style={{ paddingTop: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sys-label-tertiary)', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
                NOTES
              </span>
              <p style={{ fontSize: '16px', color: '#FFF', lineHeight: '24px', opacity: 0.9 }}>
                <Linkified text={item.description} />
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
            <button
              onClick={onEdit}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(10, 132, 255, 0.1)' }}
            >
              <Edit2 size={18} color="var(--sys-blue)" />
              <span style={{ fontWeight: 700, fontSize: '15px', marginLeft: '8px', color: 'var(--sys-blue)' }}>Edit Details</span>
            </button>

            <button
              onClick={() => onDelete(item.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 69, 58, 0.1)' }}
            >
              <Trash2 size={18} color="var(--sys-red)" />
              <span style={{ fontWeight: 700, fontSize: '15px', marginLeft: '8px', color: 'var(--sys-red)' }}>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
