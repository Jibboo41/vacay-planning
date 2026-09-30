import { useState, useEffect, useMemo, useCallback } from 'react';
import { Thermometer, RefreshCw, AlertCircle, MapPin, Droplets, Snowflake, CloudSun, X, Plus } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem, WeatherDay } from '../core/models';
import { cn } from '../lib/cn';
import { startNewItem } from '../store/itemActions';
import { Button, Card, EmptyState, IconButton, Modal, ScreenHeader, Skeleton } from './ui';

type DailyWeatherLocation = { date: string; lat: number; lon: number; name: string };
type ItemWithCoordinates = ItineraryItem & {
  location: ItineraryItem['location'] & { latitude: number; longitude: number };
};

function hasCoordinates(item: ItineraryItem): item is ItemWithCoordinates {
  return typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number';
}

function getDayKey(dateString: string) {
  if (!dateString) return '';
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateString.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function WeatherScreen() {
  const { weather, items, refreshWeather, isWeatherRefreshing } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeatherDay | null>(null);

  const formatLastUpdated = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const dailyLocations = useMemo<DailyWeatherLocation[]>(() => {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const startStr = sorted[0].startDate.split('T')[0];
    let endStr = sorted[sorted.length - 1].startDate.split('T')[0];
    sorted.forEach(i => { if (i.endDate && i.endDate > endStr) endStr = i.endDate.split('T')[0]; });

    const startDate = new Date(startStr.replace(/-/g, '/'));
    const endDate = new Date(endStr.replace(/-/g, '/'));
    const dayLocations: DailyWeatherLocation[] = [];

    const curr = new Date(startDate);
    while (curr <= endDate) {
       const dateKey = curr.toISOString().split('T')[0];
       const dayItems = items.filter((i): i is ItemWithCoordinates =>
         (getDayKey(i.startDate) === dateKey || (i.endDate ? getDayKey(i.endDate) === dateKey : false)) &&
         (i.type === 'hotel' || i.type === 'hiking' || i.type === 'activity') &&
         hasCoordinates(i)
       );

       if (dayItems.length > 0) {
         dayItems.forEach(i => {
            if (hasCoordinates(i)) {
              dayLocations.push({ date: dateKey, lat: i.location.latitude, lon: i.location.longitude, name: i.location.name || 'Stop' });
            }
          });
       } else {
          const activeHotel = items.find(i => i.type === 'hotel' && getDayKey(i.startDate) <= dateKey && i.endDate && getDayKey(i.endDate) >= dateKey);
          if (activeHotel && hasCoordinates(activeHotel)) {
             dayLocations.push({ date: dateKey, lat: activeHotel.location.latitude, lon: activeHotel.location.longitude, name: activeHotel.location.name || 'Hotel' });
          } else {
             const prevItems = sorted.filter((i): i is ItemWithCoordinates => getDayKey(i.startDate) < dateKey && hasCoordinates(i));
             if (prevItems.length > 0) {
                const lastItem = prevItems[prevItems.length - 1];
                dayLocations.push({ date: dateKey, lat: lastItem.location.latitude, lon: lastItem.location.longitude, name: lastItem.location.name || 'Last Known' });
             }
          }
       }
       curr.setDate(curr.getDate() + 1);
    }

    const uniqueDayLocations: typeof dayLocations = [];
    dayLocations.forEach(dl => {
      const exists = uniqueDayLocations.some(u => u.date === dl.date && Math.abs(u.lat - dl.lat) < 0.001 && Math.abs(u.lon - dl.lon) < 0.001);
      if (!exists) uniqueDayLocations.push(dl);
    });
    return uniqueDayLocations;
  }, [items]);

  const handleUpdate = useCallback(async () => {
    if (dailyLocations.length === 0) {
      setError("No locations with coordinates found in your itinerary yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await refreshWeather();
    } catch {
      setError("Failed to fetch weather data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [dailyLocations.length, refreshWeather]);

  const selectedLocation = useMemo(() => {
    if (selectedDay?.lat === undefined) return undefined;
    const selectedLat = selectedDay.lat;
    return dailyLocations.find(dl => dl.date === selectedDay.date && Math.abs(dl.lat - selectedLat) < 0.001);
  }, [dailyLocations, selectedDay]);

  useEffect(() => {
    if (!weather && dailyLocations.length > 0) {
      handleUpdate();
    }
  }, [weather, dailyLocations.length, handleUpdate]);

  return (
    <div className="safe-area-inset relative min-h-screen">
      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        ariaLabel="Weather details"
        variant="center"
        hideClose
        className="w-full max-w-[400px] rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-elevated md:max-w-[400px]"
        bodyClassName="mx-0 flex flex-col items-center overflow-visible px-0"
      >
        {selectedDay && (
          <>
            <IconButton
              aria-label="Close weather details"
              round
              size="sm"
              className="absolute right-5 top-5 bg-white/10 text-label"
              onClick={() => setSelectedDay(null)}
            >
              <X size={20} />
            </IconButton>

            <span className="mb-2 text-caption font-extrabold uppercase tracking-[0.1em] text-sys-blue">
              {selectedDay.isHistorical ? 'Historical Average' : 'Live Forecast'}
            </span>

            <h2 className="mb-6 text-title font-extrabold text-label">
              {new Date(`${selectedDay.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            <div className="my-5 text-[80px] drop-shadow-lg">
              {selectedDay.isHistorical ? <CloudSun size={80} opacity={0.5} /> : (selectedDay.icon || '⛅')}
            </div>

            <div className="mb-8">
              <span className="text-[48px] font-extrabold text-label">{selectedDay.tempHigh}°</span>
              <span className="ml-3 text-title font-semibold text-label-secondary">/ {selectedDay.tempLow}°</span>
              <p className="mt-2 text-[16px] font-bold uppercase tracking-[0.05em] text-sys-blue">
                {selectedDay.isHistorical ? 'Normal Conditions' : selectedDay.condition}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-card bg-white/3 p-4">
                <div className="flex items-center justify-center gap-1.5 text-sys-teal">
                   <Droplets size={16} />
                   <span className="text-caption font-extrabold">RAIN</span>
                </div>
                <span className="text-[18px] font-extrabold text-label">{(selectedDay.rainfall || 0).toFixed(2)}&quot;</span>
              </div>
              <div className="flex flex-col gap-1 rounded-card bg-white/3 p-4">
                <div className="flex items-center justify-center gap-1.5 text-sys-gray">
                   <Snowflake size={16} />
                   <span className="text-caption font-extrabold">SNOW</span>
                </div>
                <span className="text-[18px] font-extrabold text-label">{(selectedDay.snowfall || 0).toFixed(2)}&quot;</span>
              </div>
            </div>

            {selectedLocation && (
              <div className="mt-6 flex items-center gap-2 text-label-secondary">
                 <MapPin size={14} />
                 <span className="text-footnote font-semibold">{selectedLocation.name}</span>
              </div>
            )}
          </>
        )}
      </Modal>

      <ScreenHeader
        title="Local Weather"
        subtitle={weather?.lastUpdated ? `Updated ${formatLastUpdated(weather.lastUpdated)}` : 'No sync data'}
        actions={(
          <IconButton
            aria-label="Refresh weather"
            variant="primary"
            className="rounded-[14px]"
            onClick={handleUpdate}
            disabled={loading || isWeatherRefreshing}
          >
            <RefreshCw size={20} className={(loading || isWeatherRefreshing) ? 'spinning' : ''} />
          </IconButton>
        )}
      />

      <div className="px-4 pt-4 pb-[120px]">
        {dailyLocations.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CloudSun size={32} />}
              title={items.length === 0 ? 'No itinerary items yet' : 'No forecast locations yet'}
              description={items.length === 0 ? 'Add your first itinerary item to start building a weather forecast.' : 'Add coordinates to a hotel, hike, or activity to see the weather forecast.'}
              action={(
                <Button onClick={startNewItem}>
                  <Plus size={18} />
                  {items.length === 0 ? 'Add your first item' : 'Add an itinerary item'}
                </Button>
              )}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
               <div className="flex items-center gap-3 rounded-2xl border border-sys-red/20 bg-sys-red/10 p-4 text-sys-red">
                  <AlertCircle size={20} />
                  <span className="text-[14px]">{error}</span>
               </div>
            )}

            {weather?.forecast.map(day => {
              const isHot = day.tempHigh > 80;
              const isCold = day.tempHigh < 50;
              const loc = dailyLocations.find(dl => dl.date === day.date && day.lat !== undefined && Math.abs(dl.lat - day.lat) < 0.001);
              const hasHistorical = !!day.isHistorical;
              const primaryIcon = day.icon || '⛅';

              return (
                <button
                  type="button"
                  key={`${day.date}-${day.lat}-${day.lon}`}
                  className={cn(
                    'clickable flex w-full select-none items-center gap-4 rounded-card border p-4 px-5 text-left shadow-glass backdrop-blur-glass',
                    'transition-[background-color,border-color,transform] duration-200 ease-ios hover:bg-white/8 motion-reduce:transition-none',
                    isHot && 'border-sys-orange/20 bg-sys-orange/8',
                    isCold && 'border-sys-blue/20 bg-sys-blue/8',
                    !isHot && !isCold && 'border-white/10 bg-white/4',
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-[18px] font-extrabold tracking-[-0.3px] text-label">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h4>
                      {hasHistorical && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-caption font-black tracking-[0.05em] text-label-tertiary">
                          HISTORICAL
                        </span>
                      )}
                    </div>
                    {loc && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-sys-blue/90">
                         <MapPin size={12} />
                         <span className="text-caption font-bold uppercase tracking-[0.08em]">
                            {loc.name}
                         </span>
                      </div>
                    )}
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-[10px] bg-white/5 px-2.5 py-1 text-body font-bold text-label">
                        <Thermometer size={14} className="text-sys-blue" /> {day.tempHigh}°
                      </div>
                      <span className="text-footnote font-semibold text-label-secondary">/ {day.tempLow}°</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <div className="flex h-12 items-center justify-end">
                      <span className="text-[32px] drop-shadow-md">
                        {hasHistorical ? <CloudSun size={28} opacity={0.5} /> : (primaryIcon)}
                      </span>
                    </div>
                    <p className={cn('text-caption font-black uppercase tracking-[0.1em]', isHot ? 'text-sys-orange' : isCold ? 'text-sys-blue' : 'text-label-secondary')}>
                      {day.isHistorical ? 'HISTORICAL AVG' : day.condition}
                    </p>
                    {day.isHistorical && (
                      <div className="mt-1 flex flex-col items-end gap-0.5">
                        {(day.rainfall || 0) > 0 && (
                          <div className="flex items-center gap-1 text-caption font-bold text-sys-teal">
                            <Droplets size={12} /> {day.rainfall?.toFixed(2)}&quot;
                          </div>
                        )}
                        {(day.snowfall || 0) > 0 && (
                          <div className="flex items-center gap-1 text-caption font-bold text-sys-gray">
                            <Snowflake size={12} /> {day.snowfall?.toFixed(2)}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {(!weather || loading) && (
              <div className="flex flex-col gap-4">
                {[1,2,3].map(i => (
                  <Skeleton key={i} className="h-[100px] rounded-panel opacity-10" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
