"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAllTrailsLink = parseAllTrailsLink;
require("dotenv/config");
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });
async function parseAllTrailsLink(url) {
    const prompt = `
You are a highly capable travel planning assistant. I am providing you with a link to a trail on AllTrails. 
Use your Google Search capability to find the details of this specific trail.
Return ONLY a valid JSON object matching the following schema.
Do not include markdown blocks like \`\`\`json, return pure JSON.

Schema:
{
  "title": "Name of the trail (e.g., Vernal and Nevada Falls via the Mist Trail)",
  "difficulty": "Must be exactly one of: Easy, Moderate, Hard, Expert",
  "length": "The estimated time it takes to complete (e.g., '2h 30m', '4.5 hours'). Leave as empty string if unknown.",
  "distance": "The total distance including the unit (e.g., '5.2 mi', '8 km')"
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
        const parsedData = JSON.parse(jsonStr);
        return parsedData;
    }
    catch (error) {
        console.error("Error parsing AllTrails link with Gemini:", error);
        throw error;
    }
}
