# CampusLink Red Bull Live Tracking — Integration Guide

This guide explains how to connect the new, completely isolated Red Bull Car Tracking feature into the main CampusLink application whenever you are ready.

---

## 1. Database Setup (Supabase)

1. Open your Supabase Project Dashboard.
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of `redbull-tracking/supabase/01_redbull_tracking_setup.sql`.
4. Run the query.

This creates:
- `redbull_car_telemetry` table (private, secured with RLS).
- `redbull_car_live` view (public-safe telemetry view without secrets).
- `upsert_redbull_location` secure PostgreSQL function.
- Realtime publication on `redbull_car_telemetry`.

---

## 2. Standalone Operation (Zero Changes to Main App)

The tracker and viewer can be run standalone immediately without editing any existing CAMPUSLINK file:

- **Tracker Cockpit (Mobile Phone in Car):**
  Open `redbull-tracking/tracker/tracker.html` in mobile Chrome/Safari.
  Enter your Supabase URL, Anon Key, and chosen Secret Token.
  Tap **Start Live Transmission**.

- **Standalone Viewer Radar:**
  Open `redbull-tracking/viewer/viewer.html?url=YOUR_SUPABASE_URL&key=YOUR_ANON_KEY`.

- **Calibration Studio:**
  Open `redbull-tracking/calibration/calibration_page.html` to calculate affine transformation coefficients from real landmark GPS fixes.

---

## 3. Optional React Integration (2-Line Addition to InteractiveMap)

If you want the live Red Bull car to appear directly inside CAMPUSLINK's interactive campus map:

In `client/src/features/map/InteractiveMap.jsx`:

1. Import the integration entry component:
```javascript
import RedBullIntegrationEntry from '../../../redbull-tracking/integration/RedBullIntegrationEntry.jsx';
```

2. Add `<RedBullIntegrationEntry />` inside the SVG map container:
```jsx
<div className="relative" ref={svgWrapperRef}>
  {/* Existing Map and Markers */}
  <RedBullIntegrationEntry userLocation={userLocation} />
</div>
```

---

## 4. Post-Event Cleanup

To disable tracking and remove temporary write capabilities after the event:
1. Open Supabase **SQL Editor**.
2. Run `redbull-tracking/supabase/02_redbull_tracking_cleanup.sql`.
