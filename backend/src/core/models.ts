export interface Location {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'unknown';
  startDate: string; // ISO 8601
  endDate?: string;  // ISO 8601
  title: string;
  location: Location;
  description?: string;
  confirmationNumber?: string;
}

export interface Trip {
  id: string;
  title: string;
  items: ItineraryItem[];
}
