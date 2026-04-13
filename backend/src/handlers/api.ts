import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { parseEmailToItinerary, generateTripSummary } from '../use-cases/emailParser';
import { parseAllTrailsLink } from '../use-cases/hikeParser';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/parse-email', async (req: express.Request, res: express.Response) => {
  const { emailText, tripTitle } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'emailText is required in the request body.' });
  }

  try {
    console.log("Parsing inbound email text...");
    const itineraryItems = await parseEmailToItinerary(emailText, tripTitle || '');
    console.log(`Successfully parsed ${itineraryItems.length} item(s)!`);
    res.json({ items: itineraryItems });
  } catch (error: any) {
    console.error("Failed to parse email:", error);
    res.status(500).json({ error: `Backend crash: ${error.message || 'Unknown error'}` });
  }
});

app.post('/api/summarize-trip', async (req: express.Request, res: express.Response) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Valid items array is required in the request body.' });
  }

  try {
    console.log("Generating AI summary for trip...");
    const summary = await generateTripSummary(items);
    console.log("Successfully generated summary!");
    res.json({ summary });
  } catch (error: any) {
    console.error("Failed to summarize trip:", error);
    res.status(500).json({ error: `Backend crash: ${error.message || 'Unknown error'}` });
  }
});

app.post('/api/parse-hike', async (req: express.Request, res: express.Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required in the request body.' });
  }

  try {
    console.log("Parsing AllTrails URL with AI Search Grounding...");
    const hikeDetails = await parseAllTrailsLink(url);
    console.log(`Successfully extracted details for: ${hikeDetails.title}`);
    res.json(hikeDetails);
  } catch (error: any) {
    console.error("Failed to parse AllTrails link:", error);
    res.status(500).json({ error: `Backend crash: ${error.message || 'Unknown error'}` });
  }
});

// Export the Express app as a Firebase Cloud Function
export const api = onRequest({ secrets: ["GEMINI_API_KEY"] }, app);

// Start local server if NOT running in Firebase context
if (!process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_CONFIG) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    console.log(`🚀 Local dev server active at http://localhost:${port}`);
    console.log(`Use this for rapid local frontend testing!`);
  });
}
