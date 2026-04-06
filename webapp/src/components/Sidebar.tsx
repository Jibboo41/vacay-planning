import React from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Trash2, LogOut, X } from 'lucide-react';
import { auth } from '../core/firebase';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const trips = useTripStore(s => s.trips);
  const addTrip = useTripStore(s => s.addTrip);
  const deleteTrip = useTripStore(s => s.deleteTrip);
  const setCurrentTrip = useTripStore(s => s.setCurrentTrip);
  const currentTripId = useTripStore(s => s.currentTripId);
  const theme = useTripStore(s => s.theme);
  const setTheme = useTripStore(s => s.setTheme);
  
  const [newTripTitle, setNewTripTitle] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const navigate = useNavigate();

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;
    try {
      await addTrip(newTripTitle);
      setNewTripTitle('');
      setIsAdding(false);
      onClose();
      navigate('/timeline');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTrip = (id: string) => {
    setCurrentTrip(id);
    onClose();
    navigate('/timeline');
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>My Trips</h2>
          <button onClick={onClose} style={{ color: 'var(--sys-label-secondary)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="trip-mini-list">
            {trips.map(trip => (
              <div 
                key={trip.id} 
                className={`trip-pill ${currentTripId === trip.id ? 'active' : ''}`}
                onClick={() => handleSelectTrip(trip.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trip.title}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>
                    {trip.items.length} {trip.items.length === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('Delete this trip?')) deleteTrip(trip.id); }}
                  className="delete-mini-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button className="add-trip-pill" onClick={() => setIsAdding(true)}>
            <Plus size={20} />
            <span>New Trip</span>
          </button>
          <div style={{ padding: '24px 0 10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sys-label-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appearance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={() => setTheme('default')} 
                style={{ background: theme === 'default' ? 'var(--sys-blue)' : 'rgba(255,255,255,0.06)', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, transition: '0.2s', border: theme === 'default' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
              >Default</button>
              <button 
                onClick={() => setTheme('sunset')} 
                style={{ background: theme === 'sunset' ? '#FF9F0A' : 'rgba(255,255,255,0.06)', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, transition: '0.2s', border: theme === 'sunset' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
              >Sunset</button>
              <button 
                onClick={() => setTheme('midnight')} 
                style={{ background: theme === 'midnight' ? '#5E5CE6' : 'rgba(255,255,255,0.06)', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, transition: '0.2s', border: theme === 'midnight' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
              >Midnight</button>
              <button 
                onClick={() => setTheme('forest')} 
                style={{ background: theme === 'forest' ? '#34C759' : 'rgba(255,255,255,0.06)', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, transition: '0.2s', border: theme === 'forest' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent' }}
              >Forest</button>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button onClick={() => auth.signOut()} className="logout-pill">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        {isAdding && (
          <div className="modal-backdrop" style={{ zIndex: 6000 }} onClick={() => setIsAdding(false)}>
            <div className="modal-sheet" style={{ maxWidth: '400px', marginBottom: 'auto', marginTop: '100px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-pull-indicator" />
              <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Plan New Trip</h2>
              <form onSubmit={handleAddTrip}>
                <div className="edit-field-group">
                  <label className="edit-field-label">Trip Name</label>
                  <input 
                    autoFocus
                    className="edit-field-input"
                    type="text" 
                    placeholder="e.g. Rome 2025"
                    value={newTripTitle}
                    onChange={e => setNewTripTitle(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--sys-bg-elevated-2)', color: '#fff' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#fff', color: '#000', fontWeight: 700 }}>Create Trip</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
