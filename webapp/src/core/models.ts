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

export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'hiking' | 'transit' | 'food' | 'note' | 'unknown';
  startDate: string;
  endDate?: string;
  title: string;
  description?: string;
  confirmationNumber?: string;
  location: Location;
  hikeDetails?: HikeDetails;
  /** Manual sort order within a day — set after user drag-reorders */
  sortOrder?: number;
}
