import type { Expense, ItineraryItem } from './models';

export const EXPENSE_CATEGORIES: Expense['category'][] = [
  'Car Rental', 'Flights', 'Transit', 'Gas', 'Dining', 'Lodging', 'Souvenirs', 'Other',
];

export function itineraryExpenseCategory(type: ItineraryItem['type']): Expense['category'] {
  switch (type) {
    case 'flight': return 'Flights';
    case 'transit': return 'Transit';
    case 'hotel': return 'Lodging';
    case 'rental-car': return 'Car Rental';
    case 'food': return 'Dining';
    default: return 'Other';
  }
}

export function normalizeExpenseCategory(category: string): Expense['category'] {
  if (EXPENSE_CATEGORIES.includes(category as Expense['category'])) return category as Expense['category'];
  if (category === 'food') return 'Dining';
  if (category === 'transport' || category === 'transit') return 'Transit';
  return 'Other';
}
