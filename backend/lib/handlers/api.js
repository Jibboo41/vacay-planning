"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const emailParser_1 = require("../use-cases/emailParser");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.post('/api/parse-email', async (req, res) => {
    const { emailText } = req.body;
    if (!emailText) {
        return res.status(400).json({ error: 'emailText is required in the request body.' });
    }
    try {
        console.log("Parsing inbound email text...");
        const itineraryItems = await (0, emailParser_1.parseEmailToItinerary)(emailText);
        console.log(`Successfully parsed ${itineraryItems.length} item(s)!`);
        res.json({ items: itineraryItems });
    }
    catch (error) {
        console.error("Failed to parse email:", error);
        res.status(500).json({ error: `Backend crash: ${error.message || 'Unknown error'}` });
    }
});
app.post('/api/summarize-trip', async (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Valid items array is required in the request body.' });
    }
    try {
        console.log("Generating AI summary for trip...");
        const summary = await (0, emailParser_1.generateTripSummary)(items);
        console.log("Successfully generated summary!");
        res.json({ summary });
    }
    catch (error) {
        console.error("Failed to summarize trip:", error);
        res.status(500).json({ error: `Backend crash: ${error.message || 'Unknown error'}` });
    }
});
// Export the Express app as a Firebase Cloud Function
exports.api = (0, https_1.onRequest)({ secrets: ["GEMINI_API_KEY"] }, app);
// Start local server if NOT running in Firebase context
if (!process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_CONFIG) {
    const port = process.env.PORT || 3003;
    app.listen(port, () => {
        console.log(`🚀 Local dev server active at http://localhost:${port}`);
        console.log(`Use this for rapid local frontend testing!`);
    });
}
