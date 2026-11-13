import { useState } from 'react';
import { X, Sparkles, Loader } from 'lucide-react';
import type { ItineraryItem } from '../../core/models';
import { parseItinerary } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import { explicitSourceDates, normalizeParsedDate } from '../../core/parsedDates';
import { isDayKey } from '../../core/timelineDetails';

interface AddItineraryModalProps {
  onClose: () => void;
  onAdd: (item: ItineraryItem) => void;
}

export default function AddItineraryModal({ onClose, onAdd }: AddItineraryModalProps) {
  const [emailText, setEmailText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ItineraryItem[] | null>(null);

  const currentTripId = useTripStore(s => s.currentTripId);
  const trips = useTripStore(s => s.trips);
  const tripTitle = trips.find(t => t.id === currentTripId)?.title || '';

  const handleParse = async () => {
    if (!emailText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      let items = await parseItinerary(emailText, tripTitle);
      const sourceDates = explicitSourceDates(emailText);
      
      // Year Sanitizer: If any items have missing/invalid years (usually defaults to 2001 or 1970 if yearless)
      // or if we just want to ensure consistency with the current trip.
      // Year Sanitizer: Robustly calculate the default year.
      const currentItems = useTripStore.getState().items;
      let defaultYear = new Date().getFullYear();
      
      if (currentItems.length > 0) {
        const sorted = [...currentItems].sort((a,b) => a.startDate.localeCompare(b.startDate));
        const firstYear = Number(sorted[0].startDate.slice(0, 4));
        if (!isNaN(firstYear) && firstYear >= 2000) {
          defaultYear = firstYear;
        }
      }

      items = items.map(item => {
        if (item.startDate) {
          item.startDate = normalizeParsedDate(item.startDate, defaultYear, sourceDates);
          if (item.endDate) {
            item.endDate = normalizeParsedDate(item.endDate, defaultYear, sourceDates);
          }
        }
        return item;
      });

      if (items.length === 0) throw new Error('No itinerary items were found. Check the text and try again.');
      setParsedItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse this itinerary. Please try again.');
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--sys-label-primary)" /></button>
        </div>

        {parsedItems ? <>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginBottom: '16px' }}>Check the dates and times before adding these items.</p>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {parsedItems.map((item, index) => <div key={`${item.id}-${index}`} style={{ marginBottom: '20px' }}>
              <strong>{item.title}</strong>
              {(['startDate', 'endDate'] as const).map(field => (field === 'startDate' || item.endDate) && <label key={field} className="edit-field-group" style={{ marginTop: '8px' }}>
                <span className="edit-field-label">{field === 'startDate' ? 'Start date and time' : 'End date and time'}</span>
                <input className="edit-field-input" type="datetime-local" value={(item[field] || '').slice(0, 16)} onChange={event => setParsedItems(current => current?.map((entry, i) => i === index ? { ...entry, [field]: event.target.value ? `${event.target.value}:00` : '' } : entry) || null)} />
              </label>)}
            </div>)}
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button type="button" onClick={() => { setParsedItems(null); setError(null); }} style={{ flex: 1, padding: '16px' }}>Back</button>
            <button type="button" className="btn-glass-blue" style={{ flex: 2, padding: '16px', borderRadius: '14px' }} onClick={() => {
              if (parsedItems.some(item => !item.startDate || !isDayKey(item.startDate.slice(0, 10)) || Number.isNaN(new Date(item.startDate).getTime()) || (item.endDate && (!isDayKey(item.endDate.slice(0, 10)) || Number.isNaN(new Date(item.endDate).getTime()) || item.endDate < item.startDate)))) { setError('Check that each start date is valid and each end is after its start.'); return; }
              parsedItems.forEach(item => onAdd(item)); onClose();
            }}>Add items</button>
          </div>
        </> : <>
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
            color: 'var(--sys-label-primary)', fontSize: '16px', resize: 'none', lineHeight: '1.5',
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
            background: !emailText.trim() ? 'rgba(var(--neutral-rgb), 0.05)' : undefined,
            border: !emailText.trim() ? '1px solid rgba(var(--neutral-rgb), 0.08)' : undefined,
            color: !emailText.trim() ? 'var(--sys-label-secondary)' : 'var(--sys-label-primary)',
            boxShadow: !emailText.trim() ? 'none' : undefined
          }}
        >
          {isLoading ? <Loader size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={20} style={{ marginRight: '8px' }} />}
          {isLoading ? 'Parsing...' : 'Parse with AI'}
        </button>
        </>}
      </div>
    </div>
  );
}
