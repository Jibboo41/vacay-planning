import React, { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Calendar, ChevronRight, LogOut, Copy, Pencil, Trash2 } from 'lucide-react';
import { auth } from '../core/firebase';
import { useNavigate } from 'react-router-dom';

const TripSelector: React.FC = () => {
  const trips = useTripStore(s => s.trips);
  const addTrip = useTripStore(s => s.addTrip);
  const deleteTrip = useTripStore(s => s.deleteTrip);
  const duplicateTrip = useTripStore(s => s.duplicateTrip);
  const setCurrentTrip = useTripStore(s => s.setCurrentTrip);
  const currentTripId = useTripStore(s => s.currentTripId);
  
  const [newTripTitle, setNewTripTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameTrip = useTripStore(s => s.renameTrip);

  const handleStartRename = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(title);
  };

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (renameValue.trim()) {
      await renameTrip(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const getTripDates = (items: any[]) => {
    if (!items || items.length === 0) return 'No dates set';
    
    const parse = (d: string) => {
      if (!d) return NaN;
      if (d.includes('T')) return new Date(d).getTime();
      return new Date(d.replace(/-/g, '/')).getTime();
    };

    const startDates = items.map(i => parse(i.startDate)).filter(t => !isNaN(t));
    const endDates = items.map(i => {
       const d = i.endDate ? i.endDate : i.startDate;
       return parse(d);
    }).filter(t => !isNaN(t));
    
    if (startDates.length === 0) return 'No dates set';
    const min = new Date(Math.min(...startDates));
    const max = new Date(Math.max(...endDates));
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = min.toLocaleDateString(undefined, options);
    const endStr = max.toLocaleDateString(undefined, { ...options, year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  };

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
    if (renamingId) return; // Don't navigate while renaming
    setCurrentTrip(id);
    navigate('/timeline');
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTrip(id);
    }
  };

  const handleDuplicateTrip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
       await duplicateTrip(id);
    } catch (err: any) {
       alert("Failed to duplicate trip: " + err.message);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  useEffect(() => {
    if (trips && trips.length === 1 && currentTripId !== trips[0].id) {
      setCurrentTrip(trips[0].id);
    }
  }, [trips, currentTripId, setCurrentTrip]);

  return (
    <div className="trip-selector-screen">
      <header className="screen-header">
        <h1 style={{ flex: 1, fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>My Trips</h1>
        <button onClick={handleLogout} className="logout-btn" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </header>

      <main className="trip-list-container">
        <div className="trip-list">
        {trips.length === 0 ? (
          <div className="empty-state">
            <p>No trips yet. Plan your first adventure!</p>
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id} 
              className={`trip-card ${currentTripId === trip.id ? 'active' : ''}`}
              onClick={() => handleSelectTrip(trip.id)}
            >
              <div className="trip-info">
                {renamingId === trip.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      className="edit-field-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') handleSaveRename(e, trip.id); if(e.key === 'Escape') setRenamingId(null); }}
                      style={{ height: '44px', margin: 0 }}
                    />
                  </div>
                ) : (
                  <>
                    <h3>{trip.title}</h3>
                    <div className="trip-meta">
                      <span><Calendar size={14} /> {getTripDates(trip.items)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="trip-actions">
                {!renamingId && (
                  <>
                    <button 
                      onClick={(e) => handleStartRename(e, trip.id, trip.title)}
                      className="duplicate-trip-btn"
                      title="Rename"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDuplicateTrip(e, trip.id)} 
                      className="duplicate-trip-btn"
                      title="Duplicate Trip"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTrip(e, trip.id)} 
                      className="delete-trip-btn"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <ChevronRight size={20} className="chevron" />
              </div>
            </div>
          ))
        )}

        <button 
          onClick={() => setIsAdding(true)} 
          className="btn-glass-blue add-trip-btn-large"
        >
          <Plus size={24} />
          <span>Plan New Trip</span>
        </button>
        </div>
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
                style={{ fontSize: '16px' }}
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
          box-sizing: border-box;
        }

        .trip-list-container {
          padding: 24px;
          padding-bottom: 120px;
        }

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
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .trip-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          pointer-events: none;
        }

        .trip-card:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .trip-card.active {
          border-color: var(--sys-blue);
          background: rgba(10, 132, 255, 0.06);
          box-shadow: 0 0 0 1px var(--sys-blue), 0 15px 45px rgba(0, 0, 0, 0.25);
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
          gap: 4px;
        }

        .duplicate-trip-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .duplicate-trip-btn:hover {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.1);
        }

        .delete-trip-btn {
          background: transparent;
          border: none;
          color: rgba(255, 69, 58, 0.4);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .delete-trip-btn:hover {
          color: #ff453a !important;
          background: rgba(255, 69, 58, 0.15);
        }

        .chevron { color: rgba(255, 255, 255, 0.2); transition: color 0.2s; }
        .trip-card:hover .chevron { color: rgba(255, 255, 255, 0.6); }

        .add-trip-btn-large {
          margin-top: 16px;
          border-radius: 20px;
          padding: 20px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .add-trip-btn-large:hover { transform: translateY(-2px); }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
          border: 2px dashed rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          margin-bottom: 24px;
        }

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

        .modal-content input {
          width: 100%;
          background: #2c2c2e;
          border: none;
          border-radius: 12px;
          padding: 16px;
          color: white;
          font-size: 16px;
          margin-bottom: 24px;
          outline: none;
        }

        .modal-content input:focus { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1); }

        .modal-actions {
          display: flex; gap: 12px;
        }

        .modal-actions button {
          flex: 1; padding: 14px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer;
        }

        .modal-actions button:first-child { background: #2c2c2e; color: #888; }
        .submit-btn { background: white; color: black; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default TripSelector;
