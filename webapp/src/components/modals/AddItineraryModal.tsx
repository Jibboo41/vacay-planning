import { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import type { ItineraryItem } from '../../core/models';
import { parseItinerary } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import { Button, Field, Sheet, TextArea } from '../ui';

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
      const currentItems = useTripStore.getState().items;
      let defaultYear = new Date().getFullYear();
      
      if (currentItems.length > 0) {
        const sorted = [...currentItems].sort((a,b) => a.startDate.localeCompare(b.startDate));
        const firstYear = new Date(sorted[0].startDate.replace(/-/g, '/')).getFullYear();
        if (!isNaN(firstYear) && firstYear >= 2000) {
          defaultYear = firstYear;
        }
      }

      items = items.map(item => {
        const fixDate = (dateStr: string) => {
          if (!dateStr) return dateStr;
          const d = new Date(dateStr.replace(/-/g, '/'));
          if (!isNaN(d.getFullYear()) && d.getFullYear() >= 2024) {
             return dateStr;
          }

          const parts = dateStr.split('-');
          if (parts.length >= 3) {
            return `${defaultYear}-${parts[1]}-${parts[2]}`;
          }

          const match = dateStr.match(/(\d{1,2})[/-](\d{1,2})/);
          if (match) {
            const m = match[1].padStart(2, '0');
            const dStr = match[2].padStart(2, '0');
            const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : '12:00:00';
            return `${defaultYear}-${m}-${dStr}T${timePart}`;
          }

          return dateStr.replace(/^.*?(\d{4}|\d{2})[-/](\d{1,2})[-/](\d{1,2})/, (_match: string, _year: string, m: string, d: string) => {
             return `${defaultYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          });
        };

        if (item.startDate) {
          item.startDate = fixDate(item.startDate);
          if (item.endDate) {
            item.endDate = fixDate(item.endDate);
          }
        }
        return item;
      });

      items.forEach(item => onAdd(item));
      onClose();
    } catch {
      setError('Could not connect to backend. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const canParse = Boolean(emailText.trim());

  return (
    <Sheet
      open
      onClose={onClose}
      title="Add from Email"
      className="flex h-[80vh] flex-col"
      bodyClassName="flex flex-1 flex-col"
      footer={(
        <Button
          onClick={handleParse}
          disabled={isLoading || !canParse}
          variant={canParse ? 'glass' : 'secondary'}
          block
          size="lg"
          className={canParse ? 'btn-glass-blue disabled:opacity-70' : 'opacity-50'}
        >
          {isLoading ? <Loader size={20} className="animate-spin motion-reduce:animate-none" /> : <Sparkles size={20} />}
          {isLoading ? 'Parsing...' : 'Parse with AI'}
        </Button>
      )}
    >
      <p className="mb-5 shrink-0 text-[14px] leading-normal text-label-secondary">
        Paste a booking confirmation or itinerary email and we'll extract all the details automatically.
      </p>

      <Field label="Email content" className="flex flex-1 flex-col">
        {id => (
          <TextArea
            id={id}
            placeholder="Paste email content here..."
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            className="min-h-[180px] flex-1 resize-none rounded-control border-separator bg-surface-2 p-4 text-[16px] leading-normal text-label outline-none"
          />
        )}
      </Field>

      {error && (
        <p className="mt-3 shrink-0 text-footnote text-sys-red">{error}</p>
      )}
    </Sheet>
  );
}
