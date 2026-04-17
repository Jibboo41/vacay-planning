import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export interface ScoutedRestaurant {
  name: string;
  address: string;
  rating: string;
  description: string;
  cuisineType: string;
  happyCowUrl?: string;
  officialUrl?: string;
  distance?: string;
  lat?: number;
  lng?: number;
}

export async function scoutVegetarianRestaurants(location: string, tripTitle: string = ''): Promise<ScoutedRestaurant[]> {
  const prompt = `
You are an expert vegetarian/vegan food guide. 
Search the web for the top 5 highly-rated vegetarian or vegan restaurants near "${location}".
Focus on results from HappyCow, Yelp, and local food blogs. 
Priority should be given to fully vegan or strictly vegetarian establishments.

Return ONLY a valid JSON array of objects matching the following schema.
Do not include markdown blocks like \`\`\`json, return pure JSON.

Schema:
[
  {
    "name": "Restaurant Name",
    "address": "Full street address, city, state",
    "rating": "Numerical rating (e.g. 4.8) and source (e.g. HappyCow)",
    "description": "1-2 sentence description highlighting why a vegetarian would love it.",
    "cuisineType": "e.g. Italian, Thai, Bakery, etc.",
    "happyCowUrl": "Link to this restaurant on HappyCow.net (highly preferred)",
    "officialUrl": "Link to the restaurant's official website",
    "distance": "Estimated distance from ${location} (e.g. '0.4 miles away' or '5 min walk')"
  }
]

Contextual Trip Area: ${tripTitle}
Location to Search: ${location}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const textOutput = response.text || "[]";
    const cleanedJsonString = textOutput.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    const startIndex = cleanedJsonString.indexOf('[');
    const endIndex = cleanedJsonString.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Failed to find JSON array. Output was: ${cleanedJsonString.substring(0, 100)}...`);
    }
    
    const jsonStr = cleanedJsonString.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonStr) as ScoutedRestaurant[];
    
    // --- Sequential Geocoding for Mapping Stability ---
    // We resolve lat/lng for each restaurant so they appear on the map instantly.
    for (const res of parsedData) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(res.address)}&format=json&limit=1`;
        const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'VacayPlanner/1.1' } });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData[0]) {
            res.lat = parseFloat(geoData[0].lat);
            res.lng = parseFloat(geoData[0].lon);
          }
        }
        // Respect Nominatim's 1 req/sec rate limit
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (e) {
        console.warn(`Geocoding failed for ${res.name}:`, e);
      }
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error scouting restaurants with Gemini:", error);
    throw error;
  }
}
