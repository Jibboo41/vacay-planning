export type Appearance = 'dark' | 'light';

export function readAppearance(): Appearance {
  try {
    return localStorage.getItem('vacay_appearance') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyAppearance(appearance: Appearance) {
  document.documentElement.dataset.appearance = appearance;
  document.documentElement.style.colorScheme = appearance;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', appearance === 'light' ? '#f0f2f8' : '#0f1014');
}
