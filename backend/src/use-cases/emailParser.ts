import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { ItineraryItem } from '../core/models';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export async function parseEmailToItinerary(emailText: string): Promise<ItineraryItem[]> {
  const prompt = `
You are a highly capable travel planning assistant. Extract itinerary details from the following email text.
Return ONLY a valid JSON array of ItineraryItem objects, following this schema:
[
  {
    "id": "unique-uuid-or-string",
    "type": "flight" | "hotel" | "activity" | "unknown",
    "startDate": "ISO 8601 date string",
    "endDate": "ISO 8601 date string (optional)",
    "title": "Short title (e.g., Flight DL123 to LAX, or Glacier Hotel Stay)",
    "location": {
      "name": "Name of the location",
      "address": "Full physical address, as specific as possible",
      "latitude": "A strictly valid floating point decimal measuring latitude precisely for this address",
      "longitude": "A strictly valid floating point decimal measuring longitude precisely for this address"
    },
    "description": "Any remaining useful info like confirmation codes or rules",
    "confirmationNumber": "string if available"
  }
]
Do not include markdown blocks like \`\`\`json, return pure JSON.

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
    return JSON.parse(jsonStr) as ItineraryItem[];
  } catch (error) {
    console.error("Error parsing email with Gemini:", error);
    throw error;
  }
}
