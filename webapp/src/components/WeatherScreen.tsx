import { useState, useEffect } from 'react';
import { Thermometer, RefreshCw, AlertCircle, Menu, MapPin, Droplets, Snowflake, CloudSun, X } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
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
  const { weather, items, refreshWeather, setSidebarOpen, isWeatherRefreshing } = useTripStore();
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

  const getDailyLocations = () => {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const startStr = sorted[0].startDate.split('T')[0];
    let endStr = sorted[sorted.length - 1].startDate.split('T')[0];
    sorted.forEach((i: any) => { if (i.endDate && i.endDate > endStr) endStr = i.endDate.split('T')[0]; });

    const startDate = new Date(startStr.replace(/-/g, '/'));
    const endDate = new Date(endStr.replace(/-/g, '/'));
    const dayLocations: { date: string; lat: number; lon: number; name: string }[] = [];
    
    const curr = new Date(startDate);
    while (curr <= endDate) {
       const dateKey = curr.toISOString().split('T')[0];
       const dayItems = items.filter((i: any) => 
         (getDayKey(i.startDate) === dateKey || (i.endDate && getDayKey(i.endDate) === dateKey)) &&
         (i.type === 'hotel' || i.type === 'hiking' || i.type === 'activity') &&
         i.location.latitude !== null && i.location.longitude !== null
       );

       if (dayItems.length > 0) {
          dayItems.forEach((i: any) => {
            if (i.location.latitude !== null) {
              dayLocations.push({ date: dateKey, lat: i.location.latitude!, lon: i.location.longitude!, name: i.location.name || 'Stop' });
            }
          });
       } else {
          const activeHotel = items.find((i: any) => i.type === 'hotel' && i.location.latitude !== null && getDayKey(i.startDate) <= dateKey && i.endDate && getDayKey(i.endDate) >= dateKey);
          if (activeHotel) {
             dayLocations.push({ date: dateKey, lat: activeHotel.location.latitude!, lon: activeHotel.location.longitude!, name: activeHotel.location.name || 'Hotel' });
          } else {
             const prevItems = sorted.filter((i: any) => getDayKey(i.startDate) < dateKey && i.location.latitude !== null);
             if (prevItems.length > 0) {
                const lastItem = prevItems[prevItems.length - 1];
                dayLocations.push({ date: dateKey, lat: lastItem.location.latitude!, lon: lastItem.location.longitude!, name: lastItem.location.name || 'Last Known' });
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
      await refreshWeather();
    } catch (err: any) {
      setError("Failed to fetch weather data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!weather && dailyLocations.length > 0) {
      handleUpdate();
    }
  }, [items.length]);

  return (
    <div className="screen safe-area-inset" style={{ position: 'relative' }}>
      {/* Detail Modal Overlay */}
      {selectedDay && (
        <div
          className="modal-backdrop modal-backdrop--center"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="weather-detail-dialog"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDay(null)}
              className="icon-btn icon-btn--round weather-detail-dialog__close"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <span className="weather-detail-dialog__kicker">
              {selectedDay.isHistorical ? 'Historical Average' : 'Live Forecast'}
            </span>

            <h2 className="weather-detail-dialog__date">
              {new Date(`${selectedDay.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            <div className="weather-detail-dialog__icon">
              {selectedDay.isHistorical ? <CloudSun size={72} opacity={0.5} /> : (selectedDay.icon || '⛅')}
            </div>

            <div className="weather-detail-dialog__temps">
              <span className="weather-detail-dialog__high">{selectedDay.tempHigh}°</span>
              <span className="weather-detail-dialog__low">/ {selectedDay.tempLow}°</span>
              <p className="weather-detail-dialog__condition">
                {selectedDay.isHistorical ? 'Normal Conditions' : selectedDay.condition}
              </p>
            </div>

            <div className="weather-detail-dialog__stats">
              <div className="stat-tile">
                <div className="stat-tile__label" style={{ color: 'var(--sys-sky)' }}>
                   <Droplets size={16} />
                   <span>Rain</span>
                </div>
                <span className="stat-tile__value">{(selectedDay.rainfall || 0).toFixed(2)}"</span>
              </div>
              <div className="stat-tile">
                <div className="stat-tile__label">
                   <Snowflake size={16} />
                   <span>Snow</span>
                </div>
                <span className="stat-tile__value">{(selectedDay.snowfall || 0).toFixed(2)}"</span>
              </div>
            </div>

            {selectedDay.lat !== undefined && dailyLocations.find(dl => dl.date === selectedDay.date && Math.abs(dl.lat - selectedDay.lat!) < 0.001) && (
              <div className="weather-detail-dialog__place">
                 <MapPin size={14} />
                 <span>{dailyLocations.find(dl => dl.date === selectedDay.date && Math.abs(dl.lat - selectedDay.lat!) < 0.001)?.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Local Weather</h1>
          <p className="page-subtitle">
            {weather?.lastUpdated ? `Updated ${formatLastUpdated(weather.lastUpdated)}` : 'No sync data'}
          </p>
        </div>
        <button
          className="icon-btn icon-btn--lg icon-btn--accent"
          onClick={handleUpdate}
          disabled={loading || isWeatherRefreshing}
          aria-label="Refresh forecast"
          title="Refresh forecast"
        >
          <RefreshCw size={20} className={(loading || isWeatherRefreshing) ? 'spinning' : ''} />
        </button>
      </header>

      <div className="screen-body">
        {dailyLocations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><AlertCircle size={26} /></div>
            <p className="empty-state__text">Add a location with coordinates to see the weather forecast.</p>
          </div>
        ) : (
          <div className="list-stack">
            {error && (
               <div className="banner banner--danger" role="alert">
                  <AlertCircle size={20} />
                  <span>{error}</span>
               </div>
            )}

            {weather?.forecast.map(day => {
              const isHot = day.tempHigh > 80;
              const isCold = day.tempHigh < 50;
              const loc = dailyLocations.find((dl: any) => dl.date === day.date && day.lat !== undefined && Math.abs(dl.lat - day.lat) < 0.001);
              const hasHistorical = !!day.isHistorical;
              const primaryIcon = day.icon || '⛅';
              const tone = isHot ? ' weather-row--hot' : isCold ? ' weather-row--cold' : '';

              return (
                <div
                  key={`${day.date}-${day.lat}-${day.lon}`}
                  className={`card card--interactive weather-row clickable${tone}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="weather-row__main">
                    <div className="weather-row__heading">
                      <h4 className="weather-row__date">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h4>
                      {hasHistorical && (
                        <span className="item-chip">
                          HISTORICAL
                        </span>
                      )}
                    </div>
                    {loc && (
                      <div className="weather-row__place">
                         <MapPin size={12} />
                         <span>
                            {loc.name}
                         </span>
                      </div>
                    )}
                    <div className="weather-row__temps">
                      <div className="weather-row__high">
                        <Thermometer size={14} /> {day.tempHigh}°
                      </div>
                      <span className="weather-row__low">/ {day.tempLow}°</span>
                    </div>
                  </div>

                  <div className="weather-row__side">
                    <div className="weather-row__icon">
                      {hasHistorical ? <CloudSun size={28} opacity={0.5} /> : (primaryIcon)}
                    </div>
                    <p className="weather-row__condition">
                      {day.isHistorical ? 'HISTORICAL AVG' : day.condition}
                    </p>
                    {day.isHistorical && (
                      <div className="weather-row__precip">
                        {(day.rainfall || 0) > 0 && (
                          <div style={{ color: 'var(--sys-sky)' }}>
                            <Droplets size={12} /> {day.rainfall?.toFixed(2)}"
                          </div>
                        )}
                        {(day.snowfall || 0) > 0 && (
                          <div>
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
              <div className="list-stack">
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton-line" style={{ height: '96px' }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
