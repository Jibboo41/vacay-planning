import React, { useState, useMemo } from 'react';
import { Menu, Navigation, Plane, BedDouble, MountainSnow, TrainFront, Utensils, StickyNote, CalendarClock, MapPin, Sparkles, Loader } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import Linkified from './Linkified';

function getDayKey(dateString: string) {
  if (!dateString) return '';
  // Force local interpretation to avoid day-skipping
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayLabel(dateString: string) {
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeLabel(dateString: string) {
  if (!dateString.includes('T')) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface SummaryItemProps {
  item: ItineraryItem;
  isCheckout?: boolean;
}

function SummaryItemCard({ item, isCheckout }: SummaryItemProps) {
  const getTheme = () => {
    switch (item.type) {
      case 'flight':   return { icon: <Plane size={20} />, color: '#0A84FF', bg: 'rgba(10, 132, 255, 0.1)' };
      case 'hotel':    return { icon: <BedDouble size={20} />, color: isCheckout ? '#FF3B30' : '#30D158', bg: isCheckout ? 'rgba(255, 59, 48, 0.1)' : 'rgba(48, 209, 88, 0.1)' };
      case 'activity': return { icon: <Navigation size={20} />, color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.1)' };
      case 'hiking':   return { icon: <MountainSnow size={20} />, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' };
      case 'transit':  return { icon: <TrainFront size={20} />, color: '#5E5CE6', bg: 'rgba(94, 92, 230, 0.1)' };
      case 'food':     return { icon: <Utensils size={20} />, color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.1)' };
      case 'note':     return { icon: <StickyNote size={20} />, color: '#FFD60A', bg: 'rgba(255, 214, 10, 0.1)' };
      default:         return { icon: <CalendarClock size={20} />, color: '#EBEBF5', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const theme = getTheme();
  
  // Custom logic for times and spans
  let timeText = '';
  if (item.type === 'food') {
    timeText = item.foodDetails?.mealType?.toUpperCase() || 'DINING';
  } else if (item.type === 'flight') {
    if (item.startDate.includes('T')) timeText = `TAKEOFF • ${getTimeLabel(item.startDate)}`;
    if (item.endDate && item.endDate.includes('T')) timeText += ` | LANDING • ${getTimeLabel(item.endDate)}`;
  } else if (item.type === 'hotel') {
    if (isCheckout) {
      timeText = `CHECK-OUT${item.endDate && item.endDate.includes('T') ? ` • ${getTimeLabel(item.endDate)}` : ''}`;
    } else {
      let nightsStr = '';
      if (item.endDate) {
        const nDays = Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));
        if (nDays > 0) nightsStr = ` (${nDays} ${nDays === 1 ? 'night' : 'nights'})`;
      }
      timeText = `CHECK-IN${item.startDate.includes('T') ? ` • ${getTimeLabel(item.startDate)}` : ''}${nightsStr}`;
    }
  } else if (item.type === 'rental-car') {
    if (isCheckout) {
      timeText = `RETURN${item.endDate && item.endDate.includes('T') ? ` • ${getTimeLabel(item.endDate)}` : ''}`;
    } else {
      timeText = `PICKUP${item.startDate.includes('T') ? ` • ${getTimeLabel(item.startDate)}` : ''}`;
    }
  } else {
    // Normal activity
    if (item.startDate.includes('T')) {
      timeText = `START • ${getTimeLabel(item.startDate)}`;
      if (item.endDate && item.endDate.includes('T')) {
         const isSameDay = getDayKey(item.startDate) === getDayKey(item.endDate);
         if (isSameDay) timeText += ` | END • ${getTimeLabel(item.endDate)}`;
      }
    }
  }

  return (
    <div style={{ display: 'flex', marginBottom: '12px' }}>
      {/* Icon Column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '12px', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {React.cloneElement(theme.icon as React.ReactElement<any>, { size: 16 })}
        </div>
      </div>

      {/* Content Column */}
      <div style={{ flex: 1, padding: '8px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
        {timeText && (
          <div style={{ fontSize: '10px', fontWeight: 800, color: theme.color, letterSpacing: '0.05em', marginBottom: '2px' }}>
            {timeText}
          </div>
        )}
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', margin: '0' }}>
          {item.title}
        </h3>
        
        {item.location.name && (
          <div style={{ display: 'flex', alignItems: 'flex-start', color: 'var(--sys-label-tertiary)', fontSize: '13px', marginBottom: '0px' }}>
            <MapPin size={12} style={{ marginTop: '2px', marginRight: '4px', flexShrink: 0 }} />
            <span style={{ lineHeight: '1.4' }}>{item.location.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryScreen() {
  const { items, setSidebarOpen, currentTripAiSummary, saveAiSummary, weather } = useTripStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const dayGroups = useMemo(() => {
    if (items.length === 0) return [];
    
    // ... logic for flattened and groups remains same (omitted for brevity in replace call)

    // 1. Flatten all events including virtual checkouts/returns
    const flattened: any[] = [];
    items.forEach(item => {
      flattened.push({ ...item, _renderDate: item.startDate, _isBase: true });
      if (item.endDate && (item.type === 'hotel' || item.type === 'rental-car')) {
        const startKey = getDayKey(item.startDate);
        const endKey = getDayKey(item.endDate);
        if (startKey !== endKey) {
          flattened.push({ ...item, _renderDate: item.endDate, _isCheckout: true });
        }
      }
    });

    // 2. Find full trip range
    const allDates = flattened.map(i => i._renderDate);
    // Use ISO strings for sorting to find min/max
    const sortedDateStrings = [...allDates].sort();
    const minKey = getDayKey(sortedDateStrings[0]);
    const maxKey = getDayKey(sortedDateStrings[sortedDateStrings.length - 1]);

    const groups: { dateKey: string; label: string; items: any[] }[] = [];
    
    // Iterate day by day from minKey to maxKey
    let current = new Date(minKey.replace(/-/g, '/'));
    const end = new Date(maxKey.replace(/-/g, '/'));

    // Security break to prevent infinite loop
    let safety = 0;
    while (current <= end && safety < 100) {
      safety++;
      const key = getDayKey(current.toISOString().split('T')[0]);
      const label = getDayLabel(current.toISOString().split('T')[0]);
      
      const dayItems = flattened.filter(i => getDayKey(i._renderDate) === key)
        .sort((a, b) => {
          // Sort checkouts by time if available, otherwise sortOrder
          if (a._renderDate.includes('T') && b._renderDate.includes('T')) {
            return a._renderDate.localeCompare(b._renderDate);
          }
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder;
          return a._renderDate.localeCompare(b._renderDate);
        });

      groups.push({ dateKey: key, label, items: dayItems });
      current.setDate(current.getDate() + 1);
    }

    return groups;
  }, [items]);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : `http://${window.location.hostname}:3003`);
      const res = await fetch(`${API_BASE_URL}/api/summarize-trip`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ items })
      });
      if (res.ok) {
         const data = await res.json();
         if (data.summary) {
           await saveAiSummary(data.summary);
         }
      } else {
         console.error('Failed to generate summary');
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="screen-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Trip Outline</h1>
          <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>READ-ONLY SUMMARY</div>
        </div>
        <div style={{ width: 44 }} /> {/* Balance header */}
      </header>

      <main style={{ padding: '0 20px 100px 20px', position: 'relative' }}>
        {dayGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>No items in your itinerary yet.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', marginTop: '20px' }}>
            
            {/* The AI Summary Block */}
            <div style={{ background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                <Sparkles size={20} color="#0A84FF" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0A84FF', margin: 0 }}>AI Trip Synopsis</h2>
              </div>
              
              {currentTripAiSummary ? (
                <>
                  <div style={{ color: 'var(--sys-label-primary)', fontSize: '15px', lineHeight: '1.6' }}>
                    <Linkified text={currentTripAiSummary} />
                  </div>
                  <button onClick={handleGenerateSummary} disabled={isGenerating} className="btn-glass-blue" style={{ marginTop: '16px', fontSize: '13px', padding: '6px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ color: 'var(--sys-label-secondary)', fontSize: '14px', marginBottom: '16px' }}>Generate a magical summary of this trip outline using AI.</p>
                  <button onClick={handleGenerateSummary} disabled={isGenerating || items.length === 0} className="btn-glass-blue" style={{ fontSize: '14px', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {isGenerating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                    {isGenerating ? 'Synthesizing...' : 'Generate Summary'}
                  </button>
                </div>
              )}
            </div>

            {dayGroups.map((group, groupIdx) => {
              const dayWeather = weather?.forecast?.find(w => w.date === group.dateKey);
              return (
                <div key={group.dateKey} style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: '13px', fontWeight: 800 }}>
                      {groupIdx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: '12px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', margin: 0, letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.label}
                      </h2>
                    </div>
                    {dayWeather && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }} title={dayWeather.condition}>
                          {dayWeather.icon}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{Math.round(dayWeather.tempHigh)}°</span>
                          <span style={{ fontSize: '10px', color: 'var(--sys-label-secondary)', fontWeight: 700 }}>{Math.round(dayWeather.tempLow)}°</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: '4px' }}>
                    {group.items.map((item, idx) => (
                      <SummaryItemCard key={item.id + (item._isCheckout ? '-out' + idx : '-' + idx)} item={item as ItineraryItem} isCheckout={item._isCheckout} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
