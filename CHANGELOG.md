# Changelog

All notable changes to the **Vacay Planning** project will be documented in this file.

## [1.31.0] - 2026-04-17
### Added
- **Color Palette Pivot**: Transitioned **Dining** to System Purple (#BF5AF2) and **Rental Cars** to Light Sky Blue (#64D2FF) for improved category differentiation.
- **Financial Sync**: Synchronized the new color hierarchy with the Cost Tracker category summary and detail badges.
- **Note Standardization**: Normalized **Notes** to System Gray (#8E8E93) as part of the overall UI hierarchy cleanup.

## [1.30.0] - 2026-04-17
### Added
- **Dining Discovery 2.0**: Overhauled the "Veggie Scout" into a centralized, trip-aware discovery workflow with automated geocoding.
- **AI Proximity Intelligence**: The scout now returns estimated distances (e.g., "0.4 miles away") relative to your selected reference point.
- **Structured Dining Links**: HappyCow and Official Website links are now stored as explicit data fields and rendered as premium glass action buttons (AllTrails style).
- **Thematic Edit Form**: Implemented a "Dining Discovery" section in the Edit Modal for structured metadata management.

## [1.29.0] - 2026-04-17
### Added
- **Gemini "Veggie Scout"**: Implemented a search-grounded restaurant discovery feature using the existing Google AI infrastructure. Users can now scout for top-rated vegetarian and vegan locations near their destinations directly from the Timeline view.
- **Hotel-Origin Routing**: Implemented intelligent stay-aware routing. The Destinations map and the "Map Day" button now automatically include the active hotel or rental car as the start/end point for intermediate stay days. Improved routing stability with throttled OSRM requests and retries.

## [1.28.0] - 2026-04-14
### Added
- **Premium Map Popups**: Overhauled Leaflet popups with a modern, glassmorphic design. Integrated system typography, category-specific colored accents, and glassy blue interactive buttons.

## [1.27.0] - 2026-04-14
### Added
- **Manual Map Refresh**: Added a refresh button to the Destinations (Map) header to resolve routing anomalies. Clicking it clears the local route cache and re-fetches all road and air paths from OSRM and Nominatim.

## [1.26.0] - 2026-04-14
### Added
- **Phase 56 (Map Popup Overhaul)**:
    - **Global Styling**: Stripped Leaflet defaults in `index.css`. Applied `var(--glass-bg)` and `backdrop-filter`.
    - **Interactive Popups**: Updated `MapViewScreen.tsx` to use system tokens for text and glassy buttons for map links.
- **Phase 55 (Map Route Refresh)**:
    - **Manual Cache Clearing**: Added `handleRefresh` to `MapViewScreen.tsx` which clears `routeCache` and `flightLandings`.
    - **UI Button**: Added a `RefreshCw` button to the map header for manual sync.
- **Phase 54 (Weather Accuracy & Detail)**:
- **Interactive Weather Detail**: Clicking any day in the Weather screen now opens a premium, glassmorphic Detail Modal with high-resolution icons and precipitation (Rain/Snow) statistics.
- **Smart Forecast Splitting**: Refactored the weather API to automatically split date ranges across the 16-day forecast threshold. The app now displays live forecast data for early trip days and historical averages for later days within the same view.

## [1.25.0] - 2026-04-14
### Added
- **Background Weather Sync Feedback**: Users now see a spinning refresh icon on the Timeline (replacing temperatures) and on the Weather Screen whenever a background sync is active (e.g. after moving an item).

## [1.24.0] - 2026-04-14
### Added
- **AllTrails Link Sanitization**: Robustified the Quick Import tool to handle mobile app share links by automatically stripping leading descriptive text and tracking parameters.

## [1.23.0] - 2026-04-14
### Added
- **Centralized Weather Engine**: Migrated weather fetching to the global store for multi-screen access and background sync.
- **Last Updated Status**: Weather view now displays a human-readable "Last updated" timestamp.
- **Currency Standardization**: Enforced strict two-decimal formatting ($0.00) across all financial views (Timeline, Cost Tracker).

### Changed
- **Automated Refreshes**: Moving itinerary items on the timeline now automatically triggers background weather updates to keep forecasts in sync with dates.

## [1.22.0] - 2026-04-14
### Added
- **AllTrails Link Sanitization**: Robustified the Quick Import tool to handle mobile app share links by automatically stripping leading descriptive text and tracking parameters.

## [1.21.0] - 2026-04-14
### Added
- **Premium Excel Export**: Upgraded export to high-fidelity **Excel (.xlsx)** format with professional styling, themed categories, and balance summaries for Google Sheets.
- **Hiking Stats Automation**: Integrated **AllTrails Scraper** to automatically populate hiking items with trail stats (Distance, Difficulty, Elevation, Duration) via direct link parsing.

## [1.20.0] - 2026-04-12
### Added
- **Hike Stats (Summary)**: Integrated trail stats (Difficulty, Distance, Elevation, Duration) directly into the summary Cards.
- **Per-Stop Weather**: Integrated detailed weather forecasts directly into the itinerary view for each stop.
- **Dynamic Aggregation**: Implemented real-time data aggregation for trip-wide summaries and financial breakdown.

## [1.11.7] - 2026-04-11
### Added
- **Refundable Cutoff Tracking**: Users can now track "Refundable Until" dates for Flights, Hotels, and Rental Cars.
- **Flight Detail Expansion**: Marked flights as refundable and added booking source tracking.
- **Custom App Branding**: Implemented a new premium Vacay logo across all platforms (web favicon and iOS home screen icons).
### UI/UX
- **Cost Tracker Polish**: Renamed 'Manual/Extra' to 'Manual' and applied glass-morphism styling to category selection dropdowns.
- **Badge Synchronization**: Added formatted refundable badges to both Timeline and Summary views.



## [1.11.2] - 2026-04-10
### Fixed
- **AI Date Reconstruction**: Overhauled the date sanitizer to manually rebuild dates from unstructured AI output, ensuring consistency via trip-year validation.
- **iOS Safari Refinement**: Normalized height and padding for Date/Time inputs in Safari to prevent layout overflows.
- **Split-View Background**: Restored desktop split-view transparency to allow ambient themed backgrounds to flow across the entire UI.
- **UI Resilience**: Added "Date TBD" fallbacks to Timeline and Summary views to prevent "NaN" error displays.

## [1.11.1] - 2026-04-10
### Fixed
- **Timeline Reordering**: Fixed a bug where moving a Hotel checkout or Rental Car return would accidentally reset the start date of the item.
- **AI Date Sanitization**: Overhauled the year-sanitizer to catch and fix "NaN" or missing years during AI imports, preventing "Invalid Date" UI crashes.
- **Expense UI Logic**: Removed the "TBD" fallback text for undated expenses for a cleaner look.
### UI/UX
- **Edit Expense Polish**: Swapped button positions (Save on left, Delete on right) to match iOS ergonomics and standardized date input scaling.

## [1.11.0] - 2026-04-10
### Fixed
- **Map Routing Overhaul**: Redesigned the path calculation engine to use parallel fetches with `AbortController` timeouts (6s), resolving the infinite "Calculating routes..." hang on slow networks.

## [1.10.2] - 2026-04-10
### Fixed
- **Desktop Split-View Scrolling**: Fixed a CSS regression in `.split-right` that prevented independent content scrolling on widescreen displays.

## [1.10.1] - 2026-04-10
### Changed
- **Weather Icon Refinement**: Replaced the emoji-based bargraph (📊) on the Summary screen with the premium Lucide `BarChart3` icon for better visual consistency with the main Weather view.

## [1.10.0] - 2026-04-10
### Fixed
- **Weather Icon Rendering**: Switched to emoji-compatible text spans on SummaryScreen to fix broken image placeholders (question marks) on iOS.
- **Unified Ergonomics**: Finalized "Save" on Left placement across all mobile entry forms (Todo & Expense).

## [1.9.9] - 2026-04-10
### Changed
- **Unified Ergonomics**: Swapped "Save" and "Cancel" on Expense form to match Todo form (Primary action on Left).

## [1.9.8] - 2026-04-10
### Added
- **Visual Unification**: Synchronized Todo and Expense form card styles (Elevated-2 bg + Blue border focus) for consistent transparency and highlighting on iOS.

### Fixed
- **iOS Date Overflow**: Implemented robust overflow-hidden containment for all date inputs to ensure they respect container boundaries on mobile.

## [1.9.7] - 2026-04-10
### Fixed
- **iOS Todo Reordering**: Added `e.preventDefault()` to touch move events and `touch-action: none` to handles to prevent page scrolling during drag operations.
- **Form Scaling**: Standardized date input containment to prevent layout overflow on narrow iOS viewports.

### Changed
- **Button Ergonomics**: Swapped "Save Task" and "Cancel" positions on Todo form for better mobile reach; updated to equal-width premium button styling.
- **Todo Reorder Engine**: Refactored logic to use `document.elementFromPoint` for high-reliability target detection.

## [1.9.6] - 2026-04-10
### Added
- **Trip Renaming**: Inline title editing support in Sidebar with real-time Firestore sync.
- **Collapsible Sidebar Sections**: Added theme picker collapsing for a cleaner UI.
- **Enhanced Debug Trace**: Improved System Logs screen with high-contrast raw data visualization.

## [1.9.0] - 2026-04-10
### Added
- **System Trace Logs**: Dedicated `/debug` screen for real-time monitoring of API interactions and background sync.
- **Todo System Overhaul**: Replaced inline inputs with a structured "New Todo" form and hardened reordering logic.
- **Weather Integration**: Added H/L temperatures and condition icons directly to itinerary headers.

## [1.8.0] - 2026-04-09
### Added
- **Financial Status Parity**: Removed visibility dimming on paid items in Cost Tracker; fixed currency alignment.
- **Rental Car Summaries**: Itinerary summary view now uses 'PICKUP' and 'RETURN' labels for rental entries.
- **RentalCar Metadata**: Added "Booked via" and "Refundable" fields to rental car items.

## [1.7.0] - 2026-04-09 (Modernization & Desktop Split-View)

### 🖥️ Responsive Architecture
- **Desktop Split-View**: Refactored `App.tsx` and `index.css` to enable a side-by-side Timeline and Map layout on screens >= 1000px.
- **MainLayout Middleware**: Isolated split-logic into a dedicated layout component for cleaner prop propagation.

### 🗺️ Mapping & Interaction
- **Interactive Map Legend**: The map legend is now an interactive filter; clicking a day toggles its markers/routes visibility.
- **Inter-Day Route Bridging**: Routes now bridge the gap between the last stop of Day N and the first of Day N+1, as well as same-day checkout/checkin transitions.
- **Dynamic Legend Position**: Legend automatically adjusts based on hidden/visible days.

### 📋 Outline & Summary Integrity
- **Empty Day Padding**: Added logic to `SummaryScreen.tsx` to ensure all days in a trip range are rendered, even if scheduling gaps exist.
- **Virtual Entry Persistence**: Fixed a bug where rental returns weren't appearing in the summary; updated the chronological sorting engine to handle all virtual events correctly.

### 🛡️ UX Hardening & Utilities
- **iOS Zoom Prevention**: Audited and enforced 16px font sizes across all inputs and modals to prevent browser auto-zoom.
- **Itinerary Deletion**: Added a "Delete Item" (Trash) action to the expanded state of all timeline items.
- **Trip Duplication**: New "Copy" action in the `TripSelector` screen for cloning trip templates.
- **AI Cost Extraction**: Updated the backend `emailParser.ts` prompt to extract `cost` and `paidAmount` from receipts.

## [1.6.0] - 2026-04-08 (Advanced Settlement & Integrated Editing)

### 💳 Precision Expense Control
- **Settlement Logic**: Transitioned from binary "Paid" status to granular `paidAmount` tracking, supporting partial payments and debt management.
- **Over-Budget Detection**: Automated highlighting and system-wide alerts when actual payments exceed estimated costs.
- **Improved Cost Tracker UI**: New settlement-focused list layout with "DUE" and "PAID" badges and clickable chevron navigation.

### 🔗 Global Edit Orchestration
- **Cross-Component Triggers**: Itinerary-linked expenses now directly trigger the detail editor for their parent activity, even from the financial screens.
- **Specialized Manual Editor**: New dedicated modal for tuning manual trip costs with estimation vs. actual tracking.
- **Unified State Management**: Centralized all modal lifecycle logic in the global store for extreme architectural reliability.

## [1.5.0] - 2026-04-08 (Financial Command & Multi-Year Weather)

### 💰 Financial Precision (Cost Tracker)
- **Paid Status Management**: Implemented a "Paid" checkbox for manual expenses, allowing users to settled individual costs.
- **Budgeting Logic**: Added "Total Planned" vs "Remaining to Pay" counters in the header to provide instant financial visibility.
- **Dynamic Activity Icons**: Manual expenses linked to itinerary items now intelligently mirror that item's icon (e.g., Mountain for Hikes, Bed for Hotels).
- **Flexible Entry**: Made dates optional for manual expenses, supporting "TBD" costs and generic trip savings.

### 🌤️ Climatic Intelligence (Weather)
- **5-Year Multi-Year Averaging**: For long-term planning (>16 days), the app now fetches and averages historical data from the last 5 years for superior climatic outlooks.
- **Fahrenheit Transition**: Standardized all temperature data across Forecast and Historical modes to Fahrenheit (°F).
- **Averaging UI**: Added "(5yr Avg)" labels to historical data and standardized temperature iconography.

### 🧹 UI & Categorization Cleanup
- **Transit Refinement**: Renamed "Transit / Training" category to "Transit" in all modals and tooltips.
- **Improved Header Labels**: Polished cost and weather header stats for better readability.

## [1.4.0] - 2026-04-08 (Stability & Data Integrity)

### 🛡️ Persistence & Reliability
- **Absolute Sync Protection**: Implemented a synchronization barrier in `useTripStore` that prevents valid user data from being overwritten by empty server snapshots during network/auth transitions.
- **Surgical Firestore Updates**: Migrated the entire persistence layer to explicit `updateDoc` operations, replacing the ambiguous `setDoc(merge)` method to ensure precise data writes.
- **Universal Data Scrubbing**: Integrated a recursive `scrubData` utility that sanitizes all outgoing data by removing `undefined` values, resolving critical Firestore "Unsupported field" errors.
- **Two-Way Category Normalization**: Standardized itinerary types (e.g. 'hike' -> 'hiking') across both load and save cycles to prevent category reversion "echoes".

### 🔒 Navigation & Security
- **Navigation Lockdown**: Eliminated all automatic code-level redirects. The app now uses an inline "No Trip Active" state rather than browser-level resets to maintain session stability.
- **Live Sync Feedback**: Added a persistent status indicator in the app header providing real-time "SAVING TO CLOUD..." and error reporting.
- **Production Security Rules**: Deployed hardened `firestore.rules` enforcing authenticated ownership checks (`userId == request.auth.uid`), moving out of "Test Mode".

## [1.3.0] - 2026-04-07 (Phase 2: Power Modules)

### 🚀 New Core Modules
- **Todo System**: Full-featured interactive checklist with real-time Firestore sync.
- **Cost Tracker**: Expense dashboard aggregating manual costs and itinerary-linked prices (Flight/Hotel).
- **Weather Forecast**: Day-by-day forecast integration using Open-Meteo, with intelligent caching and historical data fallbacks.

### 🛠 Visual & Functional Refinements
- **Flight Grouping**: Visual containerization of multi-leg flight segments in the Timeline.
- **Rental Car Type**: Dedicated "Rental Car" category with automated Pickup/Return event splitting and specialized purple iconography.
- **Improved Geocoding**: Enhanced Nominatim accuracy by passing `tripTitle` context to the AI parsing engine.
- **Map Paths**: Fixed OSRM road path calculation and added dependency tracking for instant map updates on data change.

### 🩹 Critical Bug Fixes
- **iOS Link Stability**: Fixed app resets when clicking external links (e.g. AllTrails) by persisting `currentTripId` in `localStorage`.
- **Date Calibration**: Resolved off-by-one day errors by enforcing local timezone interpretation for all "timeless" date strings.
- **Mobile Persistence**: User session and active trip now survive browser backgrounding and reloads.

## [1.2.0] - 2026-04-07 (Phase 1.5: UI Overhaul)

### ✨ Modernized UI & UX
- **Global Floating Controls**: Replaced the legacy bottom TabBar with a sophisticated, dual-FAB navigation system (Sparkle Menu & View Switcher).
- **iOS Glassmorphism**: Standardized 60px circular FABs with high-performance backdrop blurs and spring-curved animations.
- **Symmetric Nav Labels**: Dynamic label positioning for left-aligned (View Switcher) and right-aligned (Sparkle) floating menus.

### 🤖 AI & Data Resilience
- **Smart Hotel Parsing**: AI now explicitly extracts "Check-in after" and "Check-out by" times from booking emails.
- **Timezone Stability**: Forced `YYYY-MM-DDTHH:mm:ss` (Local) ISO formatting to prevent UTC-midnight day shifts in Western timezones.
- **Improved AI Formatting**: Switched from HTML `<br/>` tags to natural `\n` newlines for description text, allowing for a cleaner user editing experience.
- **AI Trip Synopsis**: Added an AI-powered "Synthesize" feature that generates a beautiful 1-paragraph summary of the entire trip.

### 📋 New Trip Outline (Summary View)
- **Read-Only Mode**: A dedicated high-level view for glancing at the trip trajectory.
- **Compact Strategy**: Trimmed addresses and descriptions in the summary cards to provide a dense, information-rich outline.
- **Chronological Grouping**: Nested itinerary items by day with clear markers for hotel check-ins and check-outs.

### 🗺️ Infrastructure & Stability
- **Nominatim Integration**: Automated backend geocoding validation for all AI-parsed locations to ensure precise mapping.
- **Linkified Components**: Shared logic for rendering rich text, URLs, and multi-line descriptions across all views.
- **Bug Fixes**: Resolved timeline drag-and-drop timestamp corruption and Map polyline rendering issues.

## [1.1.0] - 2026-04-01
- **Initial Firebase Migration**: Transitioned from local storage to Firestore real-time synchronization.
- **Multi-Trip Support**: Added trip selection and management logic to the sidebar.
- **Google Auth Integration**: Secure login and cross-device persistence.

## [1.0.0] - 2026-03-25
- **Initial Release**: Core Timeline and Map functionality.
