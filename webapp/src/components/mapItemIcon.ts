import L from 'leaflet';

export const MAP_ITEM_COLORS: Record<string, string> = {
  flight: 'var(--sys-blue)', hotel: 'var(--sys-orange)', activity: 'var(--sys-cyan)',
  hiking: 'var(--sys-green)', hike: 'var(--sys-green)', transit: 'var(--sys-indigo)',
  food: 'var(--sys-purple)', note: 'var(--sys-gray)', unknown: 'var(--sys-gray)',
  'rental-car': 'var(--sys-cyan)',
};

const SYMBOLS: Record<string, string> = {
  flight: '🛫', hotel: '🏨', hiking: '🥾', hike: '🥾', transit: '🚆',
  food: '🍽️', note: '📝', 'rental-car': '🚗',
};

export function makeMapItemIcon(type: string, imageUrl?: string, isCheckout = false) {
  const pin = document.createElement('div');
  pin.className = 'map-item-pin';
  pin.style.setProperty('--pin-color', isCheckout ? 'var(--sys-red)' : (MAP_ITEM_COLORS[type] || MAP_ITEM_COLORS.unknown));

  const face = document.createElement('div');
  face.className = 'map-item-pin__face';
  const symbol = document.createElement('span');
  symbol.className = 'map-item-pin__symbol';
  symbol.setAttribute('aria-hidden', 'true');
  if (SYMBOLS[type]) symbol.textContent = SYMBOLS[type];
  else {
    // A neutral place marker for general activities and unclassified stops.
    symbol.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>';
  }
  face.append(symbol);

  if (imageUrl) {
    const image = document.createElement('img');
    image.className = 'map-item-pin__photo';
    image.alt = '';
    image.referrerPolicy = 'no-referrer';
    image.decoding = 'async';
    image.draggable = false;
    // Assign through the DOM so a URL can never become executable marker HTML.
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = imageUrl;
    face.append(image);
  }
  pin.append(face);
  return L.divIcon({ className: 'map-item-marker', html: pin, iconSize: [48, 54], iconAnchor: [24, 53], popupAnchor: [0, -50] });
}
