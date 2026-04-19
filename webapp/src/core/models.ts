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
  happyCowUrl?: string;
  officialUrl?: string;
}

export interface HotelDetails {
  refundable: boolean;
  refundableCutoffDate?: string;
  bookingSource?: string;
}

export interface RentalDetails {
  refundable: boolean;
  refundableCutoffDate?: string;
  bookingSource?: string;
}

export interface FlightDetails {
  refundable: boolean;
  refundableCutoffDate?: string;
  bookingSource?: string;
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
  hotelDetails?: HotelDetails;
  rentalDetails?: RentalDetails;
  flightDetails?: FlightDetails;
  /** Manual sort order within a day — set after user drag-reorders */
  sortOrder?: number;
  /** Independent sort order for the end-event of multi-day items (e.g. Hotel Checkout) */
  endSortOrder?: number;
  /** Custom cost for this item (e.g. flight price, hotel total) */
  cost?: number;
  /** Amount already paid specifically for this itinerary item */
  paidAmount?: number;
  /** ID to group multiple flight legs or related items */
  groupId?: string;
}

export interface TripNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
  notes?: string;
}

export interface PackingItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'Luggage' | 'Carry-on' | 'Personal Item' | 'Other';
  createdAt: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;       // Estimated cost
  paidAmount: number;   // Actually paid
  category: 'Car Rental' | 'Flights' | 'Gas' | 'Dining' | 'Lodging' | 'Souvenirs' | 'Other';
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
  lat?: number;
  lon?: number;
}

export interface WeatherCache {
  lastUpdated: number;
  forecast: WeatherDay[];
}
