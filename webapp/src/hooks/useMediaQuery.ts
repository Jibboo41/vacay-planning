import { useCallback, useSyncExternalStore } from 'react';

/** Subscribe to a CSS media query (SSR-safe; no resize listeners). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop split layout breakpoint (matches Tailwind's `wide:` custom breakpoint of 1000px). */
export const WIDE_QUERY = '(min-width: 1000px)';

export function useIsWide() {
  return useMediaQuery(WIDE_QUERY);
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
