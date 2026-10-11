import { useEffect, useRef } from 'react';

/** True when the event target is somewhere the user is typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type;
    return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color'].includes(type);
  }
  return false;
}

/** True when a modal dialog is open (shortcuts other than Esc should be ignored). */
export function isDialogOpen(): boolean {
  return !!document.querySelector('[role="dialog"][aria-modal="true"]');
}

export type HotkeyHandler = (e: KeyboardEvent) => void;

/**
 * Global keyboard shortcuts. Keys are matched against `event.key`
 * (case-insensitive for letters); prefix with `mod+` for ⌘ / Ctrl.
 * Plain-key shortcuts are ignored while typing in inputs or with modifiers held.
 */
export function useHotkeys(bindings: Record<string, HotkeyHandler>, enabled = true) {
  const ref = useRef(bindings);
  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const combo = mod ? `mod+${key}` : key;
      const handler = ref.current[combo];
      if (!handler) return;
      if (!mod && (e.altKey || isTypingTarget(e.target))) return;
      handler(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
