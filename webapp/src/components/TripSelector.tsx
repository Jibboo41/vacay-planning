import React, { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Trash2, Calendar, MapPin, ChevronRight, LogOut } from 'lucide-react';
import { auth } from '../core/firebase';
import { useNavigate } from 'react-router-dom';

const TripSelector: React.FC = () => {
  const trips = useTripStore(s => s.trips);
  const addTrip = useTripStore(s => s.addTrip);
  const deleteTrip = useTripStore(s => s.deleteTrip);
  const setCurrentTrip = useTripStore(s => s.setCurrentTrip);
  const currentTripId = useTripStore(s => s.currentTripId);
  
  const [newTripTitle, setNewTripTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;
    setIsCreating(true);
    try {
      await addTrip(newTripTitle);
      setNewTripTitle('');
      setIsAdding(false);
      navigate('/timeline');
    } catch (err: any) {
      console.error('Failed to add trip:', err);
      alert(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectTrip = (id: string) => {
    setCurrentTrip(id);
    navigate('/timeline');
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTrip(id);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  useEffect(() => {
    // Break potential loops: only setCurrentTrip if we have exactly one trip 
    // AND it's not already set to that ID.
    if (trips && trips.length === 1 && currentTripId !== trips[0].id) {
      console.log('AUTO-SELECTING SINGLE TRIP:', trips[0].id);
      setCurrentTrip(trips[0].id);
    }
  }, [trips, currentTripId, setCurrentTrip]);

  return (
    <div className="trip-selector-screen">
      <header className="trip-header">
        <div className="header-top">
          <h1>My Trips</h1>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="trip-list">
        {trips.length === 0 ? (
          <div className="empty-state">
            <p>No trips yet. Plan your first adventure!</p>
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id} 
              className="trip-card"
              onClick={() => handleSelectTrip(trip.id)}
            >
              <div className="trip-info">
                <h3>{trip.title}</h3>
                <div className="trip-meta">
                  <span><Calendar size={14} /> {trip.items.length} items</span>
                  {trip.items.length > 0 && (
                     <span><MapPin size={14} /> {trip.items[0]?.location?.name}</span>
                  )}
                </div>
              </div>
              <div className="trip-actions">
                <button 
                  onClick={(e) => handleDeleteTrip(e, trip.id)} 
                  className="delete-trip-btn"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={20} className="chevron" />
              </div>
            </div>
          ))
        )}

        <button 
          onClick={() => setIsAdding(true)} 
          className="add-trip-btn-large"
        >
          <Plus size={24} />
          <span>Plan New Trip</span>
        </button>
      </main>

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>New Trip</h2>
            <form onSubmit={handleAddTrip}>
              <input 
                autoFocus
                type="text" 
                placeholder="Trip Title (e.g., Japan Summer 2025)"
                value={newTripTitle}
                onChange={e => setNewTripTitle(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsAdding(false)} disabled={isCreating}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={!newTripTitle.trim() || isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .trip-selector-screen {
          min-height: 100vh;
          background: transparent;
          color: white;
          padding: 24px;
          padding-bottom: 120px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        h1 { font-size: 2.2rem; font-weight: 800; margin: 0; }

        .logout-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none; color: #888;
          width: 40px; height: 40px;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }

        .trip-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trip-card {
          background: rgba(25, 25, 28, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .trip-card:hover {
          background: rgba(35, 35, 40, 0.9);
          transform: scale(1.02);
        }

        .trip-info h3 { margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; }
        
        .trip-meta {
          display: flex;
          gap: 12px;
          color: #888;
          font-size: 0.9rem;
          align-items: center;
        }

        .trip-meta span { display: flex; align-items: center; gap: 4px; }

        .trip-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .delete-trip-btn {
          background: transparent;
          border: none;
          color: #444;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .trip-card:hover .delete-trip-btn { color: #888; }
        .delete-trip-btn:hover { color: #ff3b30 !important; background: rgba(255, 59, 48, 0.1); }

        .chevron { color: #333; transition: color 0.2s; }
        .trip-card:hover .chevron { color: #666; }

        .add-trip-btn-large {
          margin-top: 16px;
          background: white;
          color: black;
          border: none;
          border-radius: 20px;
          padding: 20px;
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .add-trip-btn-large:hover { background: #f0f0f0; transform: translateY(-2px); }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
          border: 2px dashed rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          margin-bottom: 24px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #1c1c1e;
          width: 100%;
          max-width: 400px;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-content h2 { margin: 0 0 20px 0; font-size: 1.5rem; }

        input {
          width: 100%;
          background: #2c2c2e;
          border: none;
          border-radius: 12px;
          padding: 16px;
          color: white;
          font-size: 1rem;
          margin-bottom: 24px;
          outline: none;
        }

        input:focus { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1); }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-actions button:first-child { background: #2c2c2e; color: #888; }
        .submit-btn { background: white; color: black; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default TripSelector;
