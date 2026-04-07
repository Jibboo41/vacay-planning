import { create } from 'zustand';
import type { ItineraryItem, TodoItem, Expense, WeatherCache } from '../core/models';
import { db, auth } from '../core/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc 
} from "firebase/firestore";

interface Trip {
  id: string;
  title: string;
  userId: string;
  items: ItineraryItem[];
  createdAt: number;
  aiSummary?: string;
  todos?: TodoItem[];
  expenses?: Expense[];
  weather?: WeatherCache;
}

interface TripStore {
  trips: Trip[];
  currentTripId: string | null;
  currentTripAiSummary: string | null;
  items: ItineraryItem[];
  todos: TodoItem[];
  expenses: Expense[];
  weather: WeatherCache | null;
  userId: string | null;
  loading: boolean;
  isSidebarOpen: boolean;
  focusedLocation: { lat: number, lng: number } | null;
  theme: string;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setFocusedLocation: (loc: { lat: number, lng: number } | null) => void;
  setTheme: (theme: string) => void;
  setCurrentTrip: (tripId: string | null) => void;
  addTrip: (title: string) => Promise<string>;
  deleteTrip: (tripId: string) => Promise<void>;
  
  // Item Actions
  addItem: (item: ItineraryItem) => Promise<void>;
  updateItem: (id: string, updatedFields: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addNote: (dayKey: string, title: string, content: string) => Promise<void>;
  reorderItems: (activeId: string, overId: string | null, newDayKey: string) => Promise<void>;
  saveAiSummary: (summary: string) => Promise<void>;

  // Todo Actions
  addTodo: (text: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  
  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Weather
  updateWeather: (weather: WeatherCache) => Promise<void>;

  // Sync
  syncTrips: (trips: Trip[]) => void;
}

function getDayKey(dateStr: string) {
  if (!dateStr) return '';
  // Force local interpretation for date-only strings to avoid UTC-midnight jumping to previous day
  const clean = dateStr.includes('T') ? dateStr : dateStr.replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateStr.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalTimeStr(dateStr: string) {
  if (!dateStr) return '12:00:00';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.split('T')[1]?.replace('Z', '') ?? '12:00:00';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTripId: localStorage.getItem('vacay_current_trip_id'),
  currentTripAiSummary: null,
  items: [],
  todos: [],
  expenses: [],
  weather: null,
  userId: null,
  loading: true,
  isSidebarOpen: false,
  focusedLocation: null,
  theme: localStorage.getItem('vacay_theme') || 'default',

  setUserId: (userId) => set({ userId }),
  setLoading: (loading) => set({ loading }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setFocusedLocation: (focusedLocation) => set({ focusedLocation }),
  setTheme: (theme) => {
    localStorage.setItem('vacay_theme', theme);
    set({ theme });
  },

  syncTrips: (trips) => {
    const sorted = [...trips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const { currentTripId } = get();
    const currentTrip = sorted.find(t => t.id === currentTripId);
    set({ 
      trips: sorted,
      items: currentTrip?.items || [],
      todos: currentTrip?.todos || [],
      expenses: currentTrip?.expenses || [],
      weather: currentTrip?.weather || null,
      currentTripAiSummary: currentTrip?.aiSummary || null 
    });
    if (currentTripId) localStorage.setItem('vacay_current_trip_id', currentTripId);
  },

  setCurrentTrip: (tripId) => {
    const { trips } = get();
    const trip = trips.find(t => t.id === tripId);
    set({ 
      currentTripId: tripId,
      items: trip?.items || [],
      todos: trip?.todos || [],
      expenses: trip?.expenses || [],
      weather: trip?.weather || null,
      currentTripAiSummary: trip?.aiSummary || null
    });
    if (tripId) localStorage.setItem('vacay_current_trip_id', tripId);
    else localStorage.removeItem('vacay_current_trip_id');
  },

  addTrip: async (title) => {
    const userId = get().userId || auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated.");
    const newTrip = { title, userId, items: [], createdAt: Date.now() };
    const docRef = await addDoc(collection(db, "trips"), newTrip);
    set({ currentTripId: docRef.id, items: [], todos: [], expenses: [], weather: null });
    localStorage.setItem('vacay_current_trip_id', docRef.id);
    return docRef.id;
  },

  deleteTrip: async (tripId) => {
    await deleteDoc(doc(db, "trips", tripId));
    if (get().currentTripId === tripId) {
      set({ currentTripId: null, items: [], todos: [], expenses: [], weather: null });
      localStorage.removeItem('vacay_current_trip_id');
    }
  },

  addItem: async (item) => {
    const { currentTripId, items } = get();
    if (!currentTripId) return;
    const newItems = [...items, item];
    set({ items: newItems });
    await setDoc(doc(db, "trips", currentTripId), { items: newItems }, { merge: true });
  },

  updateItem: async (id, updatedFields) => {
    const { currentTripId, items } = get();
    if (!currentTripId) return;
    const newItems = items.map(item => item.id === id ? { ...item, ...updatedFields } : item);
    set({ items: newItems });
    await setDoc(doc(db, "trips", currentTripId), { items: newItems }, { merge: true });
  },

  deleteItem: async (id) => {
    const { currentTripId, items } = get();
    if (!currentTripId) return;
    const newItems = items.filter(item => item.id !== id);
    set({ items: newItems });
    await setDoc(doc(db, "trips", currentTripId), { items: newItems }, { merge: true });
  },

  addNote: async (dayKey, title, content) => {
    const { currentTripId, items } = get();
    if (!currentTripId) return;
    const note: ItineraryItem = {
      id: `note-${Date.now()}`,
      type: 'note',
      title: title.trim() || 'Note',
      description: content,
      startDate: dayKey,
      location: { name: '', address: '', latitude: null, longitude: null },
    };
    const dayItems = items.filter(i => getDayKey(i.startDate) === dayKey);
    note.sortOrder = dayItems.length * 10;
    const newItems = [...items, note];
    set({ items: newItems });
    await setDoc(doc(db, "trips", currentTripId), { items: newItems }, { merge: true });
  },

  reorderItems: async (activeId, overId, newDayKey) => {
    const { currentTripId, items } = get();
    if (!currentTripId) return;
    const allItems = [...items];
    const activeItem = allItems.find(i => i.id === activeId);
    if (!activeItem) return;
    const oldDayKey = getDayKey(activeItem.startDate);
    const hasTime = activeItem.startDate.includes('T');
    const localTime = hasTime ? getLocalTimeStr(activeItem.startDate) : '';
    const movedItem: ItineraryItem = oldDayKey !== newDayKey
        ? { ...activeItem, startDate: hasTime ? `${newDayKey}T${localTime}` : newDayKey } : activeItem;
    const remaining = allItems.filter(i => i.id !== activeId);
    const targetDay = remaining.filter(i => getDayKey(i.startDate) === newDayKey).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    const overIdx = overId ? targetDay.findIndex(i => i.id === overId) : targetDay.length;
    targetDay.splice(overIdx === -1 ? targetDay.length : overIdx, 0, movedItem);
    const reorderedTarget = targetDay.map((item, idx) => ({ ...item, sortOrder: idx * 10 }));
    const otherItems = remaining.filter(i => getDayKey(i.startDate) !== newDayKey);
    let finalItems: ItineraryItem[];
    if (oldDayKey !== newDayKey) {
      const oldDay = otherItems.filter(i => getDayKey(i.startDate) === oldDayKey).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)).map((item, idx) => ({ ...item, sortOrder: idx * 10 }));
      const rest = otherItems.filter(i => getDayKey(i.startDate) !== oldDayKey);
      finalItems = [...rest, ...oldDay, ...reorderedTarget];
    } else {
      finalItems = [...otherItems, ...reorderedTarget];
    }
    set({ items: finalItems });
    await setDoc(doc(db, "trips", currentTripId), { items: finalItems }, { merge: true });
  },

  saveAiSummary: async (summary) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ currentTripAiSummary: summary });
    await setDoc(doc(db, "trips", currentTripId), { aiSummary: summary }, { merge: true });
  },

  addTodo: async (text) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodo: TodoItem = { id: `todo-${Date.now()}`, text, completed: false, createdAt: Date.now() };
    const newTodos = [...todos, newTodo];
    set({ todos: newTodos });
    await setDoc(doc(db, "trips", currentTripId), { todos: newTodos }, { merge: true });
  },

  toggleTodo: async (id) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    set({ todos: newTodos });
    await setDoc(doc(db, "trips", currentTripId), { todos: newTodos }, { merge: true });
  },

  deleteTodo: async (id) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodos = todos.filter(t => t.id !== id);
    set({ todos: newTodos });
    await setDoc(doc(db, "trips", currentTripId), { todos: newTodos }, { merge: true });
  },

  addExpense: async (expenseData) => {
    const { currentTripId, expenses } = get();
    if (!currentTripId) return;
    const newExpense: Expense = { ...expenseData, id: `exp-${Date.now()}` };
    const newExpenses = [...expenses, newExpense];
    set({ expenses: newExpenses });
    await setDoc(doc(db, "trips", currentTripId), { expenses: newExpenses }, { merge: true });
  },

  deleteExpense: async (id) => {
    const { currentTripId, expenses } = get();
    if (!currentTripId) return;
    const newExpenses = expenses.filter(e => e.id !== id);
    set({ expenses: newExpenses });
    await setDoc(doc(db, "trips", currentTripId), { expenses: newExpenses }, { merge: true });
  },

  updateWeather: async (weather) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ weather });
    await setDoc(doc(db, "trips", currentTripId), { weather }, { merge: true });
  }
}));
