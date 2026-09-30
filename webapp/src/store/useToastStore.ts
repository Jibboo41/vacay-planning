import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
  /** Auto-dismiss after this many ms. `0` keeps it until dismissed. */
  duration: number;
}

export type ToastInput = Partial<Omit<Toast, 'id' | 'message'>> & { message: string; id?: string };

interface ToastStore {
  toasts: Toast[];
  show: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (input) => {
    const id = input.id ?? `toast-${Date.now()}-${++counter}`;
    const toast: Toast = { tone: 'default', duration: 4000, ...input, id };
    // Replace a toast with the same id (e.g. repeated "update available").
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.id !== id), toast].slice(-4) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative helper usable outside React components. */
export const toast = Object.assign(
  (message: string, opts: Omit<ToastInput, 'message'> = {}) => useToastStore.getState().show({ ...opts, message }),
  {
    success: (message: string, opts: Omit<ToastInput, 'message' | 'tone'> = {}) =>
      useToastStore.getState().show({ ...opts, message, tone: 'success' }),
    error: (message: string, opts: Omit<ToastInput, 'message' | 'tone'> = {}) =>
      useToastStore.getState().show({ duration: 8000, ...opts, message, tone: 'error' }),
    dismiss: (id: string) => useToastStore.getState().dismiss(id),
  },
);
