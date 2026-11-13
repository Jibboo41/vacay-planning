import { describe, expect, it } from 'vitest';
import { itineraryExpenseCategory, normalizeExpenseCategory } from '../src/core/expenseCategories';

describe('transit expense classification', () => {
  it('puts non-flight transit in Transit while retaining the other travel categories', () => {
    expect(itineraryExpenseCategory('transit')).toBe('Transit');
    expect(itineraryExpenseCategory('flight')).toBe('Flights');
    expect(itineraryExpenseCategory('rental-car')).toBe('Car Rental');
    expect(itineraryExpenseCategory('activity')).toBe('Other');
  });
  it('recognizes manual Transit and legacy transport expenses', () => {
    expect(normalizeExpenseCategory('Transit')).toBe('Transit');
    expect(normalizeExpenseCategory('transport')).toBe('Transit');
    expect(normalizeExpenseCategory('transit')).toBe('Transit');
    expect(normalizeExpenseCategory('Flights')).toBe('Flights');
    expect(normalizeExpenseCategory('Other')).toBe('Other');
  });
});
