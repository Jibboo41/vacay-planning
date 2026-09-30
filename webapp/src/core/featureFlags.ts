/**
 * Lightweight feature flags. A flag is on when either the build-time env var
 * `VITE_FEATURE_<NAME>=1` is set or `localStorage['vacay:ff:<name>'] === '1'`.
 */
export type FeatureFlag = 'sharing';

const ENV: Record<FeatureFlag, string | undefined> = {
  sharing: import.meta.env.VITE_FEATURE_SHARING,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (ENV[flag] === '1' || ENV[flag] === 'true') return true;
  try {
    return localStorage.getItem(`vacay:ff:${flag}`) === '1';
  } catch {
    return false;
  }
}
