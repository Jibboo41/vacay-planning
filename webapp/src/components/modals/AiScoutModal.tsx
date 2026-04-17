import { useState, useEffect } from 'react';
import { X, Sparkles, Loader, Star, MapPin, Plus, ExternalLink } from 'lucide-react';
import { scoutDining } from '../../data/api';
import { useTripStore } from '../../store/useTripStore';
import type { ItineraryItem } from '../../core/models';

interface AiScoutModalProps {
  location: string;
  date: string;
  onClose: () => void;
}

export default function AiScoutModal({ location, date, onClose }: AiScoutModalProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentTripId = useTripStore(s => s.currentTripId);
  const trips = useTripStore(s => s.trips);
  const addItem = useTripStore(s => s.addItem);
  const currentTrip = trips.find(t => t.id === currentTripId);

  useEffect(() => {
    const runScout = async () => {
      try {
        setLoading(true);
        const data = await scoutDining(location, currentTrip?.title || '');
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'Failed to scout restaurants.');
      } finally {
        setLoading(false);
      }
    };
    runScout();
  }, [location, currentTrip?.title]);

  const handleAdd = async (res: any) => {
    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      type: 'food',
      title: res.name,
      startDate: date, // Keep same time if possible, or just the date
      description: res.description,
      location: {
        name: res.name,
        address: res.address,
        latitude: null, // Gemini search might not return exact lat/lng easily without more prompting
        longitude: null
      },
      foodDetails: {
        mealType: 'Dinner'
      }
    };
    
    await addItem(newItem);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-morphism shimmering-border" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '90%', position: 'relative' }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="ai-status-dot active" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} className="text-ai" /> Gemini Veggie Scout
          </h2>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', lineHeight: '1.5' }}>
            Gemini is searching the web (HappyCow, Yelp, etc.) for the best vegetarian spots near <strong style={{ color: '#FFF' }}>{location}</strong>.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader size={32} className="animate-spin text-ai" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sys-label-secondary)' }}>Scouring the area...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF453A', fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#FF9F0A', fontWeight: 700, marginBottom: '4px' }}>
                       <Star size={12} fill="#FF9F0A" /> {res.rating}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     {res.url && (
                        <button 
                          onClick={() => window.open(res.url, '_blank')}
                          className="icon-btn-glass"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                     )}
                     <button 
                       onClick={() => handleAdd(res)}
                       className="icon-btn-glass"
                       style={{ width: '32px', height: '32px', color: 'var(--sys-green)' }}
                     >
                        <Plus size={18} />
                     </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <MapPin size={12} color="var(--sys-label-tertiary)" />
                  <span style={{ fontSize: '12px', color: 'var(--sys-label-secondary)' }}>{res.address}</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', lineHeight: '1.4', fontStyle: 'italic', borderLeft: '2px solid var(--sys-green)', paddingLeft: '8px' }}>
                  "{res.description}"
                </p>

                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', color: 'var(--sys-label-tertiary)' }}>
                    {res.cuisineType.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
