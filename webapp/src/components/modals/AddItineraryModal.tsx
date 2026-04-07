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
      const items = await parseItinerary(emailText, tripTitle);
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
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ height: '80vh' }}>
        <div className="modal-pull-indicator" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Add from Email</h2>
          <button onClick={onClose}><X size={24} color="#FFF" /></button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginBottom: '20px' }}>
          Paste a booking confirmation or itinerary email and we'll extract all the details automatically.
        </p>

        <textarea
          placeholder="Paste email content here..."
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          style={{
            width: '100%', flex: 1, padding: '16px', borderRadius: '12px',
            background: 'var(--sys-bg-elevated-2)', border: '1px solid var(--sys-separator)',
            color: '#FFF', fontSize: '15px', resize: 'none', lineHeight: '1.5',
            minHeight: '180px', marginBottom: '16px',
          }}
        />

        {error && (
          <p style={{ fontSize: '13px', color: 'var(--sys-red)', marginBottom: '12px' }}>{error}</p>
        )}

        <button
          onClick={handleParse}
          disabled={isLoading || !emailText.trim()}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: emailText.trim() ? 'var(--sys-blue)' : 'rgba(255, 255, 255, 0.05)',
            color: emailText.trim() ? '#FFF' : 'var(--sys-label-secondary)', 
            fontSize: '16px', fontWeight: 700,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            opacity: isLoading ? 0.7 : 1, marginBottom: '24px',
            transition: 'all 0.2s ease',
            border: emailText.trim() ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: emailText.trim() ? '0 4px 16px rgba(10, 132, 255, 0.4)' : 'none',
          }}
        >
          {isLoading ? <Loader size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={20} style={{ marginRight: '8px' }} />}
          {isLoading ? 'Parsing...' : 'Parse with AI'}
        </button>
      </div>
    </div>
  );
}
