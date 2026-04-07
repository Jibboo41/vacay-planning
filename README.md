# Vacay Planning Application

**Vacay Planning** is a modern, high-performance, responsive travel planning and itinerary management application. It bridges the gap between chaotic trip planning and clean, actionable timelines by leveraging Apple iOS-styled design principles, real-time Firestore persistence, and advanced AI parsing tools to synthesize massive amounts of data into an elegant vacation outline.

---

## 🌟 Key Features

### 🔹 Modern Nav Controls
- **Global Floating Menus**: Replaced the legacy TabBar with a sophisticated dual-FAB navigation layer (Sparkle Menu and View Switcher).
- **iOS-Inspired Aesthetics**: 60px glassmorphic buttons with high-performance backdrop blurs, spring-curved transitions, and symmetric navigation labels.

### 🔹 AI Itinerary Ingestion
- **Email Parser**: Paste raw booking confirmations and Gemini 2.5 Flash will digest, categorize, and intelligently map them into your timeline.
- **Hotel Check-in Extraction**: Automatically identifies "Check-in after" and "Check-out by" times to ensure perfect arrival coordination.
- **Nominatim Geocoder**: Every AI-parsed location is silently validated against OpenStreetMap, resolving precise coordinates and snapping map routes instantly.

### 🔹 Dynamic Trip Outlining
- **Trip Synopsis**: Generate a beautifully written AI summary of your entire journey's vibe and destination trajectory with one click.
- **Compact Summary View**: A presentation-ready, high-density outline of your itinerary. No clutter—just destination names, chronological days, and calculated stay lengths.
- **Responsive Chronology**: Shift your entire trip by dragging a single day. Timeless notes stay fixed, while mapped stops adopt the new timeline automatically.

### 🔹 Leaflet Destination Mapping
- **Interactive Map**: Visualize your stops on a reactive vector map.
- **OSRM Pathfinding**: Automatically draws organic road-routing splines between Destinations in chronological order. Fixed logic re-calculates paths instantly upon itinerary changes.

### 🔹 Travel Power Modules (Phase 2)
- **Todo System**: Specialized trip checklists with cloud sync, and completion tracking.
- **Cost Tracker**: Intelligent expense dashboard that automatically aggregates costs from flights/hotels while allowing manual spending entries.
- **Weather Suite**: Integrated daily forecasts via Open-Meteo API, providing smart destination-aware weather data for all trip dates.
- **Enhanced Grouping**: Sophisticated UI for grouping multi-leg flights and automated rental car pickup/return cycle splitting.

---

## 🏗️ Architecture Matrix

### 🖥️ Frontend (Web App)
- **Framework**: `React.js` via `Vite`
- **State Management**: `Zustand` (Global `useTripStore.ts`)
- **Routing**: `React Router v6`
- **Component Styling**: Extensive custom vanilla CSS mimicking iOS Human Interface Guidelines (Glassmorphism, spring curves).
- **Icons**: `Lucide-React`
- **Map Vector Engine**: `react-leaflet` / `leaflet`

### 🔧 Backend (Server & Database)
- **Service Chassis**: `Firebase Cloud Functions 2nd Gen`
- **Routing Engine**: `Express.js`
- **Database**: `Firebase Firestore` (NoSQL Realtime database)
- **Auth**: `Firebase Authentication` (Email / Credential flows)
- **AI Processing**: `@google/genai` (Gemini 2.5 Flash SDK)

### 🌍 Third-Party Interfacing APIs
- **Google Gemini API**: Synthesizes and extracts trip arrays and generates 1-paragraph trip outline synopses.
- **OpenStreetMap (OSM) / Nominatim**: Resolves plain text query addresses (e.g. "Space Needle") into reverse-geocoded precise decimals, protected by a recursive 1.2s delay logic to respect public DDoSing tolerances.
- **OSRM (Open Source Routing Machine)**: Fetches real-time driving paths drawing organic splines between mapping pins on the Destination timeline.

---

## 📦 Third-Party Software

### Frontend Libraries
- **React & Vite**: Core UI framework and lightning-fast development build tool.
- **Zustand**: Minimalist and high-performance state management for handling trip data globally.
- **Lucide React**: Beautifully crafted open-source icons for Apple-style UI semantics.
- **Leaflet & React-Leaflet**: Open-source mapping engine and its React wrapper for interactive destination pins.
- **React Router**: Industry-standard navigational routing and history management.
- **DND Kit**: Accessible, robust drag-and-drop primitives used for timeline reordering.
- **Firebase SDK**: Client-side library for seamless Firestore and Auth interactions.

### Backend Infrastructure
- **Express.js**: Fast, unopinionated web framework for Node.js powering the API layer.
- **Firebase Admin & Functions**: Cloud-native serverless environment for executing secure backend logic.
- **@google/genai**: Official SDK for low-latency interfacing with Gemini 2.5 models.
- **CORS**: Middleware for controlling secure cross-origin resource sharing between domains.
- **Dotenv**: Zero-dependency module that loads environment variables for security.
- **Jest & TS-Jest**: Comprehensive testing framework used for backend logic verification.

---

## 🗺️ Application Workflows & Diagrams

### User Input Pipeline
Whenever a user adds an activity, either through our rich-data modal or via the magical AI text extraction system, the lifecycle of that data scales linearly through our models before resolving gracefully on the frontend.

\`\`\`mermaid
flowchart TD
  A[User Inputs Data] --> B{Entry Method}
  B -->|AI Parse| C[Express Route: /api/parse-email]
  B -->|Manual Form| D[Validate Form Elements client-side]
  C --> E[Gemini 2.5 synthesizes raw JSON array]
  E --> F[Nominatim API validates coordinates]
  F --> G[Returns mapped Array to Frontend Payload]
  D --> H((Zustand App Store))
  G --> H
  H --> I[(Firestore Synchronizer)]
  I <--> J[Active Realtime Sync]
\`\`\`

### Global UI Routing Diagram
The application centers around an abstract floating control module which manipulates overarching global routing and spawns contextual editing modalities.

\`\`\`mermaid
stateDiagram-v2
  [*] --> TripSelector
  TripSelector --> ActiveTrip: Select Trip
  
  state ActiveTrip {
    direction LR
  state ActiveTrip {
    direction LR
    Timeline(Calendar) <--> Summary(Book)
    Timeline(Calendar) <--> Map(Compass)
    Timeline(Calendar) <--> Todo(CheckSquare)
    Timeline(Calendar) <--> Costs(Wallet)
    Timeline(Calendar) <--> Weather(CloudSun)
    
    note right of Timeline(Calendar)
      Features Draggable DND, Local Timelines,
      and Editing
    end note
  }
  
  ActiveTrip --> GlobalControls : App.tsx Overlay
  GlobalControls --> SparkleMenu : Hover Trigger
  GlobalControls --> ViewSwitcher : Navigation Trigger
  ViewSwitcher --> Todo
  ViewSwitcher --> Costs
  ViewSwitcher --> Weather
  SparkleMenu --> AddNoteModal
  SparkleMenu --> ParseAIModal
  SparkleMenu --> EditActivityModal
\`\`\`

---

## ⚙️ Development Initialization

**Requirements**: NodeJS `>= 18.x`, NPM

1. **Clone & Install**:
   \`\`\`bash
   # Terminal A - Webapp
   cd webapp
   npm install
   
   # Terminal B - Backend
   cd backend
   npm install
   \`\`\`
   
2. **Setup Environments Phase**:
   Ensure you duplicate `.env.example` inside `webapp` to `.env` and map your Firebase `VITE_FIREBASE_` config keys.
   Ensure you duplicate `.env.example` inside `backend` to `.env` and map your `GEMINI_API_KEY`.

3. **Start Servers**:
   \`\`\`bash
   # Terminal A - Webapp
   npm run dev
   
   # Terminal B - Backend
   npm run build:watch
   npm run dev
   \`\`\`

*(Note: Production rollouts leverage `firebase deploy` across hosting, functions, and firestore triggers.)*
