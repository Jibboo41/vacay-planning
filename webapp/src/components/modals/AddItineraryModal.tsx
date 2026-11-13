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

        <div className="modal-header">
          <h2 className="modal-title">Add from Email</h2>
          <button onClick={onClose} className="icon-btn icon-btn--round" aria-label="Close"><X size={18} /></button>
        </div>

        {parsedItems ? <>
          <p className="modal-lede">Check the dates and times before adding these items.</p>
          <div className="modal-form modal-form--fill">
            {parsedItems.map((item, index) => <div key={`${item.id}-${index}`} className="card card--inset card--pad">
              <strong>{item.title}</strong>
              {(['startDate', 'endDate'] as const).map(field => (field === 'startDate' || item.endDate) && <label key={field} className="edit-field-group" style={{ marginTop: '8px' }}>
                <span className="edit-field-label">{field === 'startDate' ? 'Start date and time' : 'End date and time'}</span>
                <input className="edit-field-input" type="datetime-local" value={(item[field] || '').slice(0, 16)} onChange={event => setParsedItems(current => current?.map((entry, i) => i === index ? { ...entry, [field]: event.target.value ? `${event.target.value}:00` : '' } : entry) || null)} />
              </label>)}
            </div>)}
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="modal-footer modal-footer--safe">
            <button type="button" className="btn btn--lg" onClick={() => { setParsedItems(null); setError(null); }}>Back</button>
            <button type="button" className="btn btn--primary btn--lg" style={{ flex: 2 }} onClick={() => {
              if (parsedItems.some(item => !item.startDate || !isDayKey(item.startDate.slice(0, 10)) || Number.isNaN(new Date(item.startDate).getTime()) || (item.endDate && (!isDayKey(item.endDate.slice(0, 10)) || Number.isNaN(new Date(item.endDate).getTime()) || item.endDate < item.startDate)))) { setError('Check that each start date is valid and each end is after its start.'); return; }
              parsedItems.forEach(item => onAdd(item)); onClose();
            }}>Add items</button>
          </div>
        </> : <>
        <p className="modal-lede">
          Paste a booking confirmation or itinerary email and we'll extract all the details automatically.
        </p>

        <textarea
          placeholder="Paste email content here..."
          aria-label="Email content"
          value={emailText}
          onChange={e => setEmailText(e.target.value)}
          className="edit-field-input modal-fill-input"
        />

        {error && (
          <p className="field-error" role="alert">{error}</p>
        )}

        <div className="modal-footer modal-footer--safe">
          <button
            onClick={handleParse}
            disabled={isLoading || !emailText.trim()}
            className="btn btn--primary btn--lg"
          >
            {isLoading ? <Loader size={20} className="spinning" /> : <Sparkles size={20} />}
            {isLoading ? 'Parsing...' : 'Parse with AI'}
          </button>
        </div>
        </>}
      </div>
    </div>
  );
}
