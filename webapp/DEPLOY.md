# 🚀 Deploying to Firebase

This guide explains how to build and deploy updates to your Vacay Planner app so that it can be accessed from any device via your public URL.

## 🛠 Prerequisites

Ensure you have the latest dependencies and tools installed. From the `webapp` directory, run:
```powershell
npm install
```

## 🔐 Authentication

If you are on a new machine or your session has expired, you must log in to your Firebase account:
```powershell
npx firebase login
```
*A browser window will open. Sign in with the Google account associated with your Firebase project.*

## 📦 Building & Deploying

To push your latest code changes (both Frontend and Backend) to the live website, follow these steps:

### 1. Deploy Frontend Only (Hosting)
From the **root** folder:
```powershell
npx firebase deploy --only hosting
```
> ℹ️ This builds the React app and uploads it. Use this for most UI changes.

### 2. Deploy Everything (Hosting + Cloud Functions)
```powershell
npx firebase deploy
```
> ⚠️ Requires the backend to build successfully. Use when backend logic changes.

### 3. Set Secrets (First Time or Key Rotation)
Since the backend uses Gemini AI, you must securely store your API key in Firebase so the Functions can access it:
```powershell
npx firebase functions:secrets:set GEMINI_API_KEY
```
*When prompted, paste your Gemini API key.*

### 3. Verify Local Env
Ensure your `webapp/.env` contains the correct `VITE_API_URL` pointing to your deployed Firebase Function (e.g. `https://us-central1-vacay-planning.cloudfunctions.net/api`).

---

## 📡 Deployment URLs
- **Frontend**: [https://vacay-planning.web.app](https://vacay-planning.web.app)
- **Backend (API)**: `https://us-central1-vacay-planning.cloudfunctions.net/api`
  *(Note: Ensure your `VITE_API_URL` in `.env` matches your deployed function URL.)*

## 🗺️ External APIs & Integrations

The Vacay Planner relies on several free, open-source APIs that do not require authentication keys. When troubleshooting data loading issues on the deployed site:

### Map Routing (OSRM) & Geocoding (Nominatim)
- **Nominatim (OpenStreetMap)**: Used for resolving destination coordinates (e.g. converting "Phoenix Sky Harbor" to lat/lng). Requests are restricted to `countrycodes=us` and are rate-limited.
- **OSRM (Open Source Routing Machine)**: Used to generate the driving paths (red splines) between destinations.
- **Route Caching**: The application utilizes a robust `routeCache` mechanism stored in memory. It tracks coordinate fingerprints. If a path seems "stuck" or incomplete, the cache may be holding stale data. Toggling the "Day Visibility" filters on/off forces a cache invalidation and triggers a fresh OSRM recalculation.

### Weather API (Open-Meteo)
The Weather module uses the **Open-Meteo API**. It pulls both a 7-day live forecast and a massive 5-year historical average to calculate precise rainfall/snowfall expectations. For high-frequency use, ensure the backend respects rate limits (currently handled via frontend caching in `useTripStore`).

## ⚠️ Troubleshooting

### Authorized Domains
If your Google Sign-in fails on the live site, ensure your production URL is authorized:
1. Go to **Firebase Console** > **Authentication** > **Settings**.
2. Click **Authorized domains**.
3. Add `vacay-planning.web.app` (it may already be there by default).
