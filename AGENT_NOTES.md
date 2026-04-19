- **Phase 71 (Packing List & Grid Menu)**:
    - **Packing System**: Introduced `PackingItem` with `category` metadata. Created `PackingScreen.tsx` (view route `/packing`).
    - **UI Pattern**: Implemented **Segmented Control** for tag-based selection in packing (replaces standard select dropdowns).
    - **Navigation Redesign**: Overhauled Right FAB View Switcher to a **3x3 Grid Menu**. Added icon-label pairs for improved recognition. 8 modules: Timeline, Map, Summary, Todo, Costs, Weather, Notes, Packing.
    - **Stability**: Fixed a critical weather sync bug by adding `refreshWeather` triggers to `addItem` and `updateItem` in `useTripStore.ts`.
    - **Map Refinement**: Legend label changed to "Between Days".
- **Phase 70 (Color Palette Pivot)**:
    - **Dining (food)**: Shifted to **System Purple (#BF5AF2)** across Map, Timeline, and Costs.
    - **Rental Cars**: Shifted to **Light Sky Blue (#64D2FF)** across Map, Timeline, and Costs.
    - **Hotels**: Returned to **System Orange (#FF9F0A)** for better distinction from Meals.
    - **Consistency**: Synchronized colors in `CostTrackerScreen.tsx` and `SummaryScreen.tsx`.
- **Phase 69 (Dining Discovery 2.0 Refinements)**:
    - **Color Hierarchy**: Shifted Dining (food) to **System Yellow (#FFD60A)** and Notes to **System Gray (#8E8E93)**. This ensures visual separation from Orange Hotel markers and Red Check-out alerts.
    - **Automated Geocoding**: Implemented sequential Nominatim geocoding in `scoutDining.ts` (backend). Scouted results now return with `lat/lng` for instant mapping visibility.
    - **UI Polish**: Updated `AiScoutModal.tsx` indicators and result badges to match the yellow theme.
- **Phase 68 (Dining Scout Proximity & Structured Editing)**:
    - **Distance Awareness**: Prompted Gemini to return estimated distances from search location.
    - **Structured Data**: Migrated HappyCow/Official links to explicit `FoodDetails` fields. Added a themed "Dining Discovery" section in `EditItineraryModal.tsx`.
- **Phase 67 (Dining Scout UX Refinements)**:
    - **FAB Reorder**: Priority swap of Dining Scout and Email Parser.
    - **Button Logic**: Rendered links as premium glass action buttons in `TimelineItem.tsx`.
- **Phase 54 (Weather Accuracy & Detail)**:
    - **Smart Splitting**: Refactored `fetchWeather` to split requests at T+16 threshold. Concurrent Forecast/Historical fetching.
    - **Weather Detail Modal**: Interactivity on `WeatherScreen.tsx` allowing users to inspect precipitation and larger icons.
- **Phase 53 (Weather Polish)**:
    - **Sync Indicators**: Added `isWeatherRefreshing` to store. Integrated spinning `RefreshCw` icons in Timeline day headers and Weather screen button.
- **Phase 52 (Summary Cleanup & Flight Grouping)**:
    - **Grouping Logic**: Implemented 1-dimensional grouping for flights sharing the same day and contiguous index.
    - **Hike Stats**: Injected hiking metadata into `SummaryItemCard`.
- **Phase 51 (Summary Detail Shift)**:
    - **Minimalism**: Stripped refundable markers from summary view.
- **Phase 50 (Weather Sync & Currency)**:
    - **Currency Formatting**: Enforced `.toFixed(2)` globally.
    - **Weather Store Fetching**: Centralized `refreshWeather` logic.
- **Phase 49 (AllTrails Sanitization)**:
    - **Mobile Link Support**: Robustified `EditItineraryModal.tsx` to handle "messy" share links from the AllTrails mobile app. Strips leading text and `?` query parameters before API ingestion.
- **Phase 48 (Map Routing Backlog)**:
    - **Accommodation Origin**: Investigated logic to start daily routes from the last hotel. Reverted due to edge-case instability; moved to backlog for future refinement.
- **Phase 47 (Data Portability & Scraper)**:
    - **ExcelJS Export**: Replaced basic CSV with premium, styled `.xlsx` reports. Includes themed day grouping and automated financial summaries.
    - **AllTrails Scraper**: Implemented backend-driven parsing for AllTrails URLs. Automatically extracts trail titles, difficulty, distance, and elevation directly into itinerary items.
- **Phase 46 (Per-Stop Weather)**:
    - **Granular Models**: Updated `WeatherDay` to include `lat/lon` metadata.
    - **Batch Fetching**: Refactored `WeatherScreen.tsx` to identify all unique stop coordinates and fetch/deduplicate multi-point forecasts.
    - **Aggregate Rendering**: `SummaryScreen` and `TimelineScreen` now use `Math.max/min` across all matching date-point sets to show true day extremes.
    - **Icon-Free UI**: Stripped all weather icons and bar charts from the timeline and summary views to focus on pure data (H/L temps).
- **Phase 45 (Refinement & Portability)**:
    - **Note Rendering**: Specialized `TimelineItem.tsx` logic to elevate note titles to badges and auto-expand descriptions. Removed redundant titles in card body.
    - **Routing Robustness**: Added signal-based cancellation and 10s timeouts to `fetchOSRMRoute` in `MapViewScreen.tsx`. Refined UI with glassy loading/error indicators.
    - **Export Logic**: Introduced `exportUtils.ts` for CSV generation of itinerary items and expenses. Added Export button to `Sidebar.tsx`.
- **Phase 44 (Action UI Refinement)**:
    - **FAB Collision Fix**: Shifted `.fab-group.left` to `16px` from edge to avoid exact overlap with the `44px` travel-card leading icon column on mobile.
    - **Visual Contrast**: Applied a `2px` white border and deepened shadows to global FABs to prevent blending into tinted item backgrounds.
    - **Icon Harmonization**: Migrated action icons from emojis to matching Lucide SVG counterparts in `GlobalControls.tsx`.
    - **Modal Consistency**: Finalized `AddNoteModal.tsx` styling using the `.btn-glass-blue` global class for full UI unification.
- **Phase 43 (Tinted Backgrounds)**:
    - **Global Settings Entry**: Added `tintedBackgrounds` to `TripStore` with `localStorage` persistence (`vacay_tinted_backgrounds`).
    - **Conditional Styling**: `TimelineItem.tsx` now dynamically toggles between standard glass background and category-specific `theme.bg` color based on the store's `tintedBackgrounds` flag.
    - **UI Interaction**: Implemented a custom glass-style toggle switch in the `Sidebar` appearance menu for immediate visual feedback.
- **Phase 42 (Palette Refresh)**:
    - **Color Logic Shift**: Re-defined semantic coloring across `TimelineItem`, `SummaryScreen`, `MapViewScreen`, and `CostTrackerScreen`.
    - **Palette Mapping**: `Hotel` -> Orange (`#FF9F0A`), `Hike` -> iOS Green (`#30D158`), `Activity` -> Grey (`#EBEBF5`), `Dining` -> Purple (`#BF5AF2`), `Rental Car` -> Light Blue (`#64D2FF`).
    - **Maintenance Note**: Ensure all hardcoded hex strings in inline styles (e.g., expanded view badges) are updated alongside the `getTheme` switches to prevent visual regressions.
- **Phase 41 (AllTrails AI Extraction)**:
    - **Google Search Grounding**: AllTrails heavily limits standard headless bots (403 limits). Uses `@google/genai` with `tools: [{ googleSearch: {} }]` natively in the cloud function `/api/parse-hike` to tap the Google Search index. Avoid headless puppeteer scripts as they break on deploy.
    - **Trail Map Extraction**: Parses Title, Difficulty, Elevation, Distance, Duration, and precisely extracts the starting trailhead `startAddress`, `startLat`, and `startLng` to seamlessly populate the standard location fields, ensuring the Google Maps Map View routes appropriately to the mountain and not a generic town.
- **Phase 40 (General Trip Notes & Map Day Routing)**:
    - **General Trip Notes**: `TripNote` interface modeled unattached to timeline dates. Supported by DND mechanics and `reorderGeneralNotes` bound to native touch events just like `TodoScreen`. `<Linkified>` dynamically casts all text URL instances out of simple strings to blank tabs.
    - **Day Map Routing**: Generated via `handleOpenMap` dynamically in `Timeline` header. Yields robust cross-platform URL mapping via `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints.join('|')}` filtering out flights to prevent global driving paths between continents.
- **Phase 39 (Map & Note Refinement)**:
    - **Advanced Map Routing**: Uses `segments: { type: 'driving' | 'flight', coords }[]` and a `routeCache` (segments based) for instant visibility toggling.
    - **Self-Updating Cache**: `routeCache` keys now append flight coordinates `...-${lat}-${lng}` so resolving an airport automatically busts the stale cache and triggers a redraw of that day (fixes disconnected final paths).
    - **Clustered OSRM Fallback**: Added a forced 2-point line generation if OSRM returns a path `< 2` coordinates long to prevent disappearing segments over short distances.
    - **Universal Flight Logic**: Every item with `type === 'flight'` renders a dashed air path. Terminal markers (`_isFlightTakeoff`) are only generated for flights not followed by another flight.
    - **Virtual Marker Visibility**: Flight Landing markers are explicitly filtered by `mappable.some(m => m.id === id)` to ensure they respect the dynamic `hiddenDayFilters` array state.
    - **Map Bounds Filtering**: Leaflet's `allPositions` bounding box strictly ignores coordinates from `flightLandings` if their corresponding parent flight is hidden from the `mappable` array.
    - **Synchronized Map Sorting**: The `mappable` array uses an identical sorting logic snippet as `TimelineScreen`, explicitly evaluating `sortOrder` overrides, ensuring 1:1 timeline-to-map sequential rendering.
    - **Geocoding Accuracy**: Nominatim searches are restricted to `countrycodes=us`, prioritize `[Code] International Airport`, and strictly append the destination city to banish major-hub hijacking (e.g. JFK).
    - **Standardized Notes**: Grey themes, no time display, simplified edit modals. `TodoItem` model extended to support optional `notes` with expandable textarea UI in `TodoScreen`.
    - **Sticky DND Polish**: Timeline `onMove` drop targets now persist unless dragging entirely out of day limits, guaranteeing easy release. Tripled `start-day-drop-zone` height to `24px`.
- **Phase 22 (Branding & Detail Refinement)**:
    - **Branding**: Deployed custom PNG logo to `public/logo.png`. Updated `index.html` with `apple-touch-icon`.
    - **Refundable System**: Added `FlightDetails` to the model. Normalized `refundableCutoffDate` across Hotels, Flights, and Rentals.
    - **Display Logic**: Implemented auto-formatting for cutoff dates (e.g., `new Date(d.replace(/-/g, '/'))`) to prevent UTC offset issues.
    - **Cost UX**: Styled native `<select>` with custom SVG chevron and glass aesthetics for consistency.
- **Data Hardening**: Standardized date reconciliation for cross-browser reliability (ISO parsing fixes).
- **Rental Car Branding**: Updated car segments to use consistent purple branding across all screens.

These notes are for the AI agent to resume work on this project without needing conversation history.

---

## 📍 Project Overview

**Vacay Planner** — An iOS-inspired travel itinerary web app (PWA).
- **Live URL**: https://vacay-planning.web.app
- **Repo**: https://github.com/Jibboo41/vacay-planning
- **Stack**: React + TypeScript + Vite + Firebase (Firestore + Auth + Hosting)
- **Styling**: Vanilla CSS with iOS-style glassmorphism dark theme
- **Maps**: Leaflet + OpenStreetMap (not Google Maps — no paid API key)
- **Weather**: Open-Meteo API (free, no key needed)
- **AI**: Google Gemini via Firebase Cloud Function backend

---

## 🗂️ Project Structure

```
vacay-planning/
├── webapp/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── TimelineScreen.tsx  # Main itinerary view with day grouping & drag-drop
│   │   │   ├── TimelineItem.tsx    # Individual itinerary card (expandable)
│   │   │   ├── MapViewScreen.tsx   # Leaflet map view
│   │   │   ├── WeatherScreen.tsx   # Weather forecast (historical 5yr avg + live)
│   │   │   ├── CostTrackerScreen.tsx # Financial overview & expense tracking
│   │   │   ├── SummaryScreen.tsx   # AI-generated trip outline
│   │   │   ├── TodoScreen.tsx      # Task list with due dates, inline edit, drag reorder
│   │   │   ├── GlobalControls.tsx  # FAB menus (Sparkle=add, Right=nav)
│   │   │   ├── Sidebar.tsx         # Trip switcher & theme selector (gradient swatches)
│   │   │   └── modals/
│   │   │       ├── EditItineraryModal.tsx   # Edit any itinerary item
│   │   │       ├── EditManualExpenseModal.tsx # Edit manual expenses
│   │   │       ├── AddItineraryModal.tsx    # AI parse + add items
│   │   │       └── AddNoteModal.tsx         # Quick note creator
│   │   ├── core/
│   │   │   ├── models.ts           # TypeScript data models (see below)
│   │   │   └── firebase.ts         # Firebase app init
│   │   ├── store/
│   │   │   └── useTripStore.ts     # Zustand global store (all actions live here)
│   │   ├── data/
│   │   │   └── weatherApi.ts       # Open-Meteo weather fetching & averaging
│   │   └── index.css               # Global CSS design system (DO NOT use Tailwind)
│   ├── DEPLOY.md                   # Deploy instructions
│   └── dist/                       # Built output (gitignored)
├── backend/                        # Firebase Cloud Functions (Node.js)
│   └── src/index.ts                # Gemini AI endpoint
├── AGENT_NOTES.md                  # This file
├── TODO.md                         # Feature backlog
├── CHANGELOG.md                    # Version history
└── README.md                       # Project readme
```

---

## 🏗️ Data Models (`src/core/models.ts`)

### `ItineraryItem`
Key fields: `id`, `type`, `title`, `startDate`, `endDate?`, `location`, `cost?`, `paidAmount?`, `confirmationNumber?`, `description?`, `groupId?`, `sortOrder?`

**Types**: `flight | hotel | rental-car | activity | hiking | food | transit | note`

> ⚠️ `'hike'` is normalized to `'hiking'` on save. Never use `'hike'`.
> ⚠️ `'Training'` is NOT a valid category — removed from transit.

### `TodoItem`
Fields: `id`, `text`, `completed`, `createdAt`, `dueDate?` (ISO date string `YYYY-MM-DD`)

### `Expense`
Fields: `id`, `title`, `amount`, `paidAmount`, `paid`, `category`, `date?`, `linkedItemId?`

**Categories**: `manual | food | transport | other | itinerary`
> Itinerary-linked expenses are computed from `items` with `.cost` — NOT stored separately.

### `WeatherDay`
Fields: `date`, `tempHigh`, `tempLow`, `condition?`, `icon?`, `rainfall?` (inches), `snowfall?` (inches), `isHistorical`

---

## 🔄 State Management (`useTripStore.ts`)

Uses **Zustand**. All data synced to Firestore via `updateDoc`. Key actions:

- `addItem / updateItem / deleteItem / reorderItems`
- `addTodo(text, dueDate?) / updateTodo(id, {text?, dueDate?}) / toggleTodo / deleteTodo / reorderTodos(newOrder[])`
- `addExpense / updateExpense / deleteExpense`
- `updateWeather(WeatherCache)`
- `setEditingItem(item | null)` — triggers global edit modal in `GlobalControls`
- `setEditingExpense(exp | null)` — triggers expense editing
- `toggleFilter(type)` — toggles visibility for specific event types (stored in `activeFilters[]`)
- `syncTrips(trips)` — called by Firestore real-time listener

**Global editing pattern**: Any screen can call `setEditingItem(item)` and `GlobalControls` will automatically show `EditItineraryModal`. This is the preferred pattern.

**localStorage keys**: `vacay_current_trip_id`, `vacay_theme`

---

## 🎨 CSS Design System (`index.css`)

### CSS Variables
```css
--sys-blue: #0A84FF
--sys-red: #FF453A
--sys-green: #30D158
--sys-orange: #FF9F0A
--sys-purple: #BF5AF2
--sys-bg-base: #000000
--sys-bg-elevated: #1C1C1E      /* Card backgrounds */
--sys-bg-elevated-2: #2C2C2E   /* Inputs, secondary containers */
--sys-bg-elevated-3: #3A3A3C
--sys-label-primary: #FFFFFF
--sys-label-secondary: rgba(235,235,245,0.60)
--sys-label-tertiary: rgba(235,235,245,0.30)
```

> ⚠️ `--sys-bg-elevated-1` does NOT exist. Use `--sys-bg-elevated`.

### Key CSS Classes
- `.btn-glass-blue` — frosted glass button (rgba blue bg, border, backdrop-filter). Use on ALL primary blue actions.
- `.modal-backdrop` / `.modal-sheet` — modal system (88vh max-height, overscroll contained)
- `.travel-card` — glassmorphic itinerary card
- `.screen-header` — top header with safe-area padding
- `.day-section-header` — date group header in timeline
- `.fab-group.left` / `.fab-group.right` — FABs (z-index 2500)
- `.spinning` — CSS spin animation
- `.edit-field-group` / `.edit-field-label` / `.edit-field-input` — form fields in modals

---

## 🌈 Theme System

Themes are set via `useTripStore.setTheme(key)` and stored in `localStorage` as `vacay_theme`.

`App.tsx` maps theme key → three blob colors in `getThemeBlobs()`. The blobs are `div.blob-1/2/3` in `.ambient-bg`.

**Available themes** (10 total):
| Key | Name | Blob colors |
|-----|------|-------------|
| `default` | Default | Blue, Purple |
| `sunset` | Sunset | Red, Orange, Yellow |
| `midnight` | Midnight | Indigo, Purple, Cyan |
| `forest` | Forest | Green, Mint, Cyan |
| `aurora` | Aurora | Mint, Violet, Cyan |
| `desert` | Desert Rose | Terracotta, Rose, Gold |
| `ocean` | Deep Ocean | Sky, Teal, Indigo |
| `vulcan` | Vulcan | Lava, Amber, Pink-Red |
| `sakura` | Sakura | Pink, Lavender, Blush |
| `cyberpunk` | Cyberpunk | Magenta, Cyan, Yellow |

The **Sidebar** theme picker renders these as gradient gradient-swatch tiles (emoji + name + active glow ring).
Adding a new theme: add a case to `getThemeBlobs`, add a row to the Sidebar array.

---

## 🌦️ Weather System

**API**: Open-Meteo (https://api.open-meteo.com)
- **Live forecast**: 7-day, temperature in Fahrenheit
- **Historical averages**: 5 past years, same date range → averaged per field

**For historical records**: Shows `rainfall` + `snowfall` in inches instead of a condition label. `isHistorical: true`.

**Units**: °F for temperature, inches for precipitation (mm ÷ 25.4).

---

## 💰 Financial System

Two sources of expense data in `CostTrackerScreen`:
1. **Itinerary items** with `.cost` — computed on-the-fly, NOT stored in `expenses[]`
   - `paidAmount` comes from `item.paidAmount` (editable via `EditItineraryModal`)
2. **Manual expenses** stored in `expenses[]`
   - `paidAmount` editable via `EditManualExpenseModal`

Cost tracker header shows: **Large total** | Paid (green) | Remaining (blue).
If `paidAmount > amount` → shown in red as over-budget.

---
 
 ## ✅ Timeline Item — Layout & Grouping Rules
 
- **Grouping Logic (Flatten & Global Sort)**: 
  - To handle multi-day hotel/rental car returns correctly, the timeline uses a "Flatten and Global Sort" strategy.
  - All real items + virtual "checkout/return" items are flattened into a single array.
  - Each item is assigned a `_renderDate` (either `startDate` or `endDate` for checkouts).
  - The array is sorted globally by `_renderDate` and `sortOrder`.
  - Finally, the sorted list is grouped into days. This ensures that a 10 AM return on Wednesday sorts correctly among other Wednesday items, even if the pickup was on Monday.
- **Header Row**: Contains the date label (e.g., TUE, JUL 28), START/END time badges, and the drag-handle grip.
- **Body Row**: Contains the icon, text column (Title + Location), and chevron.
- **Vertical Efficiency**: Times in the header row free up horizontal space for long titles and locations.
- **Cross-day Indicator**: If an activity ends on a subsequent day, the END badge displays a subtle blue `+N` indicator (e.g., `+1`).
- **Time Badges**:
  - **Start Time**: Semantic color (theme.color) with background (`theme.bg`). Labels: TAKEOFF, CHECK-IN, PICKUP, START.
  - **End Time**: Neutral gray (`rgba(255,255,255,0.06)`). Labels: LANDING, END.
- **Display Rules (Collapsed)**:
  - **flight**: ✅ Always shows LANDING if `endDate` has a time.
  - **activity / hiking / transit / food / note**: ✅ Always shows END time.
  - **hotel / rental-car**: ❌ End time NOT shown collapsed (visible in expanded view only).
- **Display Rules (Expanded)**:
  - **hotel / rental-car**: ✅ Cross-day checkout/return date shown in expanded content as a badge.
  - **Other types**: ❌ End time suppressed (already visible in collapsed state).

---

## 📝 Todo System Rules

- **Adding**: Text + optional due date. Due date picker in the add form.
- **Editing**: Pencil icon → inline edit (text + due date + Clear button). Confirm with ✓, cancel with ✕.
- **Drag reorder**: GripVertical handle — supports both mouse drag (HTML5) and touch drag.
- **Overdue**: If `dueDate` is past today and `!completed` → text shows `⚠` prefix, due date shown in `var(--sys-red)`.
- **Store actions**: `addTodo`, `updateTodo`, `toggleTodo`, `deleteTodo`, `reorderTodos`

---

## 📱 iOS Behavior Gotchas

- **Safe area**: Use `env(safe-area-inset-top)` etc. Header already handles this.
- **Modal height**: `88vh` to leave room for iOS browser chrome.
- **Date strings**: Always parse with `.replace(/-/g, '/')` before `new Date()` to avoid UTC midnight drift.
- **Touch drag**: Custom touch drag in `TimelineScreen` and `TodoScreen` — uses `touchmove` with `passive: false`. Don't rely on HTML5 drag API on iOS.
- **Overscroll**: `.modal-backdrop` has `overscroll-behavior: contain`.

---

## 🧭 Navigation

**Routes**: `/timeline` (default), `/map`, `/summary`, `/todo`, `/costs`, `/weather`

**FAB order** (right, bottom-up): Timeline → Map → Outline → Todos → Costs → Weather

**Add content** (left FAB, Sparkle): AI Parse | Manual Entry | Note
- ⚠️ **Map View**: The Sparkle FAB is conditionally HIDDEN on the Map view to avoid legend overlap.

**Global Filtering**: 
- Accessible via the **Sidebar** -> "Filter Views".
- Toggles visibility for: `flight`, `hotel`, `rental-car`, `activity`, `hiking`, `food`, `note`, `transit`.
- Applied globally to both **Timeline** (pre-grouping) and **Map** (marker/route filtering).

**Start date/time on itinerary items**: REQUIRED — do NOT add Clear buttons. Only end date/time is optional (has Clear).

---

## 🚀 Deployment

```powershell
# From project root — builds webapp then deploys to Firebase Hosting
npx firebase deploy --only hosting

# Full deploy (hosting + cloud functions):
npx firebase deploy
```

Firebase project ID: `vacay-planning`
Live URL: https://vacay-planning.web.app

---

## 🗺️ Backlog (Future Work)

- [ ] **AllTrails Scraper** — Parse hiking URLs to auto-fill trail stats
- [ ] **Trip Sharing** — Invite collaborators to view/edit
- [ ] **Offline Mode (PWA)** — Full offline read/write via Service Worker
- [ ] **Google Maps API** — Replace Leaflet/OSM with official Google Maps
- [ ] **Multi-stop Flight UI** — Better grouping for complex connections

---

## 🧪 Phase 13 Technical Implementation Details

### Desktop Split View
- **Threshold**: `1000px` screen width.
- **Mechanism**: `MainLayout.tsx` detects width and renders a `.split-layout` grid.
- **Left Pane**: Pinned `TimelineScreen` with overflow-y auto.
- **Right Pane**: Contextual view defaulting to `MapViewScreen`.

### Interactive Map Filtering
- **State**: `hiddenDayFilters[]` in the store.
- **Logic**: Legend items click toggle visibility. `MapViewScreen` filters its marker array and OSRM route fetchers based on this array.

### Itinerary Reordering (Suffix Handling)
- `reorderItems` now strips `-checkout` and `-return` suffixes to identify the "real" parent item.
- Moving a checkout item updates the parent's `endDate`.

### iOS Auto-Zoom Mitigation
- iOS Safari zooms if font-size < 16px.
- **Audit**: Standardized `16px` across `EditItineraryModal`, `AddItineraryModal`, `AddNoteModal`, and `TripSelector`.

### AI Cost Parsing
- Prompt updated in `backend/src/use-cases/emailParser.ts` to extract `cost` and `paidAmount` fields.
