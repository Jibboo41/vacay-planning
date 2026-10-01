import { create } from 'zustand';

export interface AppBanner {
  id: string;
  message: string;
  /** Optional retry callback shown as a "Retry" button. */
  retry?: () => void;
}

interface UiStore {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  banner: AppBanner | null;
  showBanner: (banner: AppBanner) => void;
  dismissBanner: (id?: string) => void;
  /** Itinerary item the timeline should scroll to and focus (palette "jump to"). */
  focusItemId: string | null;
  focusItem: (id: string | null) => void;
  timelineCollapsed: boolean;
  setTimelineCollapsed: (collapsed: boolean) => void;
  /** Timeline text search; shared so Settings can edit it on mobile. */
  timelineQuery: string;
  setTimelineQuery: (query: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  banner: null,
  showBanner: (banner) => set({ banner }),
  dismissBanner: (id) => set((s) => (!id || s.banner?.id === id ? { banner: null } : s)),
  focusItemId: null,
  focusItem: (focusItemId) => set({ focusItemId }),
  timelineCollapsed: localStorage.getItem('vacay:timeline-collapsed') === '1',
  setTimelineCollapsed: (timelineCollapsed) => {
    localStorage.setItem('vacay:timeline-collapsed', timelineCollapsed ? '1' : '0');
    set({ timelineCollapsed });
  },
  timelineQuery: '',
  setTimelineQuery: (timelineQuery) => set({ timelineQuery }),
}));
