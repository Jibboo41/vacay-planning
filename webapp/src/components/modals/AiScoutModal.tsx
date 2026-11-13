import { useState, useMemo } from 'react';
import { X, Star, MapPin, Plus, ExternalLink, Globe, Utensils, Navigation } from 'lucide-react';
import { scoutDining } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import type { ItineraryItem } from '../../core/models';

interface AiScoutModalProps {
  onClose: () => void;
  onAdd: (item: ItineraryItem) => void;
}

type ScoutStep = 'select' | 'loading' | 'results';

export default function AiScoutModal({ onClose, onAdd }: AiScoutModalProps) {
  const [step, setStep] = useState<ScoutStep>('select');
  const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);
  const [results, setResults] = useState<any[]>([]);
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
    } catch (err: any) {
      setError(err.message || 'Failed to scout restaurants.');
      setStep('results');
    }
  };

  const handleAdd = (res: any) => {
    if (!selectedStop) return;

    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      type: 'food',
      title: res.name,
      startDate: selectedStop.startDate,
      description: res.description, // No sparkles added here
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
    <div className="modal-backdrop modal-backdrop--center" onClick={onClose}>
      <div
        className="modal-sheet modal-sheet--dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Dining Scout"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title modal-title--icon">
            <Utensils size={20} /> Dining Scout
          </h2>
          <button className="icon-btn icon-btn--round" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === 'select' && (
          <div className="modal-form">
            <p className="modal-lede modal-lede--flush">
              Where should we look for food? Pick a reference stop on your trip to scout the surrounding area.
            </p>

            <div className="list-stack scout-scroll">
              {candidateStops.map(stop => {
                const date = new Date(stop.startDate);
                const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <button
                    key={stop.id}
                    onClick={() => runScout(stop)}
                    className="card card--inset card--interactive scout-stop"
                  >
                    <div className="scout-stop__icon">
                      <MapPin size={20} />
                    </div>
                    <div className="scout-stop__main">
                      <div className="scout-stop__day">{dayLabel}</div>
                      <div className="scout-stop__title">{stop.title}</div>
                      <div className="scout-stop__place">{stop.location.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="scout-loading" role="status">
            <div className="spinning scout-loading__spinner">
              <div />
              <Utensils size={24} />
            </div>
            <div>
              <h3 className="scout-loading__title">Scouting Near {selectedStop?.location.name}</h3>
              <p className="modal-subtitle">Searching HappyCow & local gems...</p>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="modal-form">
             {error ? (
              <div className="banner banner--danger scout-error" role="alert">
                <p>Scouting failed</p>
                <div>{error}</div>
                <button onClick={() => setStep('select')} className="btn btn--sm">Try another location</button>
              </div>
            ) : (
              <>
                <div className="card-heading">
                  <span className="modal-subtitle">Top Vegetarian Picks Found</span>
                  <button onClick={() => setStep('select')} className="btn btn--ghost btn--sm">Change Location</button>
                </div>

                <div className="list-stack scout-scroll">
                  {results.map((res, i) => (
                    <div
                      key={i}
                      className="card card--inset card--pad scout-result"
                    >
                      <div className="scout-result__header">
                        <div className="scout-stop__main">
                          <h3 className="scout-result__name">{res.name}</h3>
                          <div className="scout-result__meta">
                            <div className="scout-result__rating">
                              <Star size={12} fill="var(--sys-purple)" /> {res.rating}
                            </div>
                            {res.distance && (
                              <div>
                                <Navigation size={11} /> {res.distance}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="list-row__actions">
                          {res.happyCowUrl && (
                            <button onClick={() => window.open(res.happyCowUrl, '_blank')} className="icon-btn" title="HappyCow" aria-label="Open on HappyCow">
                              <ExternalLink size={16} />
                            </button>
                          )}
                          {res.officialUrl && (
                            <button onClick={() => window.open(res.officialUrl, '_blank')} className="icon-btn" title="Website" aria-label="Open website">
                              <Globe size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleAdd(res)}
                            className="icon-btn icon-btn--solid"
                            title="Add to timeline"
                            aria-label={`Add ${res.name} to timeline`}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="scout-result__address">
                        <MapPin size={12} />
                        <span>{res.address}</span>
                      </div>

                      <p className="scout-result__quote">
                        "{res.description}"
                      </p>

                      <div>
                        <span className="item-chip">
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
      </div>
    </div>
  );
}
