# Vacay Planning Application

**Vacay Planning** is a modern, high-performance, responsive travel planning and itinerary management application. It bridges the gap between chaotic trip planning and clean, actionable timelines by leveraging Apple iOS-styled design principles, real-time Firestore persistence, and advanced AI parsing tools to synthesize massive amounts of data into an elegant vacation outline.

---

## 🌟 Key Features

### 🔹 Modern Nav Controls
- **Minimalist Layout**: Icon-only floating menus (Sparkle Menu and View Switcher) for a clean, distraction-free aesthetic.
- **iOS-Inspired Aesthetics**: 60px glassmorphic buttons with spring-curved transitions and balanced 50/50 desktop split-view.

### 🔹 AI Itinerary Ingestion
- **Email Parser**: Paste raw booking confirmations and Gemini 2.5 Flash will digest, categorize, and intelligently map them into your timeline.
- **Hotel Check-in Extraction**: Automatically identifies "Check-in after" and "Check-out by" times to ensure perfect arrival coordination.
- **Nominatim Geocoder**: Every AI-parsed location is silently validated against OpenStreetMap, resolving precise coordinates and snapping map routes instantly.

### 🔹 Dynamic Trip Outlining
- **Trip Synopsis**: Generate a beautifully written AI summary of your entire journey's vibe and destination trajectory with one click.
- **Balanced Desktop Split**: A 50/50 grid layout provides equal real-estate for the Timeline and Map on desktop screens.
- **Advanced Reordering**: Full drag-and-drop support for all items, including hotel check-outs and rental car returns, automatically recalculating routes and stay durations.

### 🔹 Leaflet Destination Mapping
- **Interactive Map**: Visualize your stops on a reactive vector map.
- **Dynamic Control**: The left-side Sparkle menu automatically hides in the map view to provide an unobstructed view of the map legend and navigation markers.
- **OSRM Pathfinding**: Automatically draws organic road-routing splines between Destinations in chronological order. Fixed logic re-calculates paths instantly upon itinerary changes.

### 🔹 Travel Power Modules
- **Todo System**: Trip checklists with due-date tracking, overdue highlighting, inline edit, and drag-to-reorder via grip handle.
- **Global Event Filtering**: Toggle visibility for specific categories (Flights, Hotels, Rentals, Activities, etc.) across both the Timeline and Map via the Sidebar to focus on specific trip segments.
- **Cost Tracker**: Comprehensive expense dashboard aggregating itinerary costs with paid/remaining split tracking and over-budget alerts.
- **Weather Suite**: Integrated daily forecasts via Open-Meteo API with **5-year historical precipitation averages** (rainfall + snowfall in inches) and daily H/L aggregated across all stops.
- **Enhanced Grouping**: Multi-leg flight grouping and automated rental car pickup/return cycle splitting.

### 🔹 Financial Management
- **Settlement Engine**: `paidAmount` field on itinerary items and manual expenses with over-budget detection (highlighted in red).
- **Deep Linking**: Clickable expense rows trigger itinerary editing directly from the Costs screen.
- **Prominent Summary**: Trip Financials header shows large total cost with Paid and Remaining breakdowns.
- **Global Orchestration**: Centralized modal management for consistent, cross-screen editing.

### 🔹 Climatic Intelligence
- **Historical Precipitation**: 5-year averaged rainfall and snowfall data (imperial units) replaces subjective condition labels.
- **Daily H/L Aggregation**: Timeline day headers display the range of high/low temps across all stops for that day.
- **Animated Refresh**: Spinning animation on the weather update button provides tactile feedback.

### 🔹 Glass UI & Themes
- **Glass Blue Buttons**: All primary actions use a frosted glass treatment instead of solid opaque blue.
- **10 Themes**: Default, Sunset, Midnight, Forest, Aurora, Desert Rose, Deep Ocean, Vulcan, Sakura, Cyberpunk — each with gradient swatch previews in the sidebar.
- **Ambient Background**: Three animated color blobs behind all content, colors driven by selected theme.

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

---

## 📺 Phase 13: The Modernization Sprint (v1.7.0)
- **Desktop Split-View**: Automatic dual-pane layout (Timeline + Map) on screens >= 1000px.
- **Interactive Map Filtering**: Click a day in the legend to toggle its visibility on the map instantly.
- **Chronological Integrity**: Every day in a trip range is now displayed in the Summary, including empty placeholders.
- **Virtual Item Management**: Hotel checkouts and rental returns are now fully draggable and update their respective end-dates.
- **iOS Zoom Prevention**: Globally enforced 16px font sizes on all inputs to stop intrusive browser auto-zooming.
- **Duplicate Trip**: One-click "Copy" function in the Trip Selector to clone itineraries.
- **Deletion Action**: Integrated Trash icons in the expanded itinerary view for manual maintenance.
- **Cost Extraction**: AI Parser now identifies and populates 'Total Cost' and 'Paid Amount' from booking emails.
