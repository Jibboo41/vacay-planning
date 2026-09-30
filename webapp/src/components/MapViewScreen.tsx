import { useEffect, useState, useMemo, useRef } from 'react';
import { useTripStore } from '../store/useTripStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader, X, RefreshCw, ArrowRight } from 'lucide-react';
import type { ItineraryItem } from '../core/models';
import { ITEM_TYPES, getItemTypeMeta } from '../core/itemTypes';
import { Card, Badge, IconButton, ScreenHeader } from './ui';

// ─── Marker icons (custom divIcon — no broken image paths) ───────────────────

const CHECKOUT_MARKER_HEX = ITEM_TYPES.hotel.endTone?.hex ?? '#FF453A';

const TYPE_EMOJI: Record<string, string> = {
  flight:   '🛫',
  hotel:    '🏨',
  'rental-car': '🚗',
  activity: '🏔️',
  hiking:   '🥾',
  transit:  '🚆',
  food:     '🍽️',
  note:     '📝',
  unknown:  '📍',
};

const DAY_PALETTE = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF6B6B', '#64D2FF'];

type Coordinates = [number, number];

interface RouteStop extends ItineraryItem {
  _renderDate?: string;
  _isBase?: boolean;
  _isCheckout?: boolean;
  _isVirtual?: boolean;
  _isFlightTakeoff?: boolean;
}

interface MappableItem extends RouteStop {
  _renderDate: string;
}

interface FlightLanding {
  lat: number;
  lng: number;
  name: string;
}

interface FlightLandingSearch {
  id: string;
  title: string;
  description?: string;
}

function getMarkerColor(type: ItineraryItem['type'], isCheckout?: boolean) {
  return isCheckout ? CHECKOUT_MARKER_HEX : getItemTypeMeta({ type }).mapHex;
}

function makeMarkerIcon(type: ItineraryItem['type'], isCheckout?: boolean) {
  const color = getMarkerColor(type, isCheckout);
  const emoji = TYPE_EMOJI[type]  ?? TYPE_EMOJI.unknown;
  
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <!-- Glass Teardrop Pin -->
        <div style="
          position:absolute;width:34px;height:34px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border-radius:50% 50% 50% 0;
          transform: rotate(-45deg);
          border:1.5px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);"></div>
        
        <!-- Internal Tint Lens (also teardrop shaped for consistency) -->
        <div style="
          position:absolute;width:28px;height:28px;
          background:${color};opacity:0.4;
          border-radius:50% 50% 50% 0;
          transform: rotate(-45deg);
          filter: blur(3px);"></div>

        <span style="position:relative;z-index:1;font-size:16px;line-height:1;margin-top:-6px;filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${emoji}</span>
      </div>`,
    iconSize:    [44, 44],
    iconAnchor:  [22, 44], // Point ends at bottom-center
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
  coords: Coordinates[];
}

interface DayRoute {
  dayKey: string;
  color: string;
  segments: RouteSegment[];
  distance: number; 
}

async function fetchOSRMRoute(
  stops: { location: { latitude: number | null; longitude: number | null } }[],
  signal?: AbortSignal
): Promise<Coordinates[]> {
  const waypoints = stops
    .map(s => `${s.location.longitude!},${s.location.latitude!}`)
    .join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/${waypoints}` +
    `?overview=full&geometries=geojson&continue_straight=false`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  return (data.routes[0].geometry.coordinates as Coordinates[]).map(
    ([lng, lat]) => [lat, lng]
  );
}


function FitBounds({ positions }: { positions: Coordinates[] }) {
  const map = useMap();
  const { focusedLocation } = useTripStore();
  const hasInitialFit = useRef(false);

  useEffect(() => {
    // Permanent fix for the "snap-back" issue:
    // 1. If we've already done an initial fit, don't do it again automatically
    // 2. If a specific location is being flown to, absolutely skip fitting
    if (hasInitialFit.current || focusedLocation) return;

    if (!positions.length) return;
    if (positions.length === 1) { 
      map.setView(positions[0], 12); 
      hasInitialFit.current = true;
      return; 
    }
    
    map.fitBounds(L.latLngBounds(positions), { 
      paddingTopLeft: [20, 120], 
      paddingBottomRight: [20, 60],
      animate: true
    });
    hasInitialFit.current = true;
  }, [positions, map, focusedLocation]); 
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
          const leafletMap = map as unknown as { _loaded?: boolean; _panes?: unknown };
          const isLoaded = leafletMap._loaded;
          const hasPanes = leafletMap._panes;

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
  const { items, activeFilters, hiddenDayFilters, toggleDayFilter } = useTripStore();

  const mappable = useMemo(() => {
    const list: MappableItem[] = [];
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
  const [flightLandings, setFlightLandings] = useState<Record<string, FlightLanding>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const effectiveDayRoutes = mappable.length < 2 ? [] : dayRoutes;
  const effectiveRouteStatus = mappable.length < 2 ? 'done' : routeStatus;

  const handleRefresh = () => {
    routeCache.current.clear();
    setFlightLandings({});
    setRefreshTick(prev => prev + 1);
  };

  const flightsNeedingLanding = useMemo<FlightLandingSearch[]>(() => (
    items
      .filter(i => i.type === 'flight' && i.location.latitude && !flightLandings[i.id])
      .map(({ id, title, description }) => ({ id, title, description }))
  ), [items, flightLandings]);

  // ─── Geocode Landing Airports ─────────────────────────────────────────────
  useEffect(() => {
    if (flightsNeedingLanding.length === 0) return;
    let isCancelled = false;

    const parseAndGeocode = async () => {
      const { addDebugLog } = useTripStore.getState();
      const newLandings: Record<string, FlightLanding> = {};

      for (const f of flightsNeedingLanding) {
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
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            addDebugLog('Directions', `Landing geocode failed: ${f.title}`, { error: message });
          }
        }
      }
      if (!isCancelled && Object.keys(newLandings).length > 0) {
        setFlightLandings(prev => ({ ...prev, ...newLandings }));
      }
    };

    parseAndGeocode();
    return () => { isCancelled = true; };
  }, [flightsNeedingLanding, refreshTick]);

  const allPositions: Coordinates[] = useMemo(() => {
    const pos: Coordinates[] = mappable.map(i => [i.location.latitude!, i.location.longitude!]);
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
    const map = new Map<string, MappableItem[]>();
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
      return;
    }
    
    let isMounted = true;
    const { addDebugLog } = useTripStore.getState();

    const fetchAllRoutes = async () => {
      setRouteStatus('loading');
      try {
        const results: DayRoute[] = [];
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Process days sequentially with a small delay between days to be polite to the OSRM server
        // and avoid triggering rate limits (429 errors).
        for (let i = 0; i < dayKeys.length; i++) {
          if (!isMounted) break;
          const key = dayKeys[i];
          const baseStops = byDayMap.get(key) || [];
          const colorIdx = allTripDayKeys.indexOf(key);
          const color = DAY_PALETTE[colorIdx !== -1 ? (colorIdx % DAY_PALETTE.length) : (i % DAY_PALETTE.length)];

          // ─── Phase 60: Hotel-Origin Routing Logic ─────────────────────────────
          // Find if there's an active stay (hotel/rental) that covers this day.
          const activeStay = items.find(item => {
            if (item.type !== 'hotel' && item.type !== 'rental-car') return false;
            if (!item.location.latitude) return false;
            const startK = getDayKey(item.startDate);
            const endK = item.endDate ? getDayKey(item.endDate) : startK;
            return key >= startK && key <= endK;
          });

          let stops = [...baseStops];
          if (activeStay) {
            const startK = getDayKey(activeStay.startDate);
            const endK = activeStay.endDate ? getDayKey(activeStay.endDate) : startK;
            
            const isCheckinDay = key === startK;
            const isCheckoutDay = key === endK;

            // Prepend stay if it's NOT the check-in day (meaning we started the day there)
            // and the first stop isn't already this stay.
            if (!isCheckinDay && stops[0]?.id !== activeStay.id) {
              stops = [{ ...activeStay, _renderDate: key, _isVirtual: true }, ...stops];
            }
            // Append stay if it's NOT the checkout day (meaning we sleep there tonight)
            // and the last stop isn't already this stay.
            if (!isCheckoutDay && stops[stops.length - 1]?.id !== activeStay.id) {
              stops.push({ ...activeStay, _renderDate: key, _isVirtual: true });
            }
          }
          // ──────────────────────────────────────────────────────────────────────

          const cacheKey = stops.map(s => {
            const landing = s.type === 'flight' ? flightLandings[s.id] : null;
            const lKey = landing ? `-${landing.lat.toFixed(4)}-${landing.lng.toFixed(4)}` : '';
            return `${s.id}-${s.location.latitude?.toFixed(4)}-${s.location.longitude?.toFixed(4)}${lKey}`;
          }).join('|');
          
          if (routeCache.current.has(cacheKey)) {
            results.push({ dayKey: key, color, segments: routeCache.current.get(cacheKey)!, distance: 0 });
            continue;
          }

          // Small delay before each "new" routing calculation to reduce concurrency
          if (i > 0) await sleep(400);

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased timeout

            addDebugLog('Directions', `Calculating Day: ${key}`, { stops: stops.length });
            
            const segments: RouteSegment[] = [];
            for (let j = 0; j < stops.length; j++) {
              const start = stops[j];
              const next = stops[j+1];
              
              if (start.type === 'flight') {
                const startPos: Coordinates = [start.location.latitude!, start.location.longitude!];
                
                if (start._isFlightTakeoff && flightLandings[start.id]) {
                  const landing = flightLandings[start.id];
                  segments.push({ type: 'flight', coords: [startPos, [landing.lat, landing.lng]] });
                  
                  if (next) {
                    try {
                      // Transition route
                      const transitionCoords = await fetchOSRMRoute([
                        { location: { latitude: landing.lat, longitude: landing.lng } },
                        next
                      ], controller.signal);
                      segments.push({ type: 'driving', coords: transitionCoords });
                    } catch {
                      segments.push({ type: 'driving', coords: [[landing.lat, landing.lng], [next.location.latitude!, next.location.longitude!]] });
                    }
                  }
                } else if (next) {
                  segments.push({ type: 'flight', coords: [startPos, [next.location.latitude!, next.location.longitude!]] });
                }
              } else if (next) {
                // Normal driving segment with internal retry
                let drivingCoords: Coordinates[] | null = null;
                let lastErr = '';

                for (let attempt = 1; attempt <= 2; attempt++) {
                  try {
                    drivingCoords = await fetchOSRMRoute([start, next], controller.signal);
                    break;
                  } catch (error) {
                    lastErr = error instanceof Error ? error.message : String(error);
                    if (attempt < 2) await sleep(500);
                  }
                }

                if (drivingCoords && drivingCoords.length >= 2) {
                  segments.push({ type: 'driving', coords: drivingCoords });
                } else {
                  addDebugLog('Directions', `Fallback to straight line: ${start.title} -> ${next.title} (${lastErr})`);
                  segments.push({ type: 'driving', coords: [[start.location.latitude!, start.location.longitude!], [next.location.latitude!, next.location.longitude!]] });
                }
              }
            }
            
            clearTimeout(timeoutId);
            routeCache.current.set(cacheKey, segments);
            results.push({ dayKey: key, color, segments, distance: 0 });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addDebugLog('Directions', `Day ${key} failed: ${message}`);
            results.push({ dayKey: key, color, segments: [], distance: 0 });
          }
        }

        if (isMounted) {
          setDayRoutes(results);
          setRouteStatus('done');
        }
      } catch {
        if (isMounted) setRouteStatus('error');
      }
    };

    fetchAllRoutes();

    return () => { isMounted = false; };
  }, [dayKeys, byDayMap, mappable.length, allTripDayKeys, flightLandings, items, refreshTick]);

  const crossDayLines: Coordinates[][] = [];
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
    <div className="relative z-10 flex h-dvh w-full flex-col overflow-hidden">
      <ScreenHeader
        title="Destinations"
        subtitle={`${mappable.length} stop${mappable.length !== 1 ? 's' : ''} · ${dayKeys.length} day${dayKeys.length !== 1 ? 's' : ''}`}
        className="absolute inset-x-0 top-0 z-[1000] bg-app-bg/45"
        actions={(
          <IconButton
            aria-label="Refresh routes"
            variant="primary"
            className="rounded-[14px]"
            onClick={handleRefresh}
            disabled={effectiveRouteStatus === 'loading'}
          >
            <RefreshCw size={20} className={effectiveRouteStatus === 'loading' ? 'animate-spin' : ''} />
          </IconButton>
        )}
      />

      <MapContainer
        center={center}
        zoom={10}
        className="w-full flex-1"
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

        {effectiveDayRoutes.map(route =>
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
            icon={makeMarkerIcon(item.type, item._isCheckout)}
          >
            <Popup className="custom-popup">
              <div className="flex min-w-[200px] flex-col gap-0.5">
                <Badge tone="custom" className={`mb-1.5 bg-transparent px-0 py-0 ${getItemTypeMeta(item).textClass}`}>
                  {new Date(item._renderDate.replace('T', ' ').replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {item._isCheckout ? ' • CHECK-OUT' : ''}
                </Badge>
                <p className="mb-1 text-[16px] font-extrabold tracking-[-0.3px] text-label">
                  {item.title} {item._isCheckout ? '(Checkout)' : ''}
                </p>
                {item.location.address && (
                  <p className="mb-3.5 text-[13px] font-medium leading-[1.5] text-label-secondary">
                    {item.location.address}
                  </p>
                )}
                <a
                  href={mapsUrl(item.location.latitude!, item.location.longitude!, item.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass-blue flex items-center justify-center gap-2 rounded-xl border border-sys-blue/65 bg-sys-blue/50 px-4 py-2.5 text-[13px] font-bold text-white no-underline"
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
          return (
            <Marker
              key={`landing-${id}`}
              position={[landing.lat, landing.lng]}
              icon={L.divIcon({
                className: '',
                html: `
                  <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
                    <div style="
                      position:absolute;width:34px;height:34px;
                      background: rgba(142, 142, 147, 0.2);
                      backdrop-filter: blur(8px);
                      -webkit-backdrop-filter: blur(8px);
                      border-radius:50%;
                      border: 1.5px solid rgba(255,255,255,0.5);
                      box-shadow:0 6px 16px rgba(0,0,0,0.3);"></div>
                    <span style="position:relative;z-index:1;font-size:16px;line-height:1;filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛬</span>
                  </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
              })}
            >
              <Popup className="custom-popup">
                <div className="flex min-w-[180px] flex-col gap-1">
                  <Badge tone="neutral" className="mb-0.5 bg-transparent px-0 py-0">
                    Destination
                  </Badge>
                  <p className="mb-3 text-[16px] font-extrabold tracking-[-0.3px] text-label">
                    {landing.name}
                  </p>
                  <a
                    href={mapsUrl(landing.lat, landing.lng, landing.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass-blue flex items-center justify-center rounded-xl border-sys-blue/65 bg-sys-blue/50 px-4 py-2.5 text-[13px] font-bold text-white no-underline"
                  >
                    Open in Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {effectiveRouteStatus === 'loading' && (
        <Card className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap border-[1.5px] border-sys-blue/40 bg-sys-blue/20 px-6 py-3 text-[13px] font-bold text-white shadow-glow-blue backdrop-blur-xl">
          <Loader size={18} className="animate-spin" />
          <span>Syncing regional routes…</span>
        </Card>
      )}

      {effectiveRouteStatus === 'error' && (
        <Card className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap border-[1.5px] border-sys-red/40 bg-sys-red/20 px-6 py-3 text-[13px] font-bold text-white shadow-[0_8px_32px_rgba(255,69,58,0.25)] backdrop-blur-xl">
          <IconButton aria-label="Dismiss route error" variant="ghost" size="sm" onClick={() => setRouteStatus('done')}>
            <X size={18} />
          </IconButton>
          <span>Route calculation failed. Check logs.</span>
        </Card>
      )}

      {effectiveRouteStatus === 'done' && (
        <Card className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 z-[1000] flex max-h-[40vh] flex-col gap-2 overflow-y-auto rounded-[18px] border-white/10 bg-black/70 px-3.5 py-3 shadow-2xl backdrop-blur-xl">
          <Badge tone="neutral" className="mb-0.5 bg-transparent px-0 py-0">VISIBILITY BY DAY</Badge>
          
          {allTripDayKeys.map((key, i) => {
            const isHidden = hiddenDayFilters.includes(key);
            const d = new Date(`${key}T12:00:00`);
            const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <button
                type="button"
                key={key} 
                onClick={() => toggleDayFilter(key)}
                className={`flex cursor-pointer items-center gap-2.5 transition-all duration-200 ${isHidden ? 'opacity-35' : 'opacity-100'}`}
              >
                <div className="h-1.5 w-7 shrink-0 rounded-[3px]" style={{ backgroundColor: DAY_PALETTE[i % DAY_PALETTE.length] }} />
                <span className="text-[12px] font-semibold text-white">{label}</span>
              </button>
            );
          })}

          <div className="my-1 h-px bg-white/10" />
          
          <div className="flex items-center gap-2.5">
            <div className="h-0 w-7 shrink-0 border-t-2 border-dashed border-[rgba(180,180,200,0.4)]" />
            <span className="text-[11px] font-semibold text-label-tertiary">Between Days</span>
          </div>
        </Card>
      )}
    </div>
  );
}
