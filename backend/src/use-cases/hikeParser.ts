import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export interface HikeDetails {
  title: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Expert';
  duration: string;
  distance: string;
  elevation: string;
}

export async function parseAllTrailsLink(url: string): Promise<HikeDetails> {
  const prompt = `
You are a highly capable travel planning assistant. I am providing you with a link to a trail on AllTrails. 
Use your Google Search capability to find the details of this specific trail.
Return ONLY a valid JSON object matching the following schema.
Do not include markdown blocks like \`\`\`json, return pure JSON.

Schema:
{
  "title": "Name of the trail (e.g., Vernal and Nevada Falls via the Mist Trail)",
  "difficulty": "Must be exactly one of: Easy, Moderate, Hard, Expert",
  "duration": "The estimated time it takes to complete (e.g., '2h 30m', '4.5 hours'). Leave as empty string if unknown.",
  "distance": "The total distance including the unit (e.g., '5.2 mi', '8 km')",
  "elevation": "The elevation gain including the unit (e.g., '1,500 ft', '400 m')"
}

AllTrails URL: ${url}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const textOutput = response.text || "{}";
    const cleanedJsonString = textOutput.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    const startIndex = cleanedJsonString.indexOf('{');
    const endIndex = cleanedJsonString.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Failed to find JSON object. Output was: ${cleanedJsonString.substring(0, 100)}...`);
    }
    
    const jsonStr = cleanedJsonString.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonStr) as HikeDetails;
    
    return parsedData;
  } catch (error) {
    console.error("Error parsing AllTrails link with Gemini:", error);
    throw error;
  }
}
