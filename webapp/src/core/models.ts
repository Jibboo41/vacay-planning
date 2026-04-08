export interface Location {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface HikeDetails {
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  distance: string;
  duration: string;
  elevation: string;
  allTrailsLink?: string;
}

export interface FoodDetails {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
}

export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'hiking' | 'hike' | 'transit' | 'food' | 'note' | 'rental-car' | 'unknown';
  startDate: string;
  endDate?: string;
  title: string;
  description?: string;
  confirmationNumber?: string;
  location: Location;
  hikeDetails?: HikeDetails;
  foodDetails?: FoodDetails;
  /** Manual sort order within a day — set after user drag-reorders */
  sortOrder?: number;
  /** Custom cost for this item (e.g. flight price, hotel total) */
  cost?: number;
  /** Amount already paid specifically for this itinerary item */
  paidAmount?: number;
  /** ID to group multiple flight legs or related items */
  groupId?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;       // Estimated cost
  paidAmount: number;   // Actually paid
  category: 'itinerary' | 'manual' | 'food' | 'transport' | 'other';
  date?: string;
  paid: boolean;        // Settlement status
  linkedItemId?: string; // Links to an ItineraryItem.id 
}

export interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  isHistorical?: boolean;
  rainfall?: number;  // Inches
  snowfall?: number;  // Inches
}

export interface WeatherCache {
  lastUpdated: number;
  forecast: WeatherDay[];
}
