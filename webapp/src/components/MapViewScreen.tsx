import { useEffect, useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu } from 'lucide-react';
import type { ItineraryItem } from '../core/models';

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

function groupByDay(items: ItineraryItem[]): Map<string, ItineraryItem[]> {
  const map = new Map<string, ItineraryItem[]>();
  const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (const item of sorted) {
    const key = getDayKey(item.startDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

interface DayRoute {
  dayKey: string;
  color: string;
  coords: [number, number][];
  distance: number; 
}

async function fetchOSRMRoute(stops: ItineraryItem[]): Promise<[number, number][]> {
  const waypoints = stops
    .map(s => `${s.location.longitude!},${s.location.latitude!}`)
    .join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/${waypoints}` +
    `?overview=full&geometries=geojson&continue_straight=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng]
  );
}

function straightLine(stops: ItineraryItem[]): [number, number][] {
  return stops.map(s => [s.location.latitude!, s.location.longitude!]);
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) { map.setView(positions[0], 12); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
  }, []); 
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
  const { items, setSidebarOpen } = useTripStore();

  const mappable = items.filter(
    i => typeof i.location.latitude === 'number' && typeof i.location.longitude === 'number'
  );

  const allPositions: [number, number][] = mappable.map(
    i => [i.location.latitude!, i.location.longitude!]
  );

  const center: [number, number] = allPositions[0] ?? [48.7596, -113.787];

  const [dayRoutes, setDayRoutes] = useState<DayRoute[]>([]);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (mappable.length < 2) return;
    const byDay = groupByDay(mappable);
    const dayKeys = [...byDay.keys()];

    setRouteStatus('loading');

    (async () => {
      const results: DayRoute[] = [];

      for (let i = 0; i < dayKeys.length; i++) {
        const key   = dayKeys[i];
        const stops = byDay.get(key)!;
        const color = DAY_PALETTE[i % DAY_PALETTE.length];

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
  }, [items.length]);

  const crossDayLines: [number, number][][] = [];
  const byDay = groupByDay(mappable);
  const dayKeys = [...byDay.keys()];
  for (let i = 0; i < dayKeys.length - 1; i++) {
    const lastOfDay  = byDay.get(dayKeys[i])!.at(-1)!;
    const firstOfNext = byDay.get(dayKeys[i + 1])!.at(0)!;
    crossDayLines.push([
      [lastOfDay.location.latitude!,  lastOfDay.location.longitude!],
      [firstOfNext.location.latitude!, firstOfNext.location.longitude!],
    ]);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
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
                weight:  5,
                opacity: 0.85,
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
              color:     'rgba(180, 180, 200, 0.6)',
              weight:    3,
              dashArray: '8, 8',
              lineCap:   'round',
            }}
          />
        ))}

        {mappable.map(item => (
          <Marker
            key={item.id}
            position={[item.location.latitude!, item.location.longitude!]}
            icon={makeMarkerIcon(item.type)}
          >
            <Popup className="custom-popup">
              <div style={{ minWidth: '190px', padding: '4px 2px' }}>
                <p style={{ fontSize: '11px', color: '#0A84FF', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {new Date(item.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#111' }}>
                  {item.title}
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

      {/* ─ Glass header ─ */}
      <div className="map-header glass-effect screen-header">
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

      {routeStatus === 'loading' && (
        <div style={{
          position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: '13px', fontWeight: 600,
          padding: '8px 18px', borderRadius: '20px',
          zIndex: 20, whiteSpace: 'nowrap',
        }}>
          🗺️ Calculating routes…
        </div>
      )}

      {routeStatus === 'done' && dayRoutes.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          left: '16px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '14px',
          padding: '10px 14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {dayRoutes.map(route => {
            const d = new Date(`${route.dayKey}T12:00:00`);
            const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={route.dayKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '4px', borderRadius: '2px', background: route.color, flexShrink: 0 }} />
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{label}</span>
              </div>
            );
          })}
          {crossDayLines.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '2px', background: 'rgba(235,245,245,0.45)', borderRadius: '1px', flexShrink: 0, borderTop: '2px dashed rgba(235,245,245,0.45)' }} />
              <span style={{ color: 'rgba(235,235,245,0.6)', fontSize: '11px' }}>between days</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
