import React, { useState, useMemo } from 'react';
import { Menu, Navigation, Plane, BedDouble, MountainSnow, TrainFront, Utensils, StickyNote, CalendarClock, MapPin, Sparkles, Loader, Car, ArrowRight, Gauge, Ruler, Activity, Timer, Star } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import Linkified from './Linkified';
import { timelineDates } from '../core/timelineDetails';

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
  if (!dateString) return 'Date TBD';
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return 'Date TBD';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getTimeLabel(dateString: string) {
  if (!dateString.includes('T')) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface SummaryItemProps {
  item: ItineraryItem & { _segments?: ItineraryItem[] };
  isCheckout?: boolean;
}

function SummaryItemCard({ item, isCheckout }: SummaryItemProps) {
  const getTheme = () => {
    switch (item.type) {
      case 'flight':     return { icon: <Plane size={20} />, color: 'var(--sys-blue)', bg: 'rgba(10, 132, 255, 0.1)' };
      case 'hotel':      return { icon: <BedDouble size={20} />, color: isCheckout ? 'var(--sys-red-alt)' : 'var(--sys-orange)', bg: isCheckout ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 159, 10, 0.1)' };
      case 'rental-car': return { icon: <Car size={20} />, color: 'var(--sys-cyan)', bg: 'rgba(100, 210, 255, 0.1)' };
      case 'activity':   return { icon: <Navigation size={20} />, color: 'var(--sys-label-primary)', bg: 'rgba(var(--neutral-rgb), 0.05)' };
      case 'hiking':     return { icon: <MountainSnow size={20} />, color: 'var(--sys-green)', bg: 'rgba(48, 209, 88, 0.1)' };
      case 'transit':    return { icon: <TrainFront size={20} />, color: 'var(--sys-indigo)', bg: 'rgba(94, 92, 230, 0.1)' };
      case 'food':       return { icon: <Utensils size={20} />, color: 'var(--sys-purple)', bg: 'rgba(191, 90, 242, 0.1)' };
      case 'note':       return { icon: <StickyNote size={20} />, color: 'var(--sys-gray)', bg: 'rgba(142, 142, 147, 0.1)' };
      default:           return { icon: <CalendarClock size={20} />, color: 'var(--sys-label-primary)', bg: 'rgba(var(--neutral-rgb), 0.05)' };
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
  } else if (item.type === 'note') {
    timeText = ''; // Notes don't need "START" or times on summary
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

  // Handle Flight Grouping khusus
  if (item._segments && item._segments.length > 0) {
    const first = item._segments[0];
    const last = item._segments[item._segments.length - 1];
    timeText = `TAKEOFF • ${getTimeLabel(first.startDate)}`;
    if (last.endDate && last.endDate.includes('T')) {
      timeText += ` | LANDING • ${getTimeLabel(last.endDate)}`;
    }
  }

  return (
    <div className="summary-item">
      {/* Icon Column */}
      <div className="summary-item__icon" style={{ backgroundColor: theme.bg, color: theme.color }}>
        {React.cloneElement(theme.icon as React.ReactElement<any>, { size: 16 })}
      </div>

      {/* Content Column */}
      <div className="summary-item__main">
        {timeText && (
          <div className="summary-item__time" style={{ color: theme.color }}>
            {timeText}
          </div>
        )}
        <h3 className="summary-item__title">
          {item._segments ? `${item._segments.length} Flight segments` : item.title}
          {item.isStarred && <Star size={14} fill="var(--sys-gold)" color="var(--sys-gold)" />}
        </h3>

        {item._segments ? (
          <div className="summary-item__segments">
            {item._segments.map((seg, idx) => (
              <div key={seg.id}>
                <i />
                <span>{seg.title}</span>
                {idx < (item._segments?.length || 0) - 1 && <ArrowRight size={12} opacity={0.3} />}
              </div>
            ))}
          </div>
        ) : item.location.name && (
          <div className="summary-item__location">
            <MapPin size={12} />
            <span>{item.location.name}</span>
          </div>
        )}

        {/* Hike Details */}
        {item.type === 'hiking' && item.hikeDetails && (
          <div className="summary-item__stats">
            <div>
              <Gauge size={12} /> {(item.hikeDetails as any).difficulty.toUpperCase()}
            </div>
            {item.hikeDetails.distance && (
              <div>
                <Ruler size={12} /> {item.hikeDetails.distance}
              </div>
            )}
            {item.hikeDetails.elevation && (
              <div>
                <Activity size={12} /> {item.hikeDetails.elevation}
              </div>
            )}
            {item.hikeDetails.duration && (
              <div>
                <Timer size={12} /> {item.hikeDetails.duration}
              </div>
            )}
          </div>
        )}

        {/* Note Description (Specific to Summary) */}
        {item.type === 'note' && item.description && (
          <div className="summary-item__note">
            <Linkified text={item.description} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryScreen() {
  const { items, dayDescriptions, setSidebarOpen, currentTripAiSummary, saveAiSummary, weather } = useTripStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const dayGroups = useMemo(() => {
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

    // Include days that only have an overview and use timezone-safe calendar dates.
    const dates = timelineDates(items.flatMap(item => [getDayKey(item.startDate), ...(item.endDate ? [getDayKey(item.endDate)] : [])]), dayDescriptions);
    const groups: { dateKey: string; label: string; items: any[] }[] = [];
    for (const key of dates) {
      const label = getDayLabel(key);
      const dayItems = flattened.filter(i => getDayKey(i._renderDate) === key)
        .sort((a, b) => {
          // Independent sort orders: checkouts use endSortOrder
          const aOrder = a._isCheckout ? (a.endSortOrder ?? a.sortOrder ?? 0) : (a.sortOrder ?? 0);
          const bOrder = b._isCheckout ? (b.endSortOrder ?? b.sortOrder ?? 0) : (b.sortOrder ?? 0);
          
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a._renderDate.localeCompare(b._renderDate);
        });

      groups.push({ dateKey: key, label, items: dayItems });
    }

    // 3. Post-Process Flight Grouping
    return groups.map(group => {
      const grouped: any[] = [];
      group.items.forEach(item => {
        const last = grouped[grouped.length - 1];
        // Combine if: both are flights, neither is a virtual checkout, and they are back-to-back
        if (item.type === 'flight' && last && last.type === 'flight' && !last._isCheckout && !item._isCheckout) {
          if (!last._segments) {
             // Turn last into a container
             const original = { ...last };
             last._segments = [original];
          }
          last._segments.push(item);
          // Optional: Update last._renderDate to earliest and last.endDate to latest if needed, 
          // but sorting already puts them in order.
        } else {
          grouped.push(item);
        }
      });
      return { ...group, items: grouped };
    });
  }, [items, dayDescriptions]);

  const handleGenerateSummary = async () => {
    const { addDebugLog } = useTripStore.getState();
    addDebugLog('AI Summary', 'Starting generation...');
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
           addDebugLog('AI Summary', 'Success!', { length: data.summary.length });
           await saveAiSummary(data.summary);
         } else {
           addDebugLog('AI Summary', 'Error: No summary in response', data);
         }
      } else {
         addDebugLog('AI Summary', 'Failed: ' + res.statusText);
         console.error('Failed to generate summary');
      }
    } catch (e: any) {
      addDebugLog('AI Summary', 'Exception: ' + e.message);
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Trip Outline</h1>
          <p className="page-subtitle">Read-only summary</p>
        </div>
      </header>

      <main className="screen-body">
        {dayGroups.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">No items in your itinerary yet.</p>
          </div>
        ) : (
          <div className="summary-stack">

            {/* The AI Summary Block */}
            <div className="ai-panel">
              <div className="ai-panel__heading">
                <Sparkles size={18} />
                <h2>AI Trip Synopsis</h2>
              </div>

              {currentTripAiSummary ? (
                <>
                  <div className="ai-panel__text">
                    <Linkified text={currentTripAiSummary} />
                  </div>
                  <button onClick={handleGenerateSummary} disabled={isGenerating} className="btn btn--tonal btn--sm ai-panel__action">
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </>
              ) : (
                <div className="ai-panel__empty">
                  <p>Generate a magical summary of this trip outline using AI.</p>
                  <button onClick={handleGenerateSummary} disabled={isGenerating || items.length === 0} className="btn btn--primary">
                    {isGenerating ? <Loader size={16} className="spinning" /> : <Sparkles size={16} />}
                    {isGenerating ? 'Synthesizing...' : 'Generate Summary'}
                  </button>
                </div>
              )}
            </div>

            {dayGroups.map((group, groupIdx) => {
              const dayForecasts = weather?.forecast?.filter(w => w.date === group.dateKey) || [];
              const high = dayForecasts.length > 0 ? Math.max(...dayForecasts.map(w => w.tempHigh)) : null;
              const low = dayForecasts.length > 0 ? Math.min(...dayForecasts.map(w => w.tempLow)) : null;
              
              return (
                <div className="card summary-day-card" key={group.dateKey}>
                  <div className="summary-day-card__header">
                    <div className="summary-day-card__index">
                      {groupIdx + 1}
                    </div>
                    <h2 className="summary-day-card__title">
                      {group.label}
                    </h2>
                    {high !== null && low !== null && (
                      <span className="day-section-temps">
                        <span className="temp-high">H: {Math.round(high)}°</span>
                        <span className="temp-low">L: {Math.round(low)}°</span>
                      </span>
                    )}
                  </div>
                  {dayDescriptions[group.dateKey] && <p className="summary-day-description">{dayDescriptions[group.dateKey]}</p>}
                  <div className="summary-day-card__items">
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
