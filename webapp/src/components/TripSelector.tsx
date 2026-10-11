import React, { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Calendar, ChevronRight, LogOut, Copy, Pencil, Trash2, Compass } from 'lucide-react';
import { auth } from '../core/firebase';
import { useNavigate } from 'react-router-dom';
import type { ItineraryItem } from '../core/models';
import { cn } from '../lib/cn';
import { Button, Card, EmptyState, IconButton, Input, Modal } from './ui';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
  const [pendingDeleteTripId, setPendingDeleteTripId] = useState<string | null>(null);
  const renameTrip = useTripStore(s => s.renameTrip);
  const pendingDeleteTrip = trips.find(trip => trip.id === pendingDeleteTripId);

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

  const getTripDates = (items: ItineraryItem[]) => {
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
    } catch (err) {
      console.error('Failed to add trip:', err);
      alert(getErrorMessage(err) || 'Failed to create trip. Please try again.');
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
    setPendingDeleteTripId(id);
  };

  const handleConfirmDeleteTrip = () => {
    if (!pendingDeleteTripId) return;
    deleteTrip(pendingDeleteTripId);
    setPendingDeleteTripId(null);
  };

  const handleDuplicateTrip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
       await duplicateTrip(id);
    } catch (err) {
       alert("Failed to duplicate trip: " + getErrorMessage(err));
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
    <div className="min-h-dvh bg-transparent text-label">
      <header className="screen-header">
        <h1 className="m-0 flex-1 text-[2rem] font-extrabold tracking-[-1px] text-label">My Trips</h1>
        <IconButton onClick={handleLogout} variant="glass" size="md" round aria-label="Logout" className="text-label-tertiary">
          <LogOut size={18} />
        </IconButton>
      </header>

      <main className="px-6 pb-[120px] pt-6">
        <div className="flex flex-col gap-4">
        {trips.length === 0 ? (
          <Card className="mb-2">
            <EmptyState
              icon={<Compass size={32} />}
              title="No trips yet"
              description="Create a trip to start planning your itinerary, notes, costs, and packing list."
              action={(
                <Button onClick={() => setIsAdding(true)}>
                  <Plus size={18} />
                  Create your first trip
                </Button>
              )}
            />
          </Card>
        ) : (
          trips.map(trip => (
            <Card
              key={trip.id} 
              padding="lg"
              className={cn(
                'group flex cursor-default items-center justify-between overflow-hidden rounded-panel border bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-[400ms] ease-ios after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/5 after:to-transparent hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
                currentTripId === trip.id ? 'border-sys-blue bg-sys-blue/6 shadow-[0_0_0_1px_var(--sys-blue),0_15px_45px_rgba(0,0,0,0.25)]' : 'border-white/8',
              )}
            >
              {renamingId === trip.id ? (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
                  <div className="min-w-0">
                    <Input
                      autoFocus
                      className="m-0 h-11 w-full"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') handleSaveRename(e, trip.id); if(e.key === 'Escape') setRenamingId(null); }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-0 text-left font-[inherit] text-inherit"
                  onClick={() => handleSelectTrip(trip.id)}
                >
                  <div className="min-w-0">
                    <h3 className="mb-2 mt-0 text-xl font-semibold text-label">{trip.title}</h3>
                    <div className="flex items-center gap-3 text-[0.9rem] text-label-tertiary">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {getTripDates(trip.items)}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 transition-colors group-hover:text-white/60" />
                </button>
              )}
              <div className="flex items-center gap-1">
                {!renamingId && (
                  <>
                    <IconButton
                      aria-label="Rename trip"
                      onClick={(e) => handleStartRename(e, trip.id, trip.title)}
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-label"
                      title="Rename"
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="Duplicate trip"
                      onClick={(e) => handleDuplicateTrip(e, trip.id)} 
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-label"
                      title="Duplicate Trip"
                    >
                      <Copy size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="Delete trip"
                      onClick={(e) => handleDeleteTrip(e, trip.id)} 
                      variant="danger"
                      size="sm"
                      className="border-0 bg-transparent text-sys-red/40 hover:bg-sys-red/15 hover:text-sys-red"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </IconButton>
                  </>
                )}
              </div>
            </Card>
          ))
        )}

        <Button 
          onClick={() => setIsAdding(true)} 
          className="mt-4 gap-3 rounded-card p-5 text-[1.1rem] transition-transform hover:-translate-y-0.5"
          block
          size="lg"
        >
          <Plus size={24} />
          <span>Plan New Trip</span>
        </Button>
        </div>
      </main>

      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="New Trip"
        variant="center"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setIsAdding(false)} disabled={isCreating} className="flex-1">Cancel</Button>
            <Button type="submit" form="new-trip-form" variant="primary" disabled={!newTripTitle.trim() || isCreating} className="flex-1">
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </>
        )}
      >
            <form id="new-trip-form" onSubmit={handleAddTrip}>
              <Input
                autoFocus
                type="text" 
                placeholder="Trip Title (e.g., Japan Summer 2025)"
                value={newTripTitle}
                onChange={e => setNewTripTitle(e.target.value)}
                className="text-[16px]"
              />
            </form>
      </Modal>

      <Modal
        open={!!pendingDeleteTripId}
        onClose={() => setPendingDeleteTripId(null)}
        title="Delete trip?"
        variant="center"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setPendingDeleteTripId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDeleteTrip} className="flex-1">Delete</Button>
          </>
        )}
      >
        <p className="text-body leading-[1.5] text-label-secondary">
          This will permanently delete {pendingDeleteTrip ? <span className="font-bold text-label">&quot;{pendingDeleteTrip.title}&quot;</span> : 'this trip'} and all of its itinerary items, notes, costs, and lists.
        </p>
      </Modal>
    </div>
  );
};

export default TripSelector;
