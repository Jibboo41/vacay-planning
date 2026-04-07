import { useState, useEffect } from 'react';
import { Thermometer, RefreshCw, AlertCircle, Menu, Calendar } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { fetchWeather } from '../data/weatherApi';

export default function WeatherScreen() {
  const { weather, items, updateWeather, setSidebarOpen } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTripRange = () => {
    if (!items.length) return null;
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const firstStop = sorted.find(i => i.location.latitude !== null && i.location.longitude !== null);
    if (!firstStop) return null;

    return {
      lat: firstStop.location.latitude!,
      lon: firstStop.location.longitude!,
      start: sorted[0].startDate.split('T')[0],
      end: sorted[sorted.length - 1].startDate.split('T')[0],
      locationName: firstStop.location.name || 'Your Trip'
    };
  };

  const range = getTripRange();

  const handleUpdate = async () => {
    if (!range) {
      setError("No locations with coordinates found in your itinerary yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(range.lat, range.lon, range.start, range.end);
      if (data.length === 0) {
        setError("Weather forecast not available for these dates (likely too far in the future or past).");
        return;
      }
      await updateWeather({
        lastUpdated: Date.now(),
        forecast: data
      });
    } catch (err) {
      setError("Failed to fetch weather data. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch if none exists
  useEffect(() => {
    if (!weather && range) {
      handleUpdate();
    }
  }, [range]);

  const lastUpdatedText = weather?.lastUpdated 
    ? new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'Never';

  return (
    <div className="safe-area-inset" style={{ padding: '24px', paddingBottom: '120px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="screen-header glass-effect" style={{ marginBottom: '24px' }}>
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', color: '#FFF', margin: 0 }}>
            Weather
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            Last updated: {lastUpdatedText}
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

      {!range ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <AlertCircle size={48} opacity={0.2} />
          <p style={{ fontSize: '15px' }}>Add a location with coordinates to see the weather forecast.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
            <Calendar size={18} color="var(--sys-blue)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Showing weather for {range.locationName}</span>
          </div>

          {error && (
             <div style={{ padding: '16px', background: 'rgba(255, 69, 58, 0.1)', borderRadius: '16px', border: '1px solid rgba(255, 69, 58, 0.2)', display: 'flex', gap: '12px', alignItems: 'center', color: '#FF453A' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '14px' }}>{error}</span>
             </div>
          )}

          {weather?.forecast.map(day => (
            <div 
              key={day.date}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', 
                background: 'var(--sys-bg-elevated-1)', padding: '20px', 
                borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--sys-label-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Thermometer size={14} /> {day.tempHigh}° / {day.tempLow}°
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '32px' }}>{day.icon}</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 600, color: 'var(--sys-label-tertiary)' }}>{day.condition}</p>
              </div>
            </div>
          ))}

          {!weather && loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton-line" style={{ height: '90px', borderRadius: '24px', opacity: 0.1 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
