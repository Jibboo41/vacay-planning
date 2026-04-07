# Changelog

All notable changes to the **Vacay Planning** project will be documented in this file.

## [1.2.0] - 2026-04-07

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
