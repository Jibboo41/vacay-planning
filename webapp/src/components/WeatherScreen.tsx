import { useState } from 'react';
import { Thermometer, RefreshCw, AlertCircle, Menu, MapPin, BarChart3 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { fetchWeather } from '../data/weatherApi';
import PullToRefresh from './PullToRefresh';
import type { WeatherDay, WeatherCache } from '../core/models';

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

function getDayLabel(dateString: string) {
  if (!dateString) return 'Date TBD';
  const clean = dateString.includes('T') ? dateString : dateString.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return 'Date TBD';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function WeatherScreen() {
  const { weather, items, updateWeather, setSidebarOpen, refreshAppData } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDailyLocations = () => {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const startStr = sorted[0].startDate.split('T')[0];
    let endStr = sorted[sorted.length - 1].startDate.split('T')[0];
    sorted.forEach(i => {
       if (i.endDate && i.endDate > endStr) endStr = i.endDate.split('T')[0];
    });

    const startDate = new Date(startStr.replace(/-/g, '/'));
    const endDate = new Date(endStr.replace(/-/g, '/'));
    const dayLocations: { date: string; lat: number; lon: number; name: string }[] = [];
    
    const curr = new Date(startDate);
    while (curr <= endDate) {
       const dateKey = curr.toISOString().split('T')[0];
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
      for (const key of Object.keys(locationGroups)) {
        const { lat, lon } = coordMap[key];
        const dates = locationGroups[key].sort();
        const start = dates[0];
        const end = dates[dates.length - 1];
        
        // Fetch weather for the range covering this location's dates
        const data = await fetchWeather(lat, lon, start, end);
        
        locationGroups[key].forEach(dateStr => {
           const dayData = data.find(d => d.date === dateStr);
           if (dayData) {
              allForecasts.push(dayData);
           }
        });
      }
      
      const newCache: WeatherCache = {
        lastUpdated: Date.now(),
        forecast: allForecasts
      };
      
      await updateWeather(newCache);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PullToRefresh onRefresh={refreshAppData}>
      <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
        <header className="screen-header" style={{ paddingTop: 'calc(6px + env(safe-area-inset-top))' }}>
          <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Weather</h1>
            <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>TRIP FORECAST</div>
          </div>
          <button onClick={handleUpdate} disabled={loading} className="header-icon-btn" style={{ color: loading ? 'var(--sys-label-tertiary)' : 'var(--sys-blue)' }}>
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <main style={{ padding: '0 24px 120px 24px' }}>
          {error && (
            <div className="glass-effect" style={{ marginBottom: '24px', padding: '16px', borderRadius: '16px', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AlertCircle size={20} color="var(--sys-red)" />
              <p style={{ margin: 0, fontSize: '13px', color: '#FFF' }}>{error}</p>
            </div>
          )}

          {dailyLocations.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-tertiary)' }}>
              <AlertCircle size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p>Add locations with coordinates to your timeline to see weather forecasts.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dailyLocations.map((dl) => {
              const forecast = weather?.forecast?.find(w => w.date === dl.date);
              return (
                <div key={dl.date} className="glass-effect" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{getDayLabel(dl.date)}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--sys-label-secondary)' }}>
                        <MapPin size={12} />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{dl.name}</span>
                      </div>
                    </div>
                    {forecast && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '32px', fontWeight: 800 }}>{Math.round(forecast.tempHigh)}°</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sys-label-secondary)' }}>Low {Math.round(forecast.tempLow)}°</div>
                      </div>
                    )}
                  </div>

                  {forecast ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <BarChart3 size={14} color="var(--sys-blue)" />
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>Condition</span>
                        </div>
                        <div style={{ fontSize: '15px', color: 'var(--sys-label-secondary)', textTransform: 'capitalize' }}>{forecast.condition || 'Clear'}</div>
                      </div>
                      <div style={{ width: '48px', height: '48px', background: 'var(--sys-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        <Thermometer size={24} color="#FFF" />
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--sys-label-tertiary)' }}>No forecast data. Tap refresh to fetch.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </PullToRefresh>
  );
}
