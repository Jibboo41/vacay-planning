/* Browser test doubles only. No credentials or production service connections. */
import type { ItineraryItem } from '../src/core/models';

const location = { name: 'Paris', address: '', latitude: null, longitude: null };
const items: ItineraryItem[] = [
  { id: 'flight', title: 'Flight to Paris', type: 'flight', startDate: '2026-10-17T10:10:00', location, cost: 620, paidAmount: 620 },
  { id: 'hotel', title: 'Saint-Germain stay', type: 'hotel', startDate: '2026-10-17T15:00:00', endDate: '2026-10-20T11:00:00', location: { ...location, name: 'Saint-Germain-des-Prés' }, cost: 780, paidAmount: 200 },
  { id: 'walk', title: 'Evening along the Seine', type: 'activity', startDate: '2026-10-17T18:00:00', location: { ...location, name: 'Seine riverbanks' }, description: 'A relaxed walk after checking in.' },
  { id: 'louvre', title: 'A morning at the Louvre', type: 'activity', startDate: '2026-10-18T10:00:00', location: { ...location, name: 'Musée du Louvre' }, cost: 32 },
];
const initial = [{ id: 'preview-paris', title: 'Paris getaway', userId: 'preview-user', createdAt: 1, items,
  dayDescriptions: { '2026-10-17': 'Arrive in Paris and get settled. Keep the afternoon easy, with a little exploring along the Seine in the evening.' },
  todos: [{ id: 'todo-1', text: 'Book Louvre tickets', completed: false, createdAt: 1, category: 'Reservations', dueDate: '2026-10-16' }],
  packingItems: [{ id: 'pack-1', text: 'Walking shoes', completed: false, category: 'Luggage', createdAt: 1 }],
  expenses: [{ id: 'expense-1', title: 'Airport transfer', amount: 60, paidAmount: 0, paid: false, category: 'Other' }],
  generalNotes: [{ id: 'note-1', title: 'Around Paris', content: 'Leave room for a slow morning and a café stop.', createdAt: 1 }],
  creditCards: [{ id: 'card-1', name: 'Travel card', categories: ['Dining', 'Lodging'], cashback: { Dining: 3, Lodging: 2 }, noForeignTxFee: true, notes: 'Use for meals and the hotel.' }],
  weather: { lastUpdated: Date.now(), forecast: ['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'].map(date => ({ date, tempHigh: 64, tempLow: 51, condition: 'Partly cloudy', icon: '⛅', rainfall: .1, snowfall: 0 })) },
}];
type PreviewTrip = Record<string, unknown> & { id: string };
let trips: PreviewTrip[] = JSON.parse(localStorage.getItem('vacay_preview_trips') || 'null') || initial;
localStorage.setItem('vacay_current_trip_id', trips[0]?.id || '');
export const db = {};
export const auth = { currentUser: { uid: 'preview-user', displayName: 'Preview account', email: 'preview@example.test', photoURL: null }, signOut: async () => {} };
export const googleProvider = {};
export const getRedirectResult = async () => null;
export const onAuthStateChanged = (_auth: unknown, callback: (user: typeof auth.currentUser) => void) => { queueMicrotask(() => callback(auth.currentUser)); return () => {}; };
export const signInWithPopup = async () => ({ user: auth.currentUser });
export const signOut = async () => {};
type Snapshot = { docs: { id: string; data: () => Omit<PreviewTrip, 'id'> }[] };
const listeners = new Set<(snapshot: Snapshot) => void>();
const snapshot = (): Snapshot => ({ docs: trips.map(trip => ({ id: trip.id, data: () => Object.fromEntries(Object.entries(trip).filter(([key]) => key !== 'id')) })) });
const publish = () => { localStorage.setItem('vacay_preview_trips', JSON.stringify(trips)); listeners.forEach(listener => listener(snapshot())); };
export const collection = (_db: unknown, name: string) => name;
export const where = (...args: unknown[]) => args;
export const query = (...args: unknown[]) => args;
export const onSnapshot = (_query: unknown, callback: (value: Snapshot) => void) => { listeners.add(callback); queueMicrotask(() => callback(snapshot())); return () => { listeners.delete(callback); }; };
export const doc = (_db: unknown, _name: string, id: string) => ({ id });
export class FieldPath { segments: string[]; constructor(...segments: string[]) { this.segments = segments; } }
const DELETE = Symbol('delete');
export const deleteField = () => DELETE;
export const updateDoc = async (reference: { id: string }, patch: FieldPath | Record<string, unknown>, value?: unknown) => {
  if (localStorage.getItem('vacay_preview_fail_saves') === 'true') throw new Error('Preview: simulated save failure');
  trips = trips.map(trip => {
    if (trip.id !== reference.id) return trip;
    if (!(patch instanceof FieldPath)) return { ...trip, ...patch };
    const [field, key] = patch.segments;
    const next = { ...(trip[field] as Record<string, unknown>), [key]: value };
    if (value === DELETE) delete next[key];
    return { ...trip, [field]: next };
  });
  publish();
};
export const addDoc = async (_collection: unknown, data: Record<string, unknown>) => { const id = crypto.randomUUID(); trips.push({ ...data, id }); publish(); return { id }; };
export const deleteDoc = async (reference: { id: string }) => { trips = trips.filter(trip => trip.id !== reference.id); publish(); };
export const getStorage = () => ({});
export const ref = (_storage: unknown, path: string) => ({ path });
const images = new Map<string, string>();
export const uploadBytes = async (reference: { path: string }, blob: Blob) => {
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
  images.set(reference.path, data);
};
export const getDownloadURL = async (reference: { path: string }) => images.get(reference.path)!;
export const deleteObject = async (reference: { path: string }) => { images.delete(reference.path); };
