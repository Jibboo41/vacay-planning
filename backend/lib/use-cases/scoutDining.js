"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoutVegetarianRestaurants = scoutVegetarianRestaurants;
require("dotenv/config");
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });
async function scoutVegetarianRestaurants(location, tripTitle = '') {
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
    "officialUrl": "Link to the restaurant's official website"
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
        const parsedData = JSON.parse(jsonStr);
        return parsedData;
    }
    catch (error) {
        console.error("Error scouting restaurants with Gemini:", error);
        throw error;
    }
}
