import { useEffect, useState, useMemo } from 'react';
import { useTripStore } from '../store/useTripStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu } from 'lucide-react';

// ─── Marker icons (custom divIcon — no broken image paths) ───────────────────

const TYPE_COLORS: Record<string, string> = {
  flight:   '#0A84FF',
  hotel:    '#30D158',
  activity: '#FF9F0A',
  hiking:   '#34C759',
  transit:  '#5E5CE6',
  food:     '#FF2D55',
  note:     '#FFD60A',
  unknown:  '#EBEBF5',
};

const TYPE_EMOJI: Record<string, string> = {
  flight:   '✈️',
  hotel:    '🏨',
  activity: '🏔️',
  hiking:   '🥾',
  transit:  '🚆',
  food:     '🍽️',
  note:     '📝',
  unknown:  '📍',
};

const DAY_PALETTE = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF6B6B', '#64D2FF'];

function makeMarkerIcon(type: string) {
  const color = TYPE_COLORS[type] ?? TYPE_COLORS.unknown;
  const emoji = TYPE_EMOJI[type]  ?? TYPE_EMOJI.unknown;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;width:36px;height:36px;
          background:${color};border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,0.9);
          box-shadow:0 4px 14px rgba(0,0,0,0.35);"></div>
        <span style="position:relative;z-index:1;font-size:15px;line-height:1;margin-top:-6px;">${emoji}</span>
      </div>`,
    iconSize:    [40, 40],
    iconAnchor:  [20, 40],
    popupAnchor: [0, -44],
  });
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function mapsUrl(lat: number, lng: number, name: string) {
  return isIOS()
    ? `maps://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`
    : `https://maps.google.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
}

function getDayKey(dateStr: string) { return dateStr.split('T')[0]; }

interface DayRoute {
  dayKey: string;
  color: string;
  coords: [number, number][];
  distance: number; 
}

async function fetchOSRMRoute(stops: any[]): Promise<[number, number][]> {
  const waypoints = stops
    .map(s => `${s.location.longitude!},${s.location.latitude!}`)
    .join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/${waypoints}` +
    `?overview=full&geometries=geojson&continue_straight=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng]
  );
}

function straightLine(stops: any[]): [number, number][] {
  return stops.map(s => [s.location.latitude!, s.location.longitude!]);
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) { map.setView(positions[0], 12); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
  }, [positions, map]); 
  return null;
}

function MapController() {
  const map = useMap();
  const { focusedLocation, setFocusedLocation } = useTripStore();

  useEffect(() => {
    if (focusedLocation) {
      map.flyTo([focusedLocation.lat, focusedLocation.lng], 15, { animate: true, duration: 1.5 });
      const t = setTimeout(() => setFocusedLocation(null), 1600);
      return () => clearTimeout(t);
    }
  }, [focusedLocation, map, setFocusedLocation]);

  return null;
}

export default function MapViewScreen() {
  const { items, setSidebarOpen, activeFilters, hiddenDayFilters, toggleDayFilter } = useTripStore();

  const mappable = useMemo(() => {
    const list: any[] = [];
    items.forEach(item => {
      const hasCoords = typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number';
      if (!hasCoords) return;
      if (!activeFilters.includes(item.type)) return;

      const startKey = getDayKey(item.startDate);
      if (!hiddenDayFilters.includes(startKey)) {
        list.push({ ...item, _renderDate: item.startDate, _isBase: true });
      }

      if (item.endDate && (item.type === 'hotel' || item.type === 'rental-car')) {
        const endKey = getDayKey(item.endDate);
        // Include checkout/return even if it's the same day, so it appears in the sequence
        if (!hiddenDayFilters.includes(endKey)) {
          list.push({ ...item, _renderDate: item.endDate, _isCheckout: true });
        }
      }
    });

    // Ensure strictly chronological sorting before drawing lines
    return list.sort((a, b) => {
      if (a._renderDate !== b._renderDate) return a._renderDate.localeCompare(b._renderDate);
      if (a.id === b.id) {
         if (a._isCheckout) return 1;
         if (b._isCheckout) return -1;
      }
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [items, activeFilters, hiddenDayFilters]);

  const allPositions: [number, number][] = mappable.map(
    i => [i.location.latitude!, i.location.longitude!]
  );

  const center: [number, number] = allPositions[0] ?? [48.7596, -113.787];

  const [dayRoutes, setDayRoutes] = useState<DayRoute[]>([]);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const byDayMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of mappable) {
      const key = getDayKey(item._renderDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [mappable]);

  const dayKeys = useMemo(() => [...byDayMap.keys()].sort(), [byDayMap]);

  const allTripDayKeys = useMemo(() => {
    const keys = new Set<string>();
    items.forEach(item => {
      keys.add(getDayKey(item.startDate));
      if (item.endDate && (item.type === 'hotel' || item.type === 'rental-car')) {
        keys.add(getDayKey(item.endDate));
      }
    });
    return [...keys].sort();
  }, [items]);

  useEffect(() => {
    if (mappable.length < 2) {
      setDayRoutes([]);
      setRouteStatus('done');
      return;
    }
    
    setRouteStatus('loading');

    (async () => {
      const results: DayRoute[] = [];

      for (let i = 0; i < dayKeys.length; i++) {
        const key   = dayKeys[i];
        const stops = byDayMap.get(key)!;
        // Color should be consistent with the total trip days sequence
        const colorIdx = allTripDayKeys.indexOf(key);
        const color = DAY_PALETTE[colorIdx !== -1 ? (colorIdx % DAY_PALETTE.length) : (i % DAY_PALETTE.length)];

        if (stops.length < 2) {
          results.push({ dayKey: key, color, coords: straightLine(stops), distance: 0 });
          continue;
        }

        try {
          const coords = await fetchOSRMRoute(stops);
          results.push({ dayKey: key, color, coords, distance: 0 });
        } catch {
          results.push({ dayKey: key, color, coords: straightLine(stops), distance: 0 });
        }
      }

      setDayRoutes(results);
      setRouteStatus('done');
    })();
  }, [dayKeys, byDayMap, mappable.length, allTripDayKeys]);

  const crossDayLines: [number, number][][] = [];
  for (let i = 0; i < dayKeys.length - 1; i++) {
    const dayI = byDayMap.get(dayKeys[i]);
    const dayNext = byDayMap.get(dayKeys[i + 1]);
    if (dayI && dayNext) {
      const lastOfDay = dayI.at(-1);
      const firstOfNext = dayNext.at(0);
      if (lastOfDay && firstOfNext) {
        crossDayLines.push([
          [lastOfDay.location.latitude!, lastOfDay.location.longitude!],
          [firstOfNext.location.latitude!, firstOfNext.location.longitude!],
        ]);
      }
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', zIndex: 10, overflow: 'hidden' }}>
      <div className="map-header glass-effect screen-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
          style={{ marginRight: '4px' }}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFF', margin: 0 }}>
            Destinations
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {mappable.length} stop{mappable.length !== 1 ? 's' : ''} · {dayKeys.length} day{dayKeys.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <FitBounds positions={allPositions} />
        <MapController />

        {dayRoutes.map(route =>
          route.coords.length >= 2 && (
            <Polyline
              key={route.dayKey}
              positions={route.coords}
              pathOptions={{
                color:   route.color,
                weight:  6,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )
        )}

        {crossDayLines.map((line, i) => (
          <Polyline
            key={`cross-${i}`}
            positions={line}
            pathOptions={{
              color:     'rgba(180, 180, 200, 0.4)',
              weight:    3,
              dashArray: '8, 8',
              lineCap:   'round',
            }}
          />
        ))}

        {mappable.map((item, idx) => (
          <Marker
            key={`${item.id}-${item._isCheckout ? 'out' : 'base'}-${idx}`}
            position={[item.location.latitude!, item.location.longitude!]}
            icon={makeMarkerIcon(item.type)}
          >
            <Popup className="custom-popup">
              <div style={{ minWidth: '190px', padding: '4px 2px' }}>
                <p style={{ fontSize: '11px', color: '#0A84FF', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {new Date(item._renderDate.replace('T', ' ').replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {item._isCheckout ? ' • CHECK-OUT' : ''}
                </p>
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#111' }}>
                  {item.title} {item._isCheckout ? '(Checkout)' : ''}
                </p>
                {item.location.address && (
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '10px', lineHeight: 1.4 }}>
                    {item.location.address}
                  </p>
                )}
                <a
                  href={mapsUrl(item.location.latitude!, item.location.longitude!, item.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', padding: '6px 14px',
                    background: '#0A84FF', color: '#fff',
                    borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {isIOS() ? '🗺️ Open in Apple Maps' : '🗺️ Open in Google Maps'}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {routeStatus === 'loading' && (
        <div style={{
          position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          padding: '10px 22px', borderRadius: '24px',
          zIndex: 2000, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          🗺️ Calculating routes…
        </div>
      )}

      {routeStatus === 'done' && (
        <div style={{
          position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))',
          left: '16px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderRadius: '18px',
          padding: '12px 14px', zIndex: 1000, display: 'flex', flexDirection: 'column',
          gap: '8px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxHeight: '40vh', overflowY: 'auto'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--sys-label-secondary)', letterSpacing: '0.05em', marginBottom: '2px' }}>VISIBILITY BY DAY</div>
          
          {allTripDayKeys.map((key, i) => {
            const isHidden = hiddenDayFilters.includes(key);
            const d = new Date(`${key}T12:00:00`);
            const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div 
                key={key} 
                onClick={() => toggleDayFilter(key)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  cursor: 'pointer', opacity: isHidden ? 0.35 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '28px', height: '6px', borderRadius: '3px', background: DAY_PALETTE[i % DAY_PALETTE.length], flexShrink: 0 }} />
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
