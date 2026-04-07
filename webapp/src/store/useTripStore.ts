import { create } from 'zustand';
import type { ItineraryItem } from '../core/models';

interface Trip {
  id: string;
  title: string;
  userId: string;
  items: ItineraryItem[];
  createdAt: number;
  aiSummary?: string;
}

interface TripStore {
  trips: Trip[];
  currentTripId: string | null;
  currentTripAiSummary: string | null;
  items: ItineraryItem[];
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
  addItem: (item: ItineraryItem) => void;
  updateItem: (id: string, updatedFields: Partial<ItineraryItem>) => void;
  deleteItem: (id: string) => void;
  addNote: (dayKey: string, title: string, content: string) => void;
  reorderItems: (activeId: string, overId: string | null, newDayKey: string) => void;
  saveAiSummary: (summary: string) => Promise<void>;

  // Sync
  syncTrips: (trips: Trip[]) => void;
}

function getDayKey(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
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

import { db, auth } from '../core/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc
} from "firebase/firestore";

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTripId: null,
  currentTripAiSummary: null,
  items: [],
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
      items: currentTrip ? currentTrip.items : [],
      currentTripAiSummary: currentTrip?.aiSummary || null 
    });
  },

  setCurrentTrip: (tripId) => {
    const { trips } = get();
    const trip = trips.find(t => t.id === tripId);
    set({ 
      currentTripId: tripId,
      items: trip ? trip.items : [],
      currentTripAiSummary: trip?.aiSummary || null
    });
  },

  addTrip: async (title) => {
    const userId = get().userId || auth.currentUser?.uid;
    if (!userId) {
      console.error("AddTrip Failed: No userId found. State:", { storeUserId: get().userId, authUser: auth.currentUser?.uid });
      throw new Error("User not authenticated. Please sign in again.");
    }

    const newTrip = {
      title,
      userId,
      items: [],
      createdAt: Date.now(),
    };

    try {
      console.log("Attempting to create trip in Firestore:", newTrip);
      const docRef = await addDoc(collection(db, "trips"), newTrip);
      console.log("Trip created successfully with ID:", docRef.id);
      
      set({ currentTripId: docRef.id, items: [] });
      return docRef.id;
    } catch (error: any) {
      console.error("Firestore Error in addTrip:", error);
      if (error.code === 'permission-denied') {
        alert("Firestore Permission Denied: Please check your security rules.");
      }
      throw error;
    }
  },

  deleteTrip: async (tripId) => {
    await deleteDoc(doc(db, "trips", tripId));
    const { currentTripId } = get();
    if (currentTripId === tripId) {
      set({ currentTripId: null, items: [] });
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
      startDate: dayKey, // No arbitrary time appended, making it day-level optional
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
    const movedItem: ItineraryItem =
      oldDayKey !== newDayKey
        ? { ...activeItem, startDate: hasTime ? `${newDayKey}T${localTime}` : newDayKey }
        : activeItem;

    const remaining = allItems.filter(i => i.id !== activeId);
    const targetDay = remaining
      .filter(i => getDayKey(i.startDate) === newDayKey)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

    const overIdx = overId ? targetDay.findIndex(i => i.id === overId) : targetDay.length;
    targetDay.splice(overIdx === -1 ? targetDay.length : overIdx, 0, movedItem);
    const reorderedTarget = targetDay.map((item, idx) => ({ ...item, sortOrder: idx * 10 }));

    const otherItems = remaining.filter(i => getDayKey(i.startDate) !== newDayKey);
    let finalItems: ItineraryItem[];
    if (oldDayKey !== newDayKey) {
      const oldDay = otherItems
        .filter(i => getDayKey(i.startDate) === oldDayKey)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
        .map((item, idx) => ({ ...item, sortOrder: idx * 10 }));
      const rest = otherItems.filter(i => getDayKey(i.startDate) !== oldDayKey);
      finalItems = [...rest, ...oldDay, ...reorderedTarget];
    } else {
      finalItems = [...otherItems, ...reorderedTarget];
    }

    set({ items: finalItems });
    await setDoc(doc(db, "trips", currentTripId), { items: finalItems }, { merge: true });
  },

  saveAiSummary: async (summary: string) => {
    const { currentTripId } = get();
    if (!currentTripId) return;
    set({ currentTripAiSummary: summary });
    await setDoc(doc(db, "trips", currentTripId), { aiSummary: summary }, { merge: true });
  },
}));

