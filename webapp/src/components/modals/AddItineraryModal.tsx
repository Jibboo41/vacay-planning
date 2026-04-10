import { useState } from 'react';
import { X, Sparkles, Loader } from 'lucide-react';
import type { ItineraryItem } from '../../core/models';
import { parseItinerary } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';

interface AddItineraryModalProps {
  onClose: () => void;
  onAdd: (item: ItineraryItem) => void;
}

export default function AddItineraryModal({ onClose, onAdd }: AddItineraryModalProps) {
  const [emailText, setEmailText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTripId = useTripStore(s => s.currentTripId);
  const trips = useTripStore(s => s.trips);
  const tripTitle = trips.find(t => t.id === currentTripId)?.title || '';

  const handleParse = async () => {
    if (!emailText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      let items = await parseItinerary(emailText, tripTitle);
      
      // Year Sanitizer: If any items have missing/invalid years (usually defaults to 2001 or 1970 if yearless)
      // or if we just want to ensure consistency with the current trip.
      const currentItems = useTripStore.getState().items;
      let defaultYear = new Date().getFullYear();
      
      if (currentItems.length > 0) {
        const sorted = [...currentItems].sort((a,b) => a.startDate.localeCompare(b.startDate));
        defaultYear = new Date(sorted[0].startDate.replace(/-/g, '/')).getFullYear();
      }

      items = items.map(item => {
        // If the date string has a year in the 2000s, assume it's correct.
        // If not (e.g. 0001-07-10 or 2001-07-10 from some parsers), replace year with defaultYear.
        if (item.startDate) {
           const d = new Date(item.startDate.replace(/-/g, '/'));
           if (isNaN(d.getFullYear()) || d.getFullYear() < 2020) { // Safety threshold
              item.startDate = item.startDate.replace(/^\d{4}/, defaultYear.toString());
              if (item.endDate) {
                item.endDate = item.endDate.replace(/^\d{4}/, defaultYear.toString());
              }
           }
        }
        return item;
      });

      items.forEach(item => onAdd(item));
      onClose();
    } catch (err) {
      setError('Could not connect to backend. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-pull-indicator" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Add from Email</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#FFF" /></button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginBottom: '20px', flexShrink: 0 }}>
          Paste a booking confirmation or itinerary email and we'll extract all the details automatically.
        </p>

        <textarea
          placeholder="Paste email content here..."
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          style={{
            width: '100%', flex: 1, padding: '16px', borderRadius: '12px',
            background: 'var(--sys-bg-elevated-2)', border: '1px solid var(--sys-separator)',
            color: '#FFF', fontSize: '16px', resize: 'none', lineHeight: '1.5',
            minHeight: '180px', marginBottom: '16px', outline: 'none'
          }}
        />

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--sys-red)', marginBottom: '12px', flexShrink: 0 }}>{error}</p>
        )}

        <button
          onClick={handleParse}
          disabled={isLoading || !emailText.trim()}
          className={emailText.trim() ? "btn-glass-blue" : ""}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            fontSize: '16px', fontWeight: 700,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            opacity: isLoading ? 0.7 : (!emailText.trim() ? 0.5 : 1), marginBottom: '24px',
            flexShrink: 0,
            background: !emailText.trim() ? 'rgba(255, 255, 255, 0.05)' : undefined,
            border: !emailText.trim() ? '1px solid rgba(255, 255, 255, 0.08)' : undefined,
            color: !emailText.trim() ? 'var(--sys-label-secondary)' : '#fff',
            boxShadow: !emailText.trim() ? 'none' : undefined
          }}
        >
          {isLoading ? <Loader size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={20} style={{ marginRight: '8px' }} />}
          {isLoading ? 'Parsing...' : 'Parse with AI'}
        </button>
      </div>
    </div>
  );
}
