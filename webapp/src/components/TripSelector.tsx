import React, { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Calendar, ChevronRight, LogOut, Copy, Pencil, Plane, Trash2 } from 'lucide-react';
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
    <div className="screen trip-selector-screen">
      <header className="screen-header">
        <div className="screen-header__titles">
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">{trips.length} trip{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleLogout} className="icon-btn icon-btn--lg icon-btn--round" aria-label="Logout" title="Sign out">
          <LogOut size={18} />
        </button>
      </header>

      <main className="screen-body">
        <div className="list-stack">
        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Plane size={26} /></div>
            <p className="empty-state__text">No trips yet. Plan your first adventure!</p>
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id} 
              className={`card card--interactive trip-card ${currentTripId === trip.id ? 'active' : ''}`}
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
                      className="icon-btn icon-btn--plain duplicate-trip-btn"
                      title="Rename"
                      aria-label={`Rename ${trip.title}`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDuplicateTrip(e, trip.id)}
                      className="icon-btn icon-btn--plain duplicate-trip-btn"
                      title="Duplicate Trip"
                      aria-label={`Duplicate ${trip.title}`}
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      className="icon-btn icon-btn--plain delete-trip-btn"
                      title="Delete"
                      aria-label={`Delete ${trip.title}`}
                    >
                      <Trash2 size={18} />
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
          className="btn btn--tonal btn--lg btn--block add-trip-btn-large"
        >
          <Plus size={20} />
          <span>Plan New Trip</span>
        </button>
        </div>
      </main>

      {isAdding && (
        <div className="modal-backdrop modal-backdrop--center" onClick={() => setIsAdding(false)}>
          <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="new-trip-title" onClick={e => e.stopPropagation()}>
            <h2 id="new-trip-title" className="modal-title">New Trip</h2>
            <form onSubmit={handleAddTrip} className="modal-form">
              <input
                autoFocus
                type="text"
                aria-label="Trip title"
                placeholder="Trip Title (e.g., Japan Summer 2025)"
                value={newTripTitle}
                onChange={e => setNewTripTitle(e.target.value)}
                className="edit-field-input"
              />
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsAdding(false)} disabled={isCreating}>Cancel</button>
                <button type="submit" className="btn btn--primary submit-btn" disabled={!newTripTitle.trim() || isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripSelector;
