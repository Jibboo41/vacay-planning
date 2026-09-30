import { useState, useMemo } from 'react';
import { MapPin, Sparkles, Loader, ArrowRight, Gauge, Ruler, Activity, Timer, CalendarPlus } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import { getItemTone, getItemTypeMeta } from '../core/itemTypes';
import { startNewItem } from '../store/itemActions';
import Linkified from './Linkified';
import { Badge, Button, Card, EmptyState, ScreenHeader } from './ui';

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
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeLabel(dateString: string) {
  if (!dateString.includes('T')) return '';
  return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface SummaryItemProps {
  item: SummaryRenderItem;
  isCheckout?: boolean;
}

interface SummaryRenderItem extends ItineraryItem {
  _renderDate: string;
  _isBase?: boolean;
  _isCheckout?: boolean;
  _segments?: SummaryRenderItem[];
}

interface DayGroup {
  dateKey: string;
  label: string;
  items: SummaryRenderItem[];
}

function SummaryItemCard({ item, isCheckout = false }: SummaryItemProps) {
  const meta = getItemTypeMeta(item);
  const tone = getItemTone(item, isCheckout);
  const Icon = meta.icon;
  
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
  <div className="mb-3 flex">
      {/* Icon Column */}
    <div className="mr-3 flex shrink-0 flex-col items-center">
      <div className={`z-[1] flex size-8 items-center justify-center rounded-full shadow-sm ${tone.bgClass} ${tone.textClass}`}>
        <Icon size={16} />
        </div>
      </div>

      {/* Content Column */}
    <Card variant="inset" padding="sm" className="flex-1 border-transparent bg-white/[0.02]">
        {timeText && (
        <Badge tone="custom" size="sm" className={`mb-1 px-0 py-0 ${tone.textClass} bg-transparent`}>
            {timeText}
        </Badge>
        )}
      <h3 className="m-0 text-[15px] font-bold text-white">
          {item._segments ? `${item._segments.length} Flight segments` : item.title}
        </h3>
        
        {item._segments ? (
        <div className="mt-2 flex flex-col gap-1.5">
            {item._segments.map((seg, idx) => (
            <div key={seg.id} className="flex items-center gap-2 text-[13px] text-label-secondary">
              <div className="size-1 rounded-full bg-sys-blue/50" />
                <span>{seg.title}</span>
                {idx < (item._segments?.length || 0) - 1 && <ArrowRight size={12} opacity={0.3} />}
              </div>
            ))}
          </div>
        ) : item.location.name && (
        <div className="mb-1 flex items-start text-[13px] text-label-tertiary">
          <MapPin size={12} className="mr-1 mt-0.5 shrink-0" />
          <span className="leading-[1.4]">{item.location.name}</span>
          </div>
        )}

        {/* Hike Details */}
        {item.type === 'hiking' && item.hikeDetails && (
        <div className="mt-1.5 flex gap-3 text-[12px] font-semibold text-type-hike">
          <div className="flex items-center gap-1">
            <Gauge size={12} /> {item.hikeDetails.difficulty.toUpperCase()}
            </div>
            {item.hikeDetails.distance && (
            <div className="flex items-center gap-1">
                <Ruler size={12} /> {item.hikeDetails.distance}
              </div>
            )}
            {item.hikeDetails.elevation && (
            <div className="flex items-center gap-1">
                <Activity size={12} /> {item.hikeDetails.elevation}
              </div>
            )}
            {item.hikeDetails.duration && (
            <div className="flex items-center gap-1">
                <Timer size={12} /> {item.hikeDetails.duration}
              </div>
            )}
          </div>
        )}

        {/* Note Description (Specific to Summary) */}
        {item.type === 'note' && item.description && (
          <div className="mt-1.5 border-t border-white/5 pt-1.5 text-[13px] leading-[1.5] text-label-secondary">
            <Linkified text={item.description} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SummaryScreen() {
  const { items, currentTripAiSummary, saveAiSummary, weather } = useTripStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const dayGroups = useMemo(() => {
    if (items.length === 0) return [];
    
    // 1. Flatten all events including virtual checkouts/returns
    const flattened: SummaryRenderItem[] = [];
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

    const groups: DayGroup[] = [];
    
    // Iterate day by day from minKey to maxKey
    const current = new Date(minKey.replace(/-/g, '/'));
    const end = new Date(maxKey.replace(/-/g, '/'));

    // Security break to prevent infinite loop
    let safety = 0;
    while (current <= end && safety < 100) {
      safety++;
      const key = getDayKey(current.toISOString().split('T')[0]);
      const label = getDayLabel(current.toISOString().split('T')[0]);
      
      const dayItems = flattened.filter(i => getDayKey(i._renderDate) === key)
        .sort((a, b) => {
          // Independent sort orders: checkouts use endSortOrder
          const aOrder = a._isCheckout ? (a.endSortOrder ?? a.sortOrder ?? 0) : (a.sortOrder ?? 0);
          const bOrder = b._isCheckout ? (b.endSortOrder ?? b.sortOrder ?? 0) : (b.sortOrder ?? 0);
          
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a._renderDate.localeCompare(b._renderDate);
        });

      groups.push({ dateKey: key, label, items: dayItems });
      current.setDate(current.getDate() + 1);
    }

    // 3. Post-Process Flight Grouping
    return groups.map(group => {
      const grouped: SummaryRenderItem[] = [];
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
  }, [items]);

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      addDebugLog('AI Summary', 'Exception: ' + message);
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen">
      <ScreenHeader title="Trip Outline" subtitle="READ-ONLY SUMMARY" />

      <main className="relative px-5 pb-[100px]">
        {dayGroups.length === 0 ? (
          <Card className="mt-5">
            <EmptyState
              icon={<CalendarPlus size={32} />}
              title="No itinerary items yet"
              description="Start building your trip outline by adding your first stop, stay, meal, or activity."
              action={(
                <Button onClick={startNewItem}>
                  <CalendarPlus size={18} />
                  Add your first item
                </Button>
              )}
            />
          </Card>
        ) : (
          <div className="relative mt-5">
            
            {/* The AI Summary Block */}
            <Card className="mb-5 border-sys-blue/20 bg-sys-blue/10 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={20} className="text-sys-blue" />
                <h2 className="m-0 text-[16px] font-bold text-sys-blue">AI Trip Synopsis</h2>
              </div>
              
              {currentTripAiSummary ? (
                <>
                  <div className="text-[15px] leading-[1.6] text-label">
                    <Linkified text={currentTripAiSummary} />
                  </div>
                  <button onClick={handleGenerateSummary} disabled={isGenerating} className="btn-glass-blue mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px]">
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </>
              ) : (
                <div className="py-2.5 text-center">
                  <p className="mb-4 text-[14px] text-label-secondary">Generate a magical summary of this trip outline using AI.</p>
                  <button onClick={handleGenerateSummary} disabled={isGenerating || items.length === 0} className="btn-glass-blue inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[14px]">
                    {isGenerating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isGenerating ? 'Synthesizing...' : 'Generate Summary'}
                  </button>
                </div>
              )}
            </Card>

            {dayGroups.map((group, groupIdx) => {
              const dayForecasts = weather?.forecast?.filter(w => w.date === group.dateKey) || [];
              const high = dayForecasts.length > 0 ? Math.max(...dayForecasts.map(w => w.tempHigh)) : null;
              const low = dayForecasts.length > 0 ? Math.min(...dayForecasts.map(w => w.tempLow)) : null;
              
              return (
                <Card key={group.dateKey} className="mb-4 p-4">
                  <div className="mb-3 flex items-center border-b border-white/5 pb-3">
                    <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-[13px] font-extrabold text-white">
                      {groupIdx + 1}
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <h2 className="m-0 truncate text-[17px] font-extrabold tracking-[0.2px] text-white">
                        {group.label}
                      </h2>
                    </div>
                    {high !== null && low !== null && (
                      <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[13px] font-extrabold text-sys-orange">H: {Math.round(high)}°</span>
                          <span className="text-caption font-bold text-sys-blue">L: {Math.round(low)}°</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-1">
                    {group.items.map((item, idx) => (
                      <SummaryItemCard key={item.id + (item._isCheckout ? '-out' + idx : '-' + idx)} item={item} isCheckout={item._isCheckout} />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
