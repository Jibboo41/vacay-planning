# Changelog

All notable changes to the **Vacay Planning** project will be documented in this file.

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
