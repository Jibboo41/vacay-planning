import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyAppearance, readAppearance } from '../src/core/appearance';

describe('appearance', () => {
  beforeEach(() => localStorage.clear());
  it('preserves Dark as the default and restores a saved Light choice', () => {
    expect(readAppearance()).toBe('dark');
    localStorage.setItem('vacay_appearance', 'light');
    expect(readAppearance()).toBe('light');
    localStorage.setItem('vacay_appearance', 'invalid');
    expect(readAppearance()).toBe('dark');
  });
  it('updates the document, native controls, and browser chrome together', () => {
    const setAttribute = vi.fn();
    const documentElement = { dataset: {} as Record<string, string>, style: { colorScheme: '' } };
    vi.stubGlobal('document', { documentElement, querySelector: () => ({ setAttribute }) });
    applyAppearance('light');
    expect(documentElement.dataset.appearance).toBe('light');
    expect(documentElement.style.colorScheme).toBe('light');
    expect(setAttribute).toHaveBeenCalledWith('content', '#f0f2f8');
    applyAppearance('dark');
    expect(documentElement.style.colorScheme).toBe('dark');
  });
});
