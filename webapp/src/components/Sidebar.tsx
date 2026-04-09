import React from 'react';
import { useTripStore } from '../store/useTripStore';
import { Plus, Trash2, LogOut, X, Layout, Sunrise, Moon, TreePine, Sparkles, Flower2, Waves, Flame, Flower, Zap } from 'lucide-react';
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

  const glassIconStyle = {
    color: 'rgba(255,255,255,0.9)',
    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))'
  };

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
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sys-label-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appearance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {([
                { key: 'default',   label: 'Default',     icon: <Layout size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)' },
                { key: 'sunset',    label: 'Sunset',      icon: <Sunrise size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #FF3B30 0%, #FF9F0A 50%, #FFD60A 100%)' },
                { key: 'midnight',  label: 'Midnight',    icon: <Moon size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #5E5CE6 0%, #BF5AF2 60%, #32ADE6 100%)' },
                { key: 'forest',    label: 'Forest',      icon: <TreePine size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #30D158 0%, #34C759 50%, #32ADE6 100%)' },
                { key: 'aurora',    label: 'Aurora',      icon: <Sparkles size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #00F5A0 0%, #8B5CF6 55%, #06B6D4 100%)' },
                { key: 'desert',    label: 'Desert Rose', icon: <Flower2 size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #E2A57E 0%, #C9415A 55%, #EDCA7F 100%)' },
                { key: 'ocean',     label: 'Deep Ocean',  icon: <Waves size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #0EA5E9 0%, #0D9488 50%, #6366F1 100%)' },
                { key: 'vulcan',    label: 'Vulcan',      icon: <Flame size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #FF4500 0%, #FF8C00 50%, #FF2D55 100%)' },
                { key: 'sakura',    label: 'Sakura',      icon: <Flower size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #FF85A2 0%, #D891EF 55%, #FFB6CE 100%)' },
                { key: 'cyberpunk', label: 'Cyberpunk',   icon: <Zap size={20} style={glassIconStyle} />, grad: 'linear-gradient(135deg, #FF00AA 0%, #00FFEA 55%, #FFE600 100%)' },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: theme === t.key ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
                    boxShadow: theme === t.key ? '0 0 18px rgba(255,255,255,0.25)' : 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    aspectRatio: '1.8',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: t.grad, opacity: 0.9 }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.25)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '4px'
                  }}>
                    {t.icon}
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{t.label}</span>
                  </div>
                  {theme === t.key && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
                  )}
                </button>
              ))}
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
