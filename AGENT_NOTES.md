# 🤖 Agent Session Notes
> Last updated: 2026-04-08 | Phase 9 Complete & Deployed

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
│   │   │   ├── TodoScreen.tsx      # Task list with due dates & overdue detection
│   │   │   ├── GlobalControls.tsx  # FAB menus (Sparkle=add, Right=nav)
│   │   │   ├── Sidebar.tsx         # Trip switcher & theme selector
│   │   │   └── modals/
│   │   │       ├── EditItineraryModal.tsx  # Edit any itinerary item
│   │   │       ├── AddItineraryModal.tsx   # AI parse + add items
│   │   │       └── AddNoteModal.tsx        # Quick note creator
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
├── TODO.md                         # Feature backlog
├── CHANGELOG.md                    # Version history
└── README.md                       # Project readme
```

---

## 🏗️ Data Models (`src/core/models.ts`)

### `ItineraryItem`
Key fields: `id`, `type`, `title`, `startDate`, `endDate?`, `location`, `cost?`, `paidAmount?`, `confirmationNumber?`, `description?`, `groupId?`, `sortOrder?`

**Types**: `flight | hotel | rental-car | activity | hiking | food | transit | note`

> ⚠️ The type `'hike'` is normalized to `'hiking'` on save — this was a past bug fix. Never use `'hike'`.

> ⚠️ `'Training'` is NOT a valid category — it was removed from transit. If you see it, it's a legacy item.

### `TodoItem`
Fields: `id`, `text`, `completed`, `createdAt`, `dueDate?` (ISO date string `YYYY-MM-DD`)

### `Expense`
Fields: `id`, `title`, `amount`, `paidAmount`, `paid`, `category`, `date?`, `linkedItemId?`

**Expense categories**: `manual | food | transport | other | itinerary`

> Itinerary-linked expenses are computed from `items` with a `.cost` field — they are NOT stored separately.

### `WeatherDay`
Fields: `date`, `tempHigh`, `tempLow`, `condition?`, `icon?`, `rainfall?` (inches), `snowfall?` (inches), `isHistorical`

### `WeatherCache`
Fields: `tripId`, `lastFetched`, `forecast: WeatherDay[]`

---

## 🔄 State Management (`useTripStore.ts`)

Uses **Zustand**. All data is synced to Firestore via `updateDoc`. Key actions:

- `addItem / updateItem / deleteItem / reorderItems`
- `addTodo(text, dueDate?) / toggleTodo / deleteTodo`
- `addExpense / updateExpense / deleteExpense`
- `updateWeather(WeatherCache)`
- `setEditingItem(item | null)` — triggers the global edit modal in `GlobalControls`
- `setEditingExpense(exp | null)` — triggers expense editing
- `syncTrips(trips)` — called by Firestore real-time listener

**Global editing pattern**: Any screen can call `setEditingItem(item)` and `GlobalControls` will automatically show `EditItineraryModal`. This is the preferred pattern — don't create local edit modals.

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
--sys-bg-elevated: #1C1C1E      /* Use this for card backgrounds */
--sys-bg-elevated-2: #2C2C2E   /* Use for inputs, secondary containers */
--sys-bg-elevated-3: #3A3A3C
--sys-label-primary: #FFFFFF
--sys-label-secondary: rgba(235,235,245,0.60)
--sys-label-tertiary: rgba(235,235,245,0.30)
```

> ⚠️ `--sys-bg-elevated-1` does NOT exist. Use `--sys-bg-elevated` instead.

### Key CSS Classes
- `.modal-backdrop` / `.modal-sheet` — modal system (max-height 88vh, overscroll contained)
- `.travel-card` — glassmorphic itinerary card
- `.screen-header` — top header with safe-area padding
- `.day-section-header` — date group header in timeline
- `.fab-group.left` / `.fab-group.right` — floating action button groups (z-index 2500)
- `.spinning` — CSS spin animation (use on refresh icons)
- `.edit-field-group` / `.edit-field-label` / `.edit-field-input` — form fields in modals

---

## 🌦️ Weather System

**API**: Open-Meteo (https://api.open-meteo.com)
- **Live forecast**: `forecast` endpoint → 7-day, temperature in Fahrenheit
- **Historical averages**: `archive` endpoint, queried for 5 past years on the same date range

**Averaging logic** (in `weatherApi.ts`):
- Loops over 5 past years, fetches `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `snowfall_sum`
- Averages each metric
- Does NOT compute an averaged "condition" label — historical entries show rainfall/snowfall inches instead
- `isHistorical: true` on averaged records

**Units**: °F for temperature, inches for precipitation (mm converted via ÷ 25.4)

---

## 💰 Financial System

Two sources of expense data displayed in `CostTrackerScreen`:
1. **Itinerary items** with a `.cost` field — computed on-the-fly, not stored in `expenses[]`
2. **Manual expenses** stored in `expenses[]` in Firestore

**Payment tracking**:
- `paidAmount` on `ItineraryItem` — editable via `EditItineraryModal`
- `paidAmount` on `Expense` — editable via expense editing flow
- If `paidAmount > amount`, shown in red as over-budget
- Cost tracker header shows: Total Planned | Paid | Remaining

---

## 📱 Known iOS Behaviors / Gotchas

- **Safe area insets**: Use `env(safe-area-inset-top)` etc. Header already handles this.
- **Modal height**: Set to `88vh` to leave room for iOS browser chrome. Header uses `paddingTop: 'env(safe-area-inset-top)'`
- **Date strings**: Always parse with `replace(/-/g, '/')` before `new Date()` to avoid UTC-midnight timezone drift. The store's `getDayKey()` handles this.
- **Touch drag**: Custom touch drag implemented in `TimelineScreen` — uses `touchmove` with `passive: false`. Don't rely on HTML5 drag API on iOS.
- **Overscroll**: `.modal-backdrop` has `overscroll-behavior: contain` to prevent background scroll.

---

## 🧭 Navigation

**Route structure** (React Router):
- `/timeline` — Itinerary timeline (default landing after login)
- `/map` — Leaflet map
- `/summary` — AI-generated outline
- `/todo` — Task list
- `/costs` — Cost tracker
- `/weather` — Weather screen

**Navigation UI**: Right FAB (bottom right) opens view switcher. Order from bottom: Timeline → Map → Outline → Todos → Costs → Weather.

**Add content**: Left FAB (bottom left, Sparkle icon) opens: AI Parse | Manual Entry | Note

---

## 🚀 Deployment

```powershell
# From /webapp
npm run build

# From project root
npx firebase deploy --only hosting
```

Full deploy (including Cloud Functions): `npx firebase deploy`

Firebase project ID: `vacay-planning`

---

## ✅ Phase 9 — Completed (2026-04-08)

- [x] Historical precipitation (rainfall/snowfall in inches) in weather averages
- [x] Removed condition labels from historical weather data
- [x] Weather refresh button spinning animation
- [x] Daily H/L temperature in timeline day headers (aggregated across all stops)
- [x] Retired `DetailsModal` — items expand inline in timeline
- [x] Clicking timeline item → directly opens `EditItineraryModal`
- [x] `paidAmount` field on `ItineraryItem` + editing in modal
- [x] Clear buttons for all optional date/time fields in edit modal
- [x] Smart end-date defaulting (mirrors start date on focus)
- [x] iOS safe-area fix for edit modal header
- [x] Cost tracker redesigned with prominent financial summary header
- [x] Cost tracker reads `paidAmount` from itinerary items
- [x] Todo due dates with calendar picker
- [x] Overdue todos highlighted in red
- [x] Swapped Timeline/Map nav button order
- [x] FAB z-index bumped to 2500 (above map legend)
- [x] Modal overscroll containment
- [x] Modal height 88vh
- [x] Standardized `--sys-bg-elevated` tokens (removed broken `elevated-1` refs)

---

## 🗺️ Backlog (Future Work)

- [ ] **AllTrails Scraper** — Parse hiking URLs to auto-fill trail stats (distance, elevation)
- [ ] **Trip Sharing** — Invite collaborators to view/edit a shared trip
- [ ] **Offline Mode (PWA)** — Full offline read/write via Service Worker
- [ ] **Google Maps API** — Replace Leaflet/OSM with official Google Maps (needs paid key)
- [ ] **Edit due date on existing todos** — Currently can only set on creation; no edit UI
- [ ] **Manual expense editing** — UI for editing paid amount on manual expenses exists via `setEditingExpense` but the editing modal/view needs verification
