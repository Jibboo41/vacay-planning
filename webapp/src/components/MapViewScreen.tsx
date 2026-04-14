import { useEffect, useState, useMemo, useRef } from 'react';
import { useTripStore } from '../store/useTripStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Menu, Loader, X, RefreshCw, ArrowRight } from 'lucide-react';

// ─── Marker icons (custom divIcon — no broken image paths) ───────────────────

const TYPE_COLORS: Record<string, string> = {
  flight:   '#0A84FF',
  hotel:    '#FF9F0A',
  activity: '#EBEBF5',
  hiking:   '#30D158',
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

interface RouteSegment {
  type: 'driving' | 'flight';
  coords: [number, number][];
}

interface DayRoute {
  dayKey: string;
  color: string;
  segments: RouteSegment[];
  distance: number; 
}

async function fetchOSRMRoute(stops: any[], signal?: AbortSignal): Promise<[number, number][]> {
  const waypoints = stops
    .map(s => `${s.location.longitude!},${s.location.latitude!}`)
    .join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/${waypoints}` +
    `?overview=full&geometries=geojson&continue_straight=false`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng]
  );
}


function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) { map.setView(positions[0], 12); return; }
    // Add extra top padding for the translucent header (especially on iOS)
    map.fitBounds(L.latLngBounds(positions), { 
      paddingTopLeft: [20, 120], 
      paddingBottomRight: [20, 60] 
    });
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

/** 
 * Forces Leaflet to recalibrate its size/center when the container dimensions change.
 * Vital for split-screen layouts where the pane width is dynamic.
 */
function ResizeHandler() {
  const map = useMap();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      // Use requestAnimationFrame to ensure the browser has finished layout
      requestAnimationFrame(() => {
        if (!isMounted.current) return;
        
        try {
          // Robust safety check: ensure map is initialized, has a container, and is not in the middle of being destroyed
          const container = map.getContainer();
          const isLoaded = (map as any)._loaded;
          const hasPanes = (map as any)._panes;

          if (isLoaded && hasPanes && container && container.offsetWidth > 0) {
            map.invalidateSize({ animate: false });
          }
        } catch (e) {
          // Silently handle any edge cases where Leaflet's internal state is inconsistent
          console.warn('Map resize suppressed due to inconsistent state:', e);
        }
      });
    };

    const container = map.getContainer();
    const observer = new ResizeObserver(handleResize);
    
    if (container) {
      observer.observe(container);
    }

    return () => {
      observer.disconnect();
    };
  }, [map]);
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
        if (!hiddenDayFilters.includes(endKey)) {
          list.push({ ...item, _renderDate: item.endDate, _isCheckout: true });
        }
      }
    });

    // Synchronize sorting with TimelineScreen: Day -> sortOrder -> Time
    const sorted = list.sort((a, b) => {
      const dayA = getDayKey(a._renderDate), dayB = getDayKey(b._renderDate);
      if (dayA !== dayB) return dayA.localeCompare(dayB);
      
      const aOrder = a._isCheckout ? (a.endSortOrder ?? a.sortOrder ?? 0) : (a.sortOrder ?? 0);
      const bOrder = b._isCheckout ? (b.endSortOrder ?? b.sortOrder ?? 0) : (b.sortOrder ?? 0);
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a._renderDate.localeCompare(b._renderDate);
    });

    // ─── Special Logic for Flights: Discover Landing Point ──────────────────
    // Only flag if it's the LAST flight in a sequence
    sorted.forEach((item, idx) => {
      if (item.type === 'flight') {
        const next = sorted[idx + 1];
        if (!next || next.type !== 'flight') {
          item._isFlightTakeoff = true;
        }
      }
    });

    return sorted;
  }, [items, activeFilters, hiddenDayFilters]);


  const [dayRoutes, setDayRoutes] = useState<DayRoute[]>([]);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const routeCache = useRef<Map<string, RouteSegment[]>>(new Map());
  const [flightLandings, setFlightLandings] = useState<Record<string, { lat: number, lng: number, name: string }>>({});
  const [refreshTick, setRefreshTick] = useState(0);

  const handleRefresh = () => {
    routeCache.current.clear();
    setFlightLandings({});
    setRefreshTick(prev => prev + 1);
  };

  // ─── Geocode Landing Airports ─────────────────────────────────────────────
  useEffect(() => {
    const flights = items.filter(i => i.type === 'flight' && i.location.latitude);
    if (flights.length === 0) return;

    const parseAndGeocode = async () => {
      const { addDebugLog } = useTripStore.getState();
      const newLandings: Record<string, { lat: number, lng: number, name: string }> = { ...flightLandings };
      let changed = false;

      for (const f of flights) {
        if (newLandings[f.id]) continue;

        // Simple regex for IATA codes or "to [City]"
        const title = f.title + " " + (f.description || "");
        // Match "to JFK", "to London", "to San Francisco", etc.
        const match = title.match(/to\s+([A-Z]{3}|[A-Za-z\s]+)/i);
        const query = match ? match[1].trim() : null;

        if (query) {
          try {
            // If it looks like an IATA code (3 upper chars), prioritize that
            const isIATA = query.length === 3 && query === query.toUpperCase();
            // Extract the target city and clean it for query
            const cityQuery = query.split(',')[0].trim();
            const refinedQuery = isIATA ? `${query} Airport` : `${query} International Airport ${cityQuery}`;
            
            addDebugLog('Directions', `Nominatim Query: ${refinedQuery}`);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(refinedQuery)}&format=json&limit=1&countrycodes=us`);
            const data = await res.json();
            
            if (data?.[0]) {
              addDebugLog('Directions', `Nominatim Result: ${data[0].display_name}`);
              newLandings[f.id] = { 
                lat: parseFloat(data[0].lat), 
                lng: parseFloat(data[0].lon),
                name: data[0].display_name.split(',')[0]
              };
              changed = true;
            }
          } catch (e) {}
        }
      }
      if (changed) setFlightLandings(newLandings);
    };

    parseAndGeocode();
  }, [items, refreshTick]);

  const allPositions: [number, number][] = useMemo(() => {
    const pos: [number, number][] = mappable.map(i => [i.location.latitude!, i.location.longitude!]);
    // Add flight landing points to bounds only if the parent flight is visible
    Object.entries(flightLandings).forEach(([id, l]) => {
      if (mappable.some(m => m.id === id)) {
        pos.push([l.lat, l.lng]);
      }
    });
    return pos;
  }, [mappable, flightLandings]);

  const center: [number, number] = allPositions[0] ?? [48.7596, -113.787];

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
    
    let isMounted = true;
    const { addDebugLog } = useTripStore.getState();
    setRouteStatus('loading');

    const fetchAllRoutes = async () => {
      try {
        const routePromises = dayKeys.map(async (key, i) => {
          const stops = byDayMap.get(key)!;
          const colorIdx = allTripDayKeys.indexOf(key);
          const color = DAY_PALETTE[colorIdx !== -1 ? (colorIdx % DAY_PALETTE.length) : (i % DAY_PALETTE.length)];

          const cacheKey = stops.map(s => {
            const landing = s.type === 'flight' ? flightLandings[s.id] : null;
            const lKey = landing ? `-${landing.lat.toFixed(4)}-${landing.lng.toFixed(4)}` : '';
            return `${s.id}-${s.location.latitude?.toFixed(4)}-${s.location.longitude?.toFixed(4)}${lKey}`;
          }).join('|');
          
          if (routeCache.current.has(cacheKey)) {
             return { dayKey: key, color, segments: routeCache.current.get(cacheKey)!, distance: 0 };
          }

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            addDebugLog('Directions', `Calculating Day: ${key}`, { stops: stops.length });
            
            const segments: RouteSegment[] = [];
            // Use <= stops.length - 1 to ensure we check the last item for a terminal flight segment
            for (let j = 0; j < stops.length; j++) {
              const start = stops[j];
              const next = stops[j+1];
              
              if (start.type === 'flight') {
                const startPos: [number, number] = [start.location.latitude!, start.location.longitude!];
                
                if (start._isFlightTakeoff && flightLandings[start.id]) {
                  const landing = flightLandings[start.id];
                  addDebugLog('Directions', `Air Path (Final): ${start.title} -> ${landing.name}`);
                  segments.push({
                    type: 'flight',
                    coords: [startPos, [landing.lat, landing.lng]]
                  });
                  
                  // Only if there's a next item, draw a road transition from landing to next
                  if (next) {
                    try {
                      addDebugLog('Directions', `Road Transition: ${landing.name} -> ${next.title}`);
                      const transitionCoords = await fetchOSRMRoute([
                        { location: { latitude: landing.lat, longitude: landing.lng } },
                        next
                      ], controller.signal);
                      segments.push({ type: 'driving', coords: transitionCoords });
                    } catch (e) {
                      segments.push({ type: 'driving', coords: [[landing.lat, landing.lng], [next.location.latitude!, next.location.longitude!]] });
                    }
                  }
                } else if (next) {
                  // Intermediate flight: Dashed line direct to the next stop's location 
                  addDebugLog('Directions', `Air Path (Segment): ${start.title} -> ${next.title}`);
                  segments.push({
                    type: 'flight',
                    coords: [startPos, [next.location.latitude!, next.location.longitude!]]
                  });
                }
              } else if (next) {
                // Normal driving segment
                try {
                  addDebugLog('Directions', `Road Path: ${start.title} -> ${next.title}`);
                  let drivingCoords = await fetchOSRMRoute([start, next], controller.signal);
                  
                  // If OSRM returns an empty or single-point path (too close), force a 2-point line
                  if (drivingCoords.length < 2) {
                    drivingCoords = [
                      [start.location.latitude!, start.location.longitude!],
                      [next.location.latitude!, next.location.longitude!]
                    ];
                  }
                  
                  segments.push({ type: 'driving', coords: drivingCoords });
                } catch (e) {
                  segments.push({ type: 'driving', coords: [[start.location.latitude!, start.location.longitude!], [next.location.latitude!, next.location.longitude!]] });
                }
              }
            }
            
            clearTimeout(timeoutId);
            routeCache.current.set(cacheKey, segments);
            return { dayKey: key, color, segments, distance: 0 };
          } catch (err: any) {
            addDebugLog('Directions', `Day ${key} failed: ${err.message}`);
            return { dayKey: key, color, segments: [], distance: 0 };
          }
        });

        const results = await Promise.all(routePromises);
        if (isMounted) {
          setDayRoutes(results);
          setRouteStatus('done');
        }
      } catch (err: any) {
        if (isMounted) setRouteStatus('error');
      }
    };

    fetchAllRoutes();

    return () => { isMounted = false; };
  }, [dayKeys, byDayMap, mappable.length, allTripDayKeys, refreshTick]);

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
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', zIndex: 10, overflow: 'hidden' }}>
      <div className="screen-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(15, 16, 20, 0.45)' }}>
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
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
        <button 
          className="header-icon-btn btn-glass-blue"
          style={{ borderRadius: '14px', marginLeft: 'auto' }}
          onClick={handleRefresh}
          disabled={routeStatus === 'loading'}
        >
          <RefreshCw size={20} className={routeStatus === 'loading' ? 'spinning' : ''} />
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={10}
        style={{ flex: 1, width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <FitBounds positions={allPositions} />
        <MapController />
        <ResizeHandler />

        {dayRoutes.map(route =>
          route.segments.map((seg, sIdx) => (
            <Polyline
              key={`${route.dayKey}-${sIdx}`}
              positions={seg.coords}
              pathOptions={{
                color:   route.color,
                weight:  6,
                opacity: seg.type === 'flight' ? 0.7 : 0.9,
                dashArray: seg.type === 'flight' ? '12, 12' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))
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
              <div style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ 
                  fontSize: '11px', 
                  color: TYPE_COLORS[item.type] || 'var(--sys-blue)', 
                  fontWeight: 900, 
                  letterSpacing: '0.08em', 
                  marginBottom: '6px', 
                  textTransform: 'uppercase' 
                }}>
                  {new Date(item._renderDate.replace('T', ' ').replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {item._isCheckout ? ' • CHECK-OUT' : ''}
                </p>
                <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px', color: 'var(--sys-label-primary)', letterSpacing: '-0.3px' }}>
                  {item.title} {item._isCheckout ? '(Checkout)' : ''}
                </p>
                {item.location.address && (
                  <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', marginBottom: '14px', lineHeight: 1.5, fontWeight: 500 }}>
                    {item.location.address}
                  </p>
                )}
                <a
                  href={mapsUrl(item.location.latitude!, item.location.longitude!, item.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass-blue"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 16px', borderRadius: '12px', fontSize: '13px', 
                    fontWeight: 700, textDecoration: 'none', gap: '8px'
                  }}
                >
                  <span>{isIOS() ? ' Maps' : 'Google Maps'}</span>
                   <ArrowRight size={14} />
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Flight Landing Markers */}
        {Object.entries(flightLandings)
          .filter(([id]) => mappable.some(m => m.id === id)) // Only show if parent flight is visible
          .map(([id, landing]) => {
            const isTripEnd = mappable.length > 0 && mappable[mappable.length - 1].id === id;
          return (
            <Marker
              key={`landing-${id}`}
              position={[landing.lat, landing.lng]}
              icon={L.divIcon({
                className: '',
                html: `
                  <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
                    <div style="
                      position:absolute;width:32px;height:32px;
                      background:${isTripEnd ? '#FF3B30' : '#8E8E93'};border-radius:50%;
                      border:2.5px solid #fff;
                      box-shadow:0 4px 14px rgba(0,0,0,0.35);"></div>
                    <span style="position:relative;z-index:1;font-size:14px;line-height:1;margin-top:0px;">${isTripEnd ? '🏁' : '🛬'}</span>
                  </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
              })}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontWeight: 900, color: isTripEnd ? '#FF3B30' : 'var(--sys-label-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    {isTripEnd ? '🏁 Final Destination' : 'Destination'}
                  </p>
                  <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '12px', color: 'var(--sys-label-primary)', letterSpacing: '-0.3px' }}>
                    {landing.name}
                  </p>
                  <a
                    href={mapsUrl(landing.lat, landing.lng, landing.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass-blue"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '10px 16px', borderRadius: '12px', fontSize: '13px', 
                      fontWeight: 700, textDecoration: 'none', background: isTripEnd ? 'rgba(255, 59, 48, 0.2)' : undefined,
                      borderColor: isTripEnd ? 'rgba(255, 59, 48, 0.4)' : undefined
                    }}
                  >
                    Open in Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {routeStatus === 'loading' && (
        <div style={{
          position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 132, 255, 0.2)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          padding: '12px 24px', borderRadius: '24px',
          zIndex: 2000, whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(10, 132, 255, 0.25)',
          border: '1.5px solid rgba(10, 132, 255, 0.4)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Syncing regional routes…</span>
        </div>
      )}

      {routeStatus === 'error' && (
        <div style={{
          position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 59, 48, 0.2)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          padding: '12px 24px', borderRadius: '24px',
          zIndex: 2000, whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(255, 59, 48, 0.25)',
          border: '1.5px solid rgba(255, 59, 48, 0.4)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <X size={18} onClick={() => setRouteStatus('done')} style={{ cursor: 'pointer' }} />
          <span>Route calculation failed. Check logs.</span>
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
