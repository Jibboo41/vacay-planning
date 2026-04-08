import { create } from 'zustand';
import type { ItineraryItem, TodoItem, Expense, WeatherCache } from '../core/models';
import { db, auth } from '../core/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
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
  initialized: boolean;
  saving: boolean;
  lastSaveError: string | null;
  editingItem: ItineraryItem | null;
  editingExpense: Expense | null;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setFocusedLocation: (loc: { lat: number, lng: number } | null) => void;
  setTheme: (theme: string) => void;
  setCurrentTrip: (tripId: string | null) => void;
  setEditingItem: (item: ItineraryItem | null) => void;
  setEditingExpense: (exp: Expense | null) => void;
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
  addExpense: (expense: Omit<Expense, 'id' | 'paid' | 'paidAmount'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
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

/** Recursively remove all "undefined" values from an object for Firestore compatibility */
function scrubData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(scrubData);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, scrubData(v)])
    );
  }
  return obj;
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
  initialized: false,
  saving: false,
  lastSaveError: null,
  editingItem: null,
  editingExpense: null,

  setUserId: (userId) => set({ userId }),
  setLoading: (loading) => set({ loading }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setFocusedLocation: (focusedLocation) => set({ focusedLocation }),
  setTheme: (theme) => {
    localStorage.setItem('vacay_theme', theme);
    set({ theme });
  },

  syncTrips: (trips) => {
    const { initialized, currentTripId, items: currentItems } = get();
    
    if (trips.length === 0 && !initialized && currentTripId) {
      return;
    }

    const sorted = [...trips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const currentTrip = sorted.find(t => t.id === currentTripId);

    // CRITICAL: If we have a trip ID but the snapshot doesn't show it yet,
    // DON'T set items to [] which would trigger a UI clear/redirect.
    if (currentTripId && !currentTrip && initialized) {
       console.warn("Sync: currentTripId exists but trip not in snapshot. Keeping current state.");
       set({ trips: sorted });
       return;
    }

    // Normalize item types (e.g. 'hike' -> 'hiking') to prevent UI reversion
    const newItems = (currentTrip?.items || []).map(item => ({
      ...item,
      type: (item.type as string) === 'hike' ? 'hiking' : item.type
    }));

    // If we're already initialized and the data is magically empty, ignore it 
    // unless the user intentionally deleted the trip (which we handle elsewhere).
    if (initialized && newItems.length === 0 && currentItems.length > 0) {
       console.warn("Sync: Snapshot returned empty items for active trip. Ignoring.");
       set({ trips: sorted });
       return;
    }

    set({ 
      trips: sorted,
      items: newItems,
      todos: currentTrip?.todos || [],
      expenses: currentTrip?.expenses || [],
      weather: currentTrip?.weather || null,
      currentTripAiSummary: currentTrip?.aiSummary || null,
      initialized: true
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

  setEditingItem: (editingItem) => set({ editingItem }),
  setEditingExpense: (editingExpense) => set({ editingExpense }),

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
    const { currentTripId, items, initialized } = get();
    if (!currentTripId || !initialized) return;
    
    // Normalize before saving to server
    const normalizedItem = {
      ...item,
      type: (item.type as string) === 'hike' ? 'hiking' : item.type
    };
    const newItems = [...items, normalizedItem];
    
    set({ items: newItems, saving: true, lastSaveError: null });
    try {
      await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(newItems) });
      set({ saving: false });
    } catch (err: any) {
      console.error("Save failed:", err);
      set({ saving: false, lastSaveError: err.message });
    }
  },

  updateItem: async (id, updatedFields) => {
    const { currentTripId, items, initialized } = get();
    if (!currentTripId || !initialized) return;

    // Normalize category before saving
    const finalUpdates = { ...updatedFields };
    if (finalUpdates.type === 'hike') finalUpdates.type = 'hiking';

    const newItems = items.map(item => item.id === id ? { ...item, ...finalUpdates } : item);
    set({ items: newItems, saving: true, lastSaveError: null });
    
    try {
      await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(newItems) });
      set({ saving: false });
    } catch (err: any) {
      console.error("Update failed:", err);
      set({ saving: false, lastSaveError: err.message });
    }
  },

  deleteItem: async (id) => {
    const { currentTripId, items, initialized } = get();
    if (!currentTripId || !initialized) return;
    const newItems = items.filter(item => item.id !== id);
    set({ items: newItems });
    try {
      await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(newItems) });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  },

  addNote: async (dayKey, title, content) => {
    const { currentTripId, items, initialized } = get();
    if (!currentTripId || !initialized) return;
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
    try {
      await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(newItems) });
    } catch (err) {
      console.error("Add note failed:", err);
    }
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
    if (get().initialized) {
      try {
        await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(finalItems) });
      } catch (err) {
        console.error("Reorder failed:", err);
      }
    }
  },

  saveAiSummary: async (summary) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ currentTripAiSummary: summary });
    await updateDoc(doc(db, "trips", currentTripId), { aiSummary: summary });
  },

  addTodo: async (text) => {
    const { currentTripId, todos, initialized } = get();
    if (!currentTripId || !initialized) return;
    const newTodo: TodoItem = { id: `todo-${Date.now()}`, text, completed: false, createdAt: Date.now() };
    const newTodos = [...todos, newTodo];
    set({ todos: newTodos });
    await updateDoc(doc(db, "trips", currentTripId), { todos: scrubData(newTodos) });
  },

  toggleTodo: async (id) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    set({ todos: newTodos });
    await updateDoc(doc(db, "trips", currentTripId), { todos: scrubData(newTodos) });
  },

  deleteTodo: async (id) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodos = todos.filter(t => t.id !== id);
    set({ todos: newTodos });
    await updateDoc(doc(db, "trips", currentTripId), { todos: scrubData(newTodos) });
  },

  addExpense: async (expenseData) => {
    const { currentTripId, expenses } = get();
    if (!currentTripId) return;
    const newExpense: Expense = { 
      ...expenseData, 
      id: `exp-${Date.now()}`, 
      paid: false,
      paidAmount: 0
    };
    const newExpenses = [...expenses, newExpense];
    set({ expenses: newExpenses });
    await updateDoc(doc(db, "trips", currentTripId), { expenses: scrubData(newExpenses) });
  },

  updateExpense: async (id, updates) => {
    const { currentTripId, expenses } = get();
    if (!currentTripId) return;
    const newExpenses = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    set({ expenses: newExpenses });
    await updateDoc(doc(db, "trips", currentTripId), { expenses: scrubData(newExpenses) });
  },

  deleteExpense: async (id) => {
    const { currentTripId, expenses } = get();
    if (!currentTripId) return;
    const newExpenses = expenses.filter(e => e.id !== id);
    set({ expenses: newExpenses });
    await updateDoc(doc(db, "trips", currentTripId), { expenses: scrubData(newExpenses) });
  },

  updateWeather: async (weather) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ weather });
    await updateDoc(doc(db, "trips", currentTripId), { weather: scrubData(weather) });
  }
}));
