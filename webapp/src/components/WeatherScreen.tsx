import { useState, useEffect } from 'react';
import { Thermometer, RefreshCw, AlertCircle, Menu, MapPin, Droplets, Snowflake, CloudSun } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { fetchWeather } from '../data/weatherApi';
import type { WeatherDay } from '../core/models';

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
  const { weather, items, updateWeather, setSidebarOpen } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Determine ALL relevant locations for every single day of the trip
  const getDailyLocations = () => {
    if (!items.length) return [];
    
    // Sort items by time
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    
    // Find absolute start and end
    const startStr = sorted[0].startDate.split('T')[0];
    let endStr = sorted[sorted.length - 1].startDate.split('T')[0];
    sorted.forEach(i => {
       if (i.endDate && i.endDate > endStr) endStr = i.endDate.split('T')[0];
    });

    const startDate = new Date(startStr.replace(/-/g, '/'));
    const endDate = new Date(endStr.replace(/-/g, '/'));
    
    const dayLocations: { date: string; lat: number; lon: number; name: string }[] = [];
    
    // Iterate through every day in the trip range
    const curr = new Date(startDate);
    while (curr <= endDate) {
       const dateKey = curr.toISOString().split('T')[0];
       
       // Priority 1: All items on this day that are hotels, hikes, or activities with coords
       const dayItems = items.filter(i => 
         (getDayKey(i.startDate) === dateKey || (i.endDate && getDayKey(i.endDate) === dateKey)) &&
         (i.type === 'hotel' || i.type === 'hiking' || i.type === 'hike' || i.type === 'activity') &&
         i.location.latitude !== null && i.location.longitude !== null
       );

       if (dayItems.length > 0) {
          dayItems.forEach(i => {
            // Add start date location
            if (getDayKey(i.startDate) === dateKey && i.location.latitude !== null) {
              dayLocations.push({ 
                date: dateKey, 
                lat: i.location.latitude!, 
                lon: i.location.longitude!, 
                name: i.location.name || 'Current Stop'
              });
            }
            // Add end date location if it's a different day (e.g. Hotel Checkout)
            if (i.endDate && getDayKey(i.endDate) === dateKey && i.location.latitude !== null) {
              dayLocations.push({ 
                date: dateKey, 
                lat: i.location.latitude!, 
                lon: i.location.longitude!, 
                name: i.location.name || 'Current Stop'
              });
            }
          });
       } else {
          // Priority 2: Active hotel stay spanning this day
          const activeHotel = items.find(i => 
             i.type === 'hotel' && 
             i.location.latitude !== null && 
             getDayKey(i.startDate) <= dateKey && 
             i.endDate && getDayKey(i.endDate) >= dateKey
          );
          
          if (activeHotel) {
             dayLocations.push({ 
               date: dateKey, 
               lat: activeHotel.location.latitude!, 
               lon: activeHotel.location.longitude!, 
               name: activeHotel.location.name || 'Hotel Location'
             });
          } else {
             // Priority 3: Last known location
             const prevItems = sorted.filter(i => getDayKey(i.startDate) < dateKey && i.location.latitude !== null);
             if (prevItems.length > 0) {
                const lastItem = prevItems[prevItems.length - 1];
                dayLocations.push({ 
                  date: dateKey, 
                  lat: lastItem.location.latitude!, 
                  lon: lastItem.location.longitude!, 
                  name: lastItem.location.name || 'Last Known'
                });
             } else {
                // Priority 4: Next known location
                const nextItems = sorted.filter(i => getDayKey(i.startDate) > dateKey && i.location.latitude !== null);
                if (nextItems.length > 0) {
                   const firstNext = nextItems[0];
                   dayLocations.push({ 
                     date: dateKey, 
                     lat: firstNext.location.latitude!, 
                     lon: firstNext.location.longitude!, 
                     name: firstNext.location.name || 'Upcoming'
                   });
                }
             }
          }
       }
       
       curr.setDate(curr.getDate() + 1);
    }
    
    // Deduplicate same-day, same-location entries
    const uniqueDayLocations: typeof dayLocations = [];
    dayLocations.forEach(dl => {
      const exists = uniqueDayLocations.some(u => 
        u.date === dl.date && 
        u.lat.toFixed(4) === dl.lat.toFixed(4) && 
        u.lon.toFixed(4) === dl.lon.toFixed(4)
      );
      if (!exists) uniqueDayLocations.push(dl);
    });

    return uniqueDayLocations;
  };

  const dailyLocations = getDailyLocations();

  const handleUpdate = async () => {
    if (dailyLocations.length === 0) {
      setError("No locations with coordinates found in your itinerary yet.");
      return;
    }
    setLoading(true);
    const { addDebugLog } = useTripStore.getState();
    try {
      addDebugLog('Weather', `Fetching for ${dailyLocations.length} days...`);
      // To optimize, group days by location so we don't call the API for the same город many times
      const locationGroups: Record<string, string[]> = {};
      const coordMap: Record<string, { lat: number; lon: number; name: string }> = {};
      
      dailyLocations.forEach(dl => {
         const key = `${dl.lat.toFixed(3)},${dl.lon.toFixed(3)}`;
         if (!locationGroups[key]) {
            locationGroups[key] = [];
            coordMap[key] = { lat: dl.lat, lon: dl.lon, name: dl.name };
         }
         locationGroups[key].push(dl.date);
      });

      const allForecasts: WeatherDay[] = [];
      
      // Fetch each location's range
      for (const key of Object.keys(locationGroups)) {
         const dates = locationGroups[key].sort();
         const start = dates[0];
         const end = dates[dates.length - 1];
         const { lat, lon } = coordMap[key];
         
         const results = await fetchWeather(lat, lon, start, end);
         addDebugLog('Weather', `API Success for ${coordMap[key].name}`, { dates: results.length });
         // Filter to only the specific dates we mapped to this location
         results.forEach(r => {
            if (dates.includes(r.date)) {
               allForecasts.push(r);
            }
         });
      }

      // Sort by date
      allForecasts.sort((a, b) => a.date.localeCompare(b.date));

      if (allForecasts.length === 0) {
        addDebugLog('Weather', 'No results returned');
        setError("Weather forecast not available for these dates (likely too far in the future).");
        return;
      }

      await updateWeather({
        lastUpdated: Date.now(),
        forecast: allForecasts
      });
      addDebugLog('Weather', 'Store updated successfully', { count: allForecasts.length });
    } catch (err: any) {
      addDebugLog('Weather', `Fetch FAILED: ${err.message}`);
      setError("Failed to fetch weather data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch if none exists
  useEffect(() => {
    if (!weather && dailyLocations.length > 0) {
      handleUpdate();
    }
  }, [items.length]); // Re-calculates if items change significantly


  return (
    <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="screen-header">
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFF', margin: 0 }}>
            Local Weather
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {weather?.forecast.length ? `Itinerary Forecast` : 'No data'}
          </p>
        </div>
        <button 
          className="header-icon-btn btn-glass-blue"
          style={{ borderRadius: '14px', marginLeft: 'auto' }}
          onClick={handleUpdate}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
        </button>
      </header>

      <div style={{ padding: '16px', paddingBottom: '120px' }}>
        {dailyLocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AlertCircle size={48} opacity={0.2} />
            <p style={{ fontSize: '15px' }}>Add a location with coordinates to see the weather forecast.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {error && (
               <div style={{ padding: '16px', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '16px', border: '1px solid rgba(255, 69, 58, 0.2)', display: 'flex', gap: '12px', alignItems: 'center', color: '#FF453A' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontSize: '14px' }}>{error}</span>
               </div>
            )}

            {weather?.forecast.map(day => {
              const isHot = day.tempHigh > 80;
              const isCold = day.tempHigh < 50;
              const cardBg = isHot ? 'rgba(255, 159, 10, 0.08)' : isCold ? 'rgba(10, 132, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)';
              const borderCol = isHot ? 'rgba(255, 159, 10, 0.2)' : isCold ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';

              const loc = dailyLocations.find(dl => dl.date === day.date && dl.lat?.toFixed(3) === day.lat?.toFixed(3) && dl.lon?.toFixed(3) === day.lon?.toFixed(3));
              const hasHistorical = !!day.isHistorical;
              const primaryIcon = day.icon || '⛅';

              return (
                <div 
                  key={`${day.date}-${day.lat}-${day.lon}`}
                  className="glass-effect"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', 
                    padding: '16px 20px', borderRadius: '20px', 
                    background: cardBg,
                    border: `1px solid ${borderCol}`,
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.3px' }}>
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h4>
                      {hasHistorical && (
                        <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                          HISTORICAL
                        </span>
                      )}
                    </div>
                    {loc && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--sys-blue)', opacity: 0.9 }}>
                         <MapPin size={12} />
                         <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                           {loc.name}
                         </span>
                      </div>
                    )}
                    <div style={{ margin: '14px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '10px' }}>
                        <Thermometer size={14} color="var(--sys-blue)" /> {day.tempHigh}°
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', fontWeight: 600 }}>/ {day.tempLow}°</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))' }}>
                        {hasHistorical ? <CloudSun size={28} opacity={0.5} /> : (primaryIcon)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: isHot ? '#FF9F0A' : isCold ? '#0A84FF' : 'var(--sys-label-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {day.isHistorical ? 'HISTORICAL AVG' : day.condition}
                    </p>
                    {day.isHistorical && (
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        {(day.rainfall || 0) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0EA5E9', fontSize: '11px', fontWeight: 700 }}>
                            <Droplets size={12} /> {day.rainfall?.toFixed(2)}"
                          </div>
                        )}
                        {(day.snowfall || 0) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8', fontSize: '11px', fontWeight: 700 }}>
                            <Snowflake size={12} /> {day.snowfall?.toFixed(2)}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {(!weather || loading) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton-line" style={{ height: '100px', borderRadius: '24px', opacity: 0.1 }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
