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
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-sheet glass-effect shimmering-border" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', alignSelf: 'center', borderRadius: '28px', overflow: 'hidden' }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className={`ai-status-dot ${step === 'loading' ? 'active' : ''}`} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={20} className="text-ai" /> Dining Scout
          </h2>
        </div>

        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', lineHeight: '1.5' }}>
              Where should we look for food? Pick a reference stop on your trip to scout the surrounding area.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
              {candidateStops.map(stop => {
                const date = new Date(stop.startDate);
                const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <button
                    key={stop.id}
                    onClick={() => runScout(stop)}
                    className="glass-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                      borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                      textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '10px', 
                      background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', color: 'var(--sys-label-tertiary)' 
                    }}>
                      <MapPin size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--sys-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayLabel}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>{stop.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--sys-label-secondary)', opacity: 0.8 }}>{stop.location.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="spinning" style={{ position: 'relative', width: '64px', height: '64px' }}>
              <div style={{ 
                position: 'absolute', inset: 0, borderRadius: '50%', 
                border: '4px solid rgba(191, 90, 242, 0.1)', borderTopColor: '#BF5AF2' 
              }} />
              <Utensils size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#BF5AF2' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>Scouting Near {selectedStop?.location.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)' }}>Searching HappyCow & local gems...</p>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {error ? (
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF453A' }}>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>Scouting failed</p>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{error}</div>
                <button onClick={() => setStep('select')} style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#FFF', textDecoration: 'underline' }}>Try another location</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--sys-label-secondary)' }}>Top Vegetarian Picks Found</span>
                  <button onClick={() => setStep('select')} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sys-blue)' }}>Change Location</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {results.map((res, i) => (
                    <div 
                      key={i} 
                      className="glass-card" 
                      style={{ 
                        padding: '16px', borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>{res.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#BF5AF2', fontWeight: 700 }}>
                              <Star size={12} fill="#BF5AF2" /> {res.rating}
                            </div>
                            {res.distance && (
                              <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                <Navigation size={11} /> {res.distance}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {res.happyCowUrl && (
                            <button onClick={() => window.open(res.happyCowUrl, '_blank')} className="header-icon-btn" style={{ width: '36px', height: '36px', borderRadius: '10px' }} title="HappyCow">
                              <ExternalLink size={16} />
                            </button>
                          )}
                          {res.officialUrl && (
                            <button onClick={() => window.open(res.officialUrl, '_blank')} className="header-icon-btn" style={{ width: '36px', height: '36px', borderRadius: '10px' }} title="Website">
                              <Globe size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleAdd(res)}
                            className="header-icon-btn"
                            style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--sys-blue)', borderColor: 'rgba(255,255,255,0.2)' }}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <MapPin size={12} color="var(--sys-label-tertiary)" />
                        <span style={{ fontSize: '12px', color: 'var(--sys-label-secondary)' }}>{res.address}</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', lineHeight: '1.4', fontStyle: 'italic', borderLeft: '2px solid #BF5AF2', paddingLeft: '8px' }}>
                        "{res.description}"
                      </p>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', color: 'var(--sys-label-tertiary)' }}>
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
