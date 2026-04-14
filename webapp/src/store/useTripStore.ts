import { create } from 'zustand';
import type { ItineraryItem, TodoItem, Expense, WeatherCache, WeatherDay } from '../core/models';
import { fetchWeather } from '../data/weatherApi';
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
  generalNotes?: import('../core/models').TripNote[];
}

interface TripStore {
  trips: Trip[];
  currentTripId: string | null;
  currentTripAiSummary: string | null;
  items: ItineraryItem[];
  todos: TodoItem[];
  expenses: Expense[];
  weather: WeatherCache | null;
  generalNotes: import('../core/models').TripNote[];
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
  activeFilters: string[];
  hiddenDayFilters: string[];
  tintedBackgrounds: boolean;
  isWeatherRefreshing: boolean;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setFocusedLocation: (loc: { lat: number, lng: number } | null) => void;
  setTheme: (theme: string) => void;
  setTintedBackgrounds: (enabled: boolean) => void;
  setCurrentTrip: (tripId: string | null) => void;
  setEditingItem: (item: ItineraryItem | null) => void;
  setEditingExpense: (exp: Expense | null) => void;
  addTrip: (title: string) => Promise<string>;
  deleteTrip: (tripId: string) => Promise<void>;
  renameTrip: (tripId: string, newTitle: string) => Promise<void>;
  
  // Item Actions
  addItem: (item: ItineraryItem) => Promise<void>;
  updateItem: (id: string, updatedFields: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFilter: (type: string) => void;
  toggleDayFilter: (dateKey: string) => void;
  duplicateTrip: (tripId: string) => Promise<string>;
  addNote: (dayKey: string, title: string, content: string) => Promise<void>;
  reorderItems: (activeId: string, overId: string | null, newDayKey: string, atBottom?: boolean) => Promise<void>;
  saveAiSummary: (summary: string) => Promise<void>;

  // General Notes Actions
  addGeneralNote: (title: string, content: string) => Promise<void>;
  updateGeneralNote: (id: string, updates: Partial<import('../core/models').TripNote>) => Promise<void>;
  deleteGeneralNote: (id: string) => Promise<void>;
  reorderGeneralNotes: (newOrder: import('../core/models').TripNote[]) => Promise<void>;

  // Todo Actions
  addTodo: (text: string, dueDate?: string, notes?: string) => Promise<void>;
  updateTodo: (id: string, updates: { text?: string; dueDate?: string | null; notes?: string | null }) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reorderTodos: (newOrder: import('../core/models').TodoItem[]) => Promise<void>;
  
  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id' | 'paid' | 'paidAmount'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Weather
  updateWeather: (weather: WeatherCache) => Promise<void>;
  refreshWeather: () => Promise<void>;

  // Debug
  debugLogs: { timestamp: number; category: string; message: string; data?: any }[];
  addDebugLog: (category: string, message: string, data?: any) => void;
  clearDebugLogs: () => void;

  // Sync
  syncTrips: (trips: Trip[]) => void;
}

function getDayKey(dateStr: string) {
  if (!dateStr) return '';
  // Standardize parsing to local time: Remove 'Z' if present, replace T with space for reliable local parsing
  const clean = dateStr.replace('Z', '').replace('T', ' ').replace(/-/g, '/');
  const d = new Date(clean);
  if (isNaN(d.getTime())) return dateStr.split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



/** Recursively remove all "undefined" values from an object for Firestore compatibility */
function scrubData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(scrubData);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
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
  generalNotes: [],
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
  activeFilters: ['flight', 'hotel', 'rental-car', 'activity', 'food', 'hiking', 'note', 'unknown'],
  hiddenDayFilters: [],
  tintedBackgrounds: localStorage.getItem('vacay_tinted_backgrounds') === 'true',
  isWeatherRefreshing: false,
  debugLogs: [],

  addDebugLog: (category, message, data) => 
    set((state) => ({ 
      debugLogs: [
        { timestamp: Date.now(), category, message, data }, 
        ...state.debugLogs.slice(0, 49) // Keep last 50
      ] 
    })),

  setUserId: (userId) => set({ userId }),
  setLoading: (loading) => set({ loading }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setFocusedLocation: (focusedLocation) => set({ focusedLocation }),
  toggleFilter: (type: string) => set((state) => ({
    activeFilters: state.activeFilters.includes(type)
      ? state.activeFilters.filter(t => t !== type)
      : [...state.activeFilters, type]
  })),
  toggleDayFilter: (dateKey: string) => set((state) => ({
    hiddenDayFilters: state.hiddenDayFilters.includes(dateKey)
      ? state.hiddenDayFilters.filter(d => d !== dateKey)
      : [...state.hiddenDayFilters, dateKey]
  })),
  clearDebugLogs: () => set({ debugLogs: [] }),

  setTheme: (theme) => {
    localStorage.setItem('vacay_theme', theme);
    set({ theme });
  },

  setTintedBackgrounds: (tintedBackgrounds) => {
    localStorage.setItem('vacay_tinted_backgrounds', String(tintedBackgrounds));
    set({ tintedBackgrounds });
  },

  syncTrips: (trips) => {
    const { initialized, currentTripId, items: currentItems } = get();
    
    // Handle empty trip state (new users or all trips deleted)
    if (trips.length === 0) {
      set({ 
        trips: [],
        items: [],
        todos: [],
        expenses: [],
        weather: null,
        generalNotes: [],
        currentTripAiSummary: null,
        initialized: true 
      });
      // If we had a stale ID in storage but no trips exist, clear it
      if (currentTripId) {
        set({ currentTripId: null });
        localStorage.removeItem('vacay_current_trip_id');
      }
      return;
    }

    const sorted = [...trips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const currentTrip = sorted.find(t => t.id === currentTripId);

    // If we have a trip ID but the snapshot doesn't show it (stale storage or deleted)
    if (currentTripId && !currentTrip) {
       console.warn("Sync: currentTripId exists but trip not in snapshot. Clearing stale ID.");
       localStorage.removeItem('vacay_current_trip_id');
       set({ 
         trips: sorted, 
         currentTripId: null,
         items: [],
         initialized: true 
       });
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
      generalNotes: currentTrip?.generalNotes || [],
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
      generalNotes: trip?.generalNotes || [],
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
    set({ currentTripId: docRef.id, items: [], todos: [], expenses: [], weather: null, generalNotes: [] });
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

  renameTrip: async (tripId, newTitle) => {
    const { trips } = get();
    await updateDoc(doc(db, "trips", tripId), { title: newTitle });
    set({ 
      trips: trips.map(t => t.id === tripId ? { ...t, title: newTitle } : t)
    });
  },

  duplicateTrip: async (tripId: string) => {
    const { trips } = get();
    const original = trips.find(t => t.id === tripId);
    if (!original) throw new Error("Trip not found");

    const newTrip = {
      ...original,
      title: `${original.title} (Copy)`,
      createdAt: Date.now()
    };
    // Remove the ID if it's inside the data block
    delete (newTrip as any).id;

    const docRef = await addDoc(collection(db, "trips"), newTrip);
    return docRef.id;
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

    reorderItems: async (activeId, overId, newDayKey, atBottom = true) => {
      const { currentTripId, items } = get();
      if (!currentTripId) return;

      const allItems = [...items];
      const isDraggingCheckout = activeId.endsWith('-checkout') || activeId.endsWith('-return');
      const realActiveId = activeId.replace(/-checkout$|-return$/, '');

      const activeItem = allItems.find(i => i.id === realActiveId);
      if (!activeItem) return;

      const movedItem = { ...activeItem };
      
      // Update the correct date field
      if (isDraggingCheckout && movedItem.endDate) {
        const timePart = movedItem.endDate.includes('T') ? movedItem.endDate.split('T')[1] : '11:00:00';
        movedItem.endDate = `${newDayKey}T${timePart}`;
      } else {
        const timePart = movedItem.startDate.includes('T') ? movedItem.startDate.split('T')[1] : '12:00:00';
        movedItem.startDate = `${newDayKey}T${timePart}`;
      }

      const remaining = allItems.filter(i => i.id !== realActiveId);

      // Helper to get items relevant to a specific day
      const getDayEventWrappers = (dayKey: string) => {
        const wrappers: { id: string, item: ItineraryItem, isCheckout: boolean }[] = [];
        remaining.forEach(item => {
          const startKey = getDayKey(item.startDate);
          const endKey = item.endDate ? getDayKey(item.endDate) : startKey;
          const isHotel = item.type === 'hotel' || item.type === 'rental-car';

          if (startKey === dayKey) {
            wrappers.push({ id: item.id, item, isCheckout: false });
          }
          if (isHotel && endKey === dayKey && endKey !== startKey) {
            wrappers.push({ id: item.id + (item.type === 'hotel' ? '-checkout' : '-return'), item, isCheckout: true });
          }
        });
        return wrappers.sort((a, b) => {
          const aOrder = a.isCheckout ? (a.item.endSortOrder ?? a.item.sortOrder ?? 0) : (a.item.sortOrder ?? 0);
          const bOrder = b.isCheckout ? (b.item.endSortOrder ?? b.item.sortOrder ?? 0) : (b.item.sortOrder ?? 0);
          return aOrder - bOrder;
        });
      };

      const targetDayWrappers = getDayEventWrappers(newDayKey);
      let overIdx = overId ? targetDayWrappers.findIndex(w => w.id === overId) : (atBottom ? targetDayWrappers.length : 0);
      
      // Insert moved item wrapper for calculation
      targetDayWrappers.splice(overIdx === -1 ? targetDayWrappers.length : overIdx, 0, { 
        id: activeId, 
        item: movedItem, 
        isCheckout: isDraggingCheckout 
      });

      // Assign new sort orders for everything on that day
      targetDayWrappers.forEach((wrapper, idx) => {
        const newOrder = idx * 10;
        if (wrapper.isCheckout) {
          wrapper.item.endSortOrder = newOrder;
        } else {
          wrapper.item.sortOrder = newOrder;
        }
      });

      // Reconstruct final items list
      const updatedItemsMap = new Map<string, ItineraryItem>();
      // First, keep all items not on the target day untouched (or updated if they were on the old day)
      remaining.forEach(i => updatedItemsMap.set(i.id, i));
      
      // Overwrite target day items with updated sort orders
      targetDayWrappers.forEach(w => {
        updatedItemsMap.set(w.item.id, w.item);
      });

      const finalItems = Array.from(updatedItemsMap.values());

      set({ items: finalItems });
      if (get().initialized) {
        try {
          await updateDoc(doc(db, "trips", currentTripId), { items: scrubData(finalItems) });
          // Auto-trigger weather refresh when items are moved
          get().refreshWeather();
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

  addTodo: async (text, dueDate, notes) => {
    const { currentTripId, todos, initialized } = get();
    if (!currentTripId || !initialized) return;
    const newTodo: TodoItem = { 
      id: `todo-${Date.now()}`, 
      text, 
      completed: false, 
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
      notes: notes || undefined
    };
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

  updateTodo: async (id, updates) => {
    const { currentTripId, todos } = get();
    if (!currentTripId) return;
    const newTodos = todos.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          ...updates,
          dueDate: updates.dueDate === null ? undefined : (updates.dueDate ?? t.dueDate),
          notes: updates.notes === null ? undefined : (updates.notes ?? t.notes)
        };
      }
      return t;
    });
    set({ todos: newTodos });
    await updateDoc(doc(db, "trips", currentTripId), { todos: scrubData(newTodos) });
  },

  reorderTodos: async (newOrder) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ todos: newOrder });
    await updateDoc(doc(db, "trips", currentTripId), { todos: scrubData(newOrder) });
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
  },

  refreshWeather: async () => {
    const { items, currentTripId, updateWeather, addDebugLog } = get();
    if (!currentTripId || !items.length) return;

    addDebugLog('Weather', 'Starting automatic refresh...');
    set({ isWeatherRefreshing: true });
    
    try {
      // 1. Determine relevant locations (logic mirrored from WeatherScreen)
      const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
      const startStr = sorted[0].startDate.split('T')[0];
      let endStr = sorted[sorted.length - 1].startDate.split('T')[0];
      sorted.forEach((i: ItineraryItem) => { if (i.endDate && i.endDate > endStr) endStr = i.endDate.split('T')[0]; });

      const startDate = new Date(startStr.replace(/-/g, '/'));
      const endDate = new Date(endStr.replace(/-/g, '/'));
      
      const dayLocations: { date: string; lat: number; lon: number; name: string }[] = [];
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const dateKey = curr.toISOString().split('T')[0];
        const dayItems = items.filter((i: ItineraryItem) => 
          (getDayKey(i.startDate) === dateKey || (i.endDate && getDayKey(i.endDate) === dateKey)) &&
          (i.type === 'hotel' || i.type === 'hiking' || i.type === 'activity') &&
          i.location.latitude !== null && i.location.longitude !== null
        );

        if (dayItems.length > 0) {
          dayItems.forEach((i: ItineraryItem) => {
            if (i.location.latitude !== null) {
              dayLocations.push({ date: dateKey, lat: i.location.latitude!, lon: i.location.longitude!, name: i.location.name || 'Stop' });
            }
          });
        } else {
          const activeHotel = items.find((i: ItineraryItem) => i.type === 'hotel' && i.location.latitude !== null && getDayKey(i.startDate) <= dateKey && i.endDate && getDayKey(i.endDate) >= dateKey);
          if (activeHotel) {
            dayLocations.push({ date: dateKey, lat: activeHotel.location.latitude!, lon: activeHotel.location.longitude!, name: activeHotel.location.name || 'Hotel' });
          } else {
            const prev = sorted.filter((i: ItineraryItem) => getDayKey(i.startDate) < dateKey && i.location.latitude !== null);
            if (prev.length) {
              const last = prev[prev.length - 1];
              dayLocations.push({ date: dateKey, lat: last.location.latitude!, lon: last.location.longitude!, name: last.location.name || 'Last Known' });
            }
          }
        }
        curr.setDate(curr.getDate() + 1);
      }

      // Deduplicate
      const uniqueDayLocations: typeof dayLocations = [];
      dayLocations.forEach(dl => {
        const exists = uniqueDayLocations.some(u => u.date === dl.date && Math.abs(u.lat - dl.lat) < 0.001 && Math.abs(u.lon - dl.lon) < 0.001);
        if (!exists) uniqueDayLocations.push(dl);
      });

      if (!uniqueDayLocations.length) return;

      // 2. Fetch
      const locationGroups: Record<string, string[]> = {};
      const coordMap: Record<string, { lat: number; lon: number }> = {};
      uniqueDayLocations.forEach(dl => {
        const key = `${dl.lat.toFixed(3)},${dl.lon.toFixed(3)}`;
        if (!locationGroups[key]) { locationGroups[key] = []; coordMap[key] = { lat: dl.lat, lon: dl.lon }; }
        locationGroups[key].push(dl.date);
      });

      const allForecasts: WeatherDay[] = [];
      for (const key of Object.keys(locationGroups)) {
        const dates = locationGroups[key].sort();
        const results = await fetchWeather(coordMap[key].lat, coordMap[key].lon, dates[0], dates[dates.length - 1]);
        results.forEach(r => { if (dates.includes(r.date)) allForecasts.push(r); });
      }

      allForecasts.sort((a, b) => a.date.localeCompare(b.date));
      if (allForecasts.length) {
        await updateWeather({ lastUpdated: Date.now(), forecast: allForecasts });
        addDebugLog('Weather', 'Auto-refresh success', { count: allForecasts.length });
      }
    } catch (err) {
      addDebugLog('Weather', 'Auto-refresh failed', err);
    } finally {
      set({ isWeatherRefreshing: false });
    }
  },

  addGeneralNote: async (title, content) => {
    const { currentTripId, generalNotes, initialized } = get();
    if (!currentTripId || !initialized) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      createdAt: Date.now()
    };
    const newNotes = [...generalNotes, newNote];
    set({ generalNotes: newNotes });
    await updateDoc(doc(db, "trips", currentTripId), { generalNotes: scrubData(newNotes) });
  },

  updateGeneralNote: async (id, updates) => {
    const { currentTripId, generalNotes } = get();
    if (!currentTripId) return;
    const newNotes = generalNotes.map(n => n.id === id ? { ...n, ...updates } : n);
    set({ generalNotes: newNotes });
    await updateDoc(doc(db, "trips", currentTripId), { generalNotes: scrubData(newNotes) });
  },

  deleteGeneralNote: async (id) => {
    const { currentTripId, generalNotes } = get();
    if (!currentTripId) return;
    const newNotes = generalNotes.filter(n => n.id !== id);
    set({ generalNotes: newNotes });
    await updateDoc(doc(db, "trips", currentTripId), { generalNotes: scrubData(newNotes) });
  },

  reorderGeneralNotes: async (newOrder) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ generalNotes: newOrder });
    await updateDoc(doc(db, "trips", currentTripId), { generalNotes: scrubData(newOrder) });
  }
}));
