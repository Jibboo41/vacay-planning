import type { ItineraryItem } from '../core/models';

const isProd = import.meta.env.PROD;

// In production (Firebase), we use a relative path /api.
// In development, we try to find the backend on the same IP as the frontend (port 3003).
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isProd ? '' : `http://${window.location.hostname}:3003`);

export async function parseItinerary(emailText: string, tripTitle: string = ''): Promise<ItineraryItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailText, tripTitle }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend networking error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to communicate intimately with Node backend:", error);
    throw error;
  }
}

export async function parseAllTrailsUrl(url: string, tripTitle: string = ''): Promise<{ title: string; difficulty: string; duration: string; distance: string; elevation: string; startAddress?: string; startLat?: number; startLng?: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse-hike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, tripTitle }), // Send the URL payload
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Parsing failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to call parse-hike on backend:", error);
    throw error;
  }
}

export async function scoutDining(location: string, tripTitle: string = ''): Promise<{ name: string; address: string; rating: string; description: string; cuisineType: string }[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scout-dining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location, tripTitle }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scouting failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to call scout-dining on backend:", error);
    throw error;
  }
}
