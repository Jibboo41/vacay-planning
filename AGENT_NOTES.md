# 🤖 Agent Session Notes
> Last updated: 2026-04-09 | Phase 13 Modernization Complete

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
