# Project Backlog & Future Roadmap

- [x] **UI/UX Architecture**: iOS-inspired glassmorphic design system with dual-FAB navigation.
- [x] **Weather Automation**: Last updated status, trigger update on drag/move.
- [x] **Currency Consistency**: Ensure 2-digit cents $4.50 instead of $4.5.
- [x] **User Authentication**: Secure Google Auth and session persistence.
- [x] **Production Security**: Deployed owner-only Firestore security rules.
- [x] **Data Integrity**: Implemented sync barriers, `updateDoc` migration, and `undefined` scrubbing.
- [x] **Financial Settlement**: Unified category system (Dining, Lodging, etc.) with category-level summary breakdowns and over-budget alerts.
- [x] **Global Editing**: Centralized modal orchestration for cross-screen triggers with synchronized category selection.
- [x] **Climate Intelligence**: 5-year historical averaging in Fahrenheit + Precipitation.
- [x] **Productivity Suite**: Overdue task tracking and ergonomic reordering logic with premium glass styling.
- [x] **UI Infrastructure**: Collapsible units, refined button diagnostics, glass-morphism unification, and iOS viewport scaling.
- [x] **Note Standardization**: Neutral grey-scale, timeless Note rendering with simplified Title/Description editing and standard management parity.
- [x] **Map Logic**: Segmented flight/driving paths with universal dashed air lines, automated destination parsing, high-performance segment caching, and US-restricted airport discovery.
- [x] **DND Prepending**: Resolved day-start dragging issues with tripled-height top-of-day drop zones and refined reordering logic.
- [x] **Data Portability**: Google Sheets-compatible CSV export for itinerary items and expenses in the sidebar.
- [x] **Itinerary Refinement**: Note item specialization with title-badges, auto-description display, and premium map routing stability with glassy loading indicators.
- [x] **Data Portability**: Enhance Google Sheets export with premium visual formatting, structured report styling, and professional itinerary layouts.
- [x] **AllTrails Scraper**: Automated parsing of hiking links to extract trail stats.
- [x] **AllTrails Robustness**: Sanitize mobile share links and strip tracking parameters.

## 🚀 Deployment
- [ ] **Weather Polish**: Show spinning reload logo on Weather screen and Timeline headers during background refreshes.
- [ ] **Maps:** Implement Hotel-Origin Routing (ensure routes start from the last accommodation across multi-day stays).
- [ ] **Trip Sharing**: Invite-only collaborator access to shared itineraries.
- [ ] **Offline Mode**: Service Worker (PWA) improvements for full offline read/write support.
- [ ] **Maps:** Configure Official Google Maps API keys (currently using Leaflet/OSM).
