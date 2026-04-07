import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { ItineraryItem } from '../core/models';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export async function parseEmailToItinerary(emailText: string, tripTitle: string = ''): Promise<ItineraryItem[]> {
  const prompt = `
You are a highly capable travel planning assistant. Extract itinerary details from the following email text.
Return ONLY a valid JSON array of ItineraryItem objects, following this schema:
[
  {
    "id": "unique-uuid-or-string",
    "type": "flight" | "hotel" | "activity" | "rental-car" | "unknown",
    "groupId": "Optional. For FLIGHTS with multiple legs, use the SAME 'groupId' for all legs within that itinerary.",
    "startDate": "YYYY-MM-DDTHH:mm:ss format. ALWAYS include the time. Extract specific times like 'Check-in after 4:00 PM' (16:00:00). If no time is found, default to 12:00:00. DO NOT include a timezone offset or 'Z' suffix.",
    "endDate": "YYYY-MM-DDTHH:mm:ss format (optional). Extract specific times like 'Check-out by 11:00 AM' (11:00:00). If no time is found, default to 12:00:00. DO NOT include a timezone offset or 'Z' suffix.",
    "title": "Short title (e.g., Flight DL123 to LAX, or Glacier Hotel Stay)",
    "location": {
      "name": "Name of the location",
      "address": "Full physical address, as specific as possible",
      "latitude": "A roughly estimated floating point decimal measuring latitude",
      "longitude": "A roughly estimated floating point decimal measuring longitude"
    },
    "description": "Any remaining useful info like confirmation codes or rules. Use standard newlines (\\n) for line breaks to ensure paragraph formatting.",
    "confirmationNumber": "string if available"
  }
]
Do not include markdown blocks like \`\`\`json, return pure JSON.
ALWAYS prioritize extracting check-in/check-out times for hotels, pickup/return times for rental cars, takeoff/landing times for flights, and reservation times for dining.
For RENTAL CARS, return ONE entry with startDate (pickup) and endDate (return).

Email text:
${emailText}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const textOutput = response.text || "[]";
    const cleanedJsonString = textOutput.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const startIndex = cleanedJsonString.indexOf('[');
    const endIndex = cleanedJsonString.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Failed to find JSON array. Output was: ${cleanedJsonString.substring(0, 50)}...`);
    }
    const jsonStr = cleanedJsonString.substring(startIndex, endIndex + 1);
    const parsedItems = JSON.parse(jsonStr) as ItineraryItem[];

    console.log(`AI parsing finished, mapped ${parsedItems.length} items. Validating location coordinates via Nominatim...`);
    
    // OpenStreetMap Location Crawler (1.2s delay to prevent hard-rate limiting)
    for (const item of parsedItems) {
      if (item.location && item.location.address) {
        try {
          await new Promise(r => setTimeout(r, 1200));
          // Use tripTitle as a context hint for better geocoding accuracy
          const query = tripTitle ? `${item.location.address}, ${tripTitle}` : item.location.address;
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
              headers: { 'User-Agent': 'VacayPlanner/1.0 (Integration Crawler)' }
          });
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
              item.location.latitude = parseFloat(geoData[0].lat);
              item.location.longitude = parseFloat(geoData[0].lon);
              // Clean up naming convention naturally
              if (!item.location.name || item.location.name === 'TBD') {
                  item.location.name = item.location.address.split(',')[0];
              }
          }
        } catch (err) {
          console.warn('Geocoding traversal validation failed for item:', item.title);
        }
      }
    }
    
    return parsedItems;
  } catch (error) {
    console.error("Error parsing email with Gemini:", error);
    throw error;
  }
}

export async function generateTripSummary(items: ItineraryItem[]): Promise<string> {
  const prompt = `
You are a highly capable travel planning assistant. I will provide you with a JSON array representing a chronological vacation itinerary. 
Your job is to read it carefully and synthesize a single, beautifully written paragraph summarizing the trip trajectory, overall vibe, and key destinations. 
Do not include any greeting or signature. Use standard newlines if you must break up text.
Return ONLY this magical text paragraph. Format it cleanly. 

Here is the itinerary:
${JSON.stringify(items, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating trip summary:", error);
    throw error;
  }
}

