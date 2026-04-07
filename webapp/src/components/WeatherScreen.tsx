import { useState, useEffect } from 'react';
import { Thermometer, RefreshCw, AlertCircle, Menu, MapPin } from 'lucide-react';
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

  // 1. Determine the best location for every single day of the trip
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
       
       // Priority 1: Items on this day with coords
       const dayItems = items.filter(i => getDayKey(i.startDate) === dateKey);
       const specificItem = dayItems.find(i => i.location.latitude !== null && i.location.longitude !== null);
       
       if (specificItem) {
          dayLocations.push({ 
            date: dateKey, 
            lat: specificItem.location.latitude!, 
            lon: specificItem.location.longitude!, 
            name: specificItem.location.name || 'Current Stop'
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
                  name: lastItem.location.name || 'Last Known Location'
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
                     name: firstNext.location.name || 'Upcoming Location'
                   });
                }
             }
          }
       }
       
       curr.setDate(curr.getDate() + 1);
    }
    
    return dayLocations;
  };

  const dailyLocations = getDailyLocations();

  const handleUpdate = async () => {
    if (dailyLocations.length === 0) {
      setError("No locations with coordinates found in your itinerary yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
        setError("Weather forecast not available for these dates (likely too far in the future).");
        return;
      }

      await updateWeather({
        lastUpdated: Date.now(),
        forecast: allForecasts
      });
    } catch (err) {
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

  const lastUpdatedText = weather?.lastUpdated 
    ? new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'Never';

  return (
    <div className="safe-area-inset" style={{ padding: '24px', paddingBottom: '120px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="screen-header glass-effect" style={{ marginBottom: '24px' }}>
        <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFF', margin: 0 }}>
            Weather
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            Location-specific • Updated: {lastUpdatedText}
          </p>
        </div>
        <button 
          className="header-icon-btn"
          style={{ background: 'var(--sys-blue)', borderRadius: '14px', marginLeft: 'auto' }}
          onClick={handleUpdate}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
        </button>
      </div>

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
            const loc = dailyLocations.find(dl => dl.date === day.date);
            return (
              <div 
                key={day.date}
                className="glass-effect"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', 
                  padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
                    {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h4>
                  {loc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--sys-label-secondary)' }}>
                       <MapPin size={12} />
                       <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                         {loc.name}
                       </span>
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--sys-label-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={14} /> {day.tempHigh}° / {day.tempLow}°
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '32px' }}>{day.icon}</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 800, color: 'var(--sys-blue)', textTransform: 'uppercase' }}>{day.condition}</p>
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
  );
}
