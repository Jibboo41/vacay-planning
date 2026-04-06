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

### 1. Build and Deploy Everything
From the **root** folder:
```powershell
firebase deploy
```

### 2. Set Secrets (First Time Only)
Since the backend uses Gemini AI, you must securely store your API key in Firebase:
```powershell
firebase functions:secrets:set GEMINI_API_KEY
```
*When prompted, paste your Gemini API key.*

---

## 📡 Deployment URLs
- **Frontend**: [https://vacay-planning.web.app](https://vacay-planning.web.app)
- **Backend (API)**: `https://us-central1-vacay-planning.cloudfunctions.net/api`
  *(Note: After the first deploy, you'll see your exact function URL in the terminal. Copy that into your `webapp/.env.local` as `VITE_API_URL`.)*

## ⚠️ Troubleshooting

### Authorized Domains
If your Google Sign-in fails on the live site, ensure your production URL is authorized:
1. Go to **Firebase Console** > **Authentication** > **Settings**.
2. Click **Authorized domains**.
3. Add `vacay-planning.web.app` (it may already be there by default).
