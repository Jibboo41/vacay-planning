import React, { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Calendar, ChevronRight, LogOut, Copy, Pencil, Trash2 } from 'lucide-react';
import { auth } from '../core/firebase';
import { useNavigate } from 'react-router-dom';
import PullToRefresh from './PullToRefresh';

const TripSelector: React.FC = () => {
  const trips = useTripStore(s => s.trips);
  const addTrip = useTripStore(s => s.addTrip);
  const deleteTrip = useTripStore(s => s.deleteTrip);
  const duplicateTrip = useTripStore(s => s.duplicateTrip);
  const setCurrentTrip = useTripStore(s => s.setCurrentTrip);
  const currentTripId = useTripStore(s => s.currentTripId);
  const refreshAppData = useTripStore(s => s.refreshAppData);
  
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
    if (renamingId) return; 
    setCurrentTrip(id);
    navigate('/timeline');
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trip?')) {
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
    <PullToRefresh onRefresh={refreshAppData}>
      <div className="trip-selector-screen" style={{ minHeight: '100vh' }}>
        <header className="screen-header" style={{ paddingTop: 'calc(6px + env(safe-area-inset-top))' }}>
          <h1 style={{ flex: 1, fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>My Trips</h1>
          <button onClick={handleLogout} className="logout-btn" aria-label="Logout">
            <LogOut size={18} />
          </button>
        </header>

        <main className="trip-list-container" style={{ padding: '0 24px 120px 24px' }}>
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
                          style={{ margin: 0 }}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveRename(e, trip.id)}
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="trip-title">{trip.title || 'Untitled Trip'}</h3>
                        <p className="trip-dates">
                          <Calendar size={12} style={{ marginRight: '6px' }} />
                          {getTripDates(trip.items)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="trip-actions" onClick={e => e.stopPropagation()}>
                    <button className="action-btn" onClick={(e) => handleStartRename(e, trip.id, trip.title || '')} aria-label="Rename">
                      <Pencil size={16} />
                    </button>
                    <button className="action-btn" onClick={(e) => handleDuplicateTrip(e, trip.id)} aria-label="Duplicate">
                      <Copy size={16} />
                    </button>
                    <button className="action-btn delete" onClick={(e) => handleDeleteTrip(e, trip.id)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                    <div className="chevron">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <div className="selector-footer">
          {isAdding ? (
            <form className="add-trip-form" onSubmit={handleAddTrip}>
              <input 
                autoFocus
                type="text" 
                placeholder="Where to next?" 
                value={newTripTitle}
                onChange={e => setNewTripTitle(e.target.value)}
                disabled={isCreating}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={isCreating || !newTripTitle.trim()}>
                  {isCreating ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          ) : (
            <button className="btn-primary large" onClick={() => setIsAdding(true)}>
              <Plus size={20} style={{ marginRight: '8px' }} />
              Plan New Trip
            </button>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};

export default TripSelector;
