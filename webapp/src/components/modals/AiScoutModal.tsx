import { useState, useMemo } from 'react';
import { Star, MapPin, Plus, ExternalLink, Globe, Utensils, Navigation } from 'lucide-react';
import { scoutDining } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import type { ItineraryItem } from '../../core/models';
import { Button, IconButton, Modal } from '../ui';

interface AiScoutModalProps {
  onClose: () => void;
  onAdd: (item: ItineraryItem) => void;
}

type ScoutStep = 'select' | 'loading' | 'results';

type ScoutResult = Awaited<ReturnType<typeof scoutDining>>[number] & {
  happyCowUrl?: string;
  officialUrl?: string;
  lat?: number;
  lng?: number;
  distance?: string;
};

export default function AiScoutModal({ onClose, onAdd }: AiScoutModalProps) {
  const [step, setStep] = useState<ScoutStep>('select');
  const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);
  const [results, setResults] = useState<ScoutResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const currentTripId = useTripStore(s => s.currentTripId);
  const trips = useTripStore(s => s.trips);
  const items = useTripStore(s => s.items);
  const currentTrip = trips.find(t => t.id === currentTripId);

  const candidateStops = useMemo(() => {
    return items
      .filter(i => i.type !== 'flight' && i.type !== 'rental-car' && i.type !== 'food')
      .sort((a,b) => a.startDate.localeCompare(b.startDate));
  }, [items]);

  const runScout = async (stop: ItineraryItem) => {
    setSelectedStop(stop);
    setStep('loading');
    setError(null);
    try {
      const locationQuery = stop.location.address || stop.location.name || '';
      const data = await scoutDining(locationQuery, currentTrip?.title || '');
      setResults(data);
      setStep('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to scout restaurants.');
      setStep('results');
    }
  };

  const handleAdd = (res: ScoutResult) => {
    if (!selectedStop) return;

    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      type: 'food',
      title: res.name,
      startDate: selectedStop.startDate,
      description: res.description,
      location: {
        name: res.name,
        address: res.address,
        latitude: res.lat || null,
        longitude: res.lng || null
      },
      foodDetails: {
        mealType: 'Dinner',
        happyCowUrl: res.happyCowUrl,
        officialUrl: res.officialUrl
      }
    };
    
    onAdd(newItem);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={<><Utensils size={20} className="text-ai" /> Dining Scout</>}
      variant="center"
      className="glass-effect shimmering-border max-w-[500px] overflow-hidden rounded-[28px]"
      headerActions={<div className={`ai-status-dot ${step === 'loading' ? 'active' : ''}`} />}
    >
      {step === 'select' && (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] leading-normal text-label-secondary">
            Where should we look for food? Pick a reference stop on your trip to scout the surrounding area.
          </p>
          
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
            {candidateStops.map(stop => {
              const date = new Date(stop.startDate);
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <Button
                  key={stop.id}
                  onClick={() => runScout(stop)}
                  variant="secondary"
                  className="glass-card flex h-auto w-full cursor-pointer items-center justify-start gap-3 rounded-control border border-white/8 p-3.5 text-left transition-all duration-200"
                >
                  <div className="flex size-10 items-center justify-center rounded-[10px] bg-white/5 text-label-tertiary">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.05em] text-sys-blue">{dayLabel}</div>
                    <div className="text-body font-bold text-label">{stop.title}</div>
                    <div className="text-caption text-label-secondary opacity-80">{stop.location.name}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center gap-5 py-[60px]">
          <div className="spinning relative size-16">
            <div className="absolute inset-0 rounded-full border-4 border-sys-purple/10 border-t-sys-purple" />
            <Utensils size={24} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sys-purple" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-[18px] font-extrabold text-label">Scouting Near {selectedStop?.location.name}</h3>
            <p className="text-footnote text-label-secondary">Searching HappyCow & local gems...</p>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col gap-4">
           {error ? (
            <div className="rounded-control border border-sys-red/20 bg-sys-red/10 p-5 text-sys-red">
              <p className="mb-1 font-bold">Scouting failed</p>
              <div className="text-caption opacity-80">{error}</div>
              <Button onClick={() => setStep('select')} variant="ghost" size="sm" className="mt-3 text-caption font-bold text-label underline">Try another location</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-footnote text-label-secondary">Top Vegetarian Picks Found</span>
                <Button onClick={() => setStep('select')} variant="ghost" size="sm" className="text-caption font-bold text-sys-blue">Change Location</Button>
              </div>

              <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1">
                {results.map((res, i) => (
                  <div 
                    key={`${res.name}-${i}`} 
                    className="glass-card flex flex-col gap-2 rounded-2xl border border-white/8 p-4" 
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-[16px] font-bold text-label">{res.name}</h3>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1 text-caption font-bold text-sys-purple">
                            <Star size={12} className="fill-sys-purple" /> {res.rating}
                          </div>
                          {res.distance && (
                            <div className="flex items-center gap-[3px] text-[11px] font-semibold text-label-secondary">
                              <Navigation size={11} /> {res.distance}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {res.happyCowUrl && (
                          <IconButton aria-label="Open HappyCow" onClick={() => window.open(res.happyCowUrl, '_blank')} className="header-icon-btn" size="sm">
                            <ExternalLink size={16} />
                          </IconButton>
                        )}
                        {res.officialUrl && (
                          <IconButton aria-label="Open website" onClick={() => window.open(res.officialUrl, '_blank')} className="header-icon-btn" size="sm">
                            <Globe size={16} />
                          </IconButton>
                        )}
                        <IconButton
                          aria-label={`Add ${res.name}`}
                          onClick={() => handleAdd(res)}
                          className="header-icon-btn border-white/20 bg-sys-blue"
                          size="sm"
                        >
                          <Plus size={20} />
                        </IconButton>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <MapPin size={12} className="text-label-tertiary" />
                      <span className="text-caption text-label-secondary">{res.address}</span>
                    </div>

                    <p className="border-l-2 border-sys-purple pl-2 text-footnote italic leading-[1.4] text-label-secondary">
                      &quot;{res.description}&quot;
                    </p>

                    <div className="flex gap-1.5">
                      <span className="rounded-md bg-white/6 px-2 py-0.5 text-[10px] font-extrabold text-label-tertiary">
                        {res.cuisineType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
