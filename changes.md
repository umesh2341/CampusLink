# CampusLink Red Bull Live Tracking — Implementation Report & Architecture

This document describes all new modules, files, mathematical models, and architectural decisions implemented for the **Live Red Bull Car Tracking** feature in CAMPUSLINK.

---

## 1. Summary of What Was Built

A production-ready, fully isolated live vehicle tracking system was created for the Red Bull event tomorrow. The system spans phone GPS collection, database-level security and validation, realtime pub/sub streaming, affine coordinate transformation, 60fps motion interpolation, campus landmark proximity matching, and shortest-path walking navigation.

**Existing CAMPUSLINK files modified:** `0` (Completely untouched).

---

## 2. Directory Structure of New Files

```
CampusLink/
├── changes.md                                      # This architectural and rationale document
└── redbull-tracking/
    ├── package.json                                # Isolated module declaration (ES modules)
    ├── supabase/
    │   ├── 01_redbull_tracking_setup.sql          # RLS, private telemetry table, public view, RPC function, Realtime
    │   └── 02_redbull_tracking_cleanup.sql        # Reversible post-event teardown script
    ├── lib/
    │   ├── gpsValidator.js                        # GPS sanity, velocity checks, jump rejection, Haversine distance
    │   ├── affineTransform.js                     # 2D Affine (lat, lng) <-> (x, y) projection & bounds clamping
    │   ├── interpolator.js                        # 60fps position & angular wrap-around heading interpolation
    │   ├── semanticLocation.js                    # Sector & landmark proximity engine ("Near Student Section (35m)")
    │   ├── routingBridge.js                       # A* pathfinding bridge from user location to Red Bull vehicle
    │   └── supabaseClient.js                      # Configurable Supabase client factory
    ├── calibration/
    │   ├── calibrationSolver.js                   # Least-squares regression solver for 2D affine coefficients
    │   ├── cli_calibration.js                     # Node.js CLI calibration utility with residual diagnostics
    │   └── calibration_page.html                  # Interactive browser-based calibration studio
    ├── tracker/
    │   ├── tracker.js                             # Transmitter logic: watchPosition, WakeLock, RPC upsert, throttling
    │   └── tracker.html                           # Mobile cockpit HUD for the phone inside the Red Bull car
    ├── viewer/
    │   ├── viewer.js                              # Standalone viewer logic: Realtime sub, 60fps loop, HUD binding
    │   ├── viewer.html                            # Standalone public vehicle radar & map display
    │   ├── RedBullMapLayer.jsx                    # Reusable React map overlay component for InteractiveMap
    │   └── RedBullViewerModal.jsx                 # Reusable React modal with live telemetry & "Take Me To Car"
    ├── integration/
    │   ├── RedBullIntegrationEntry.jsx            # Unified drop-in React wrapper component
    │   └── INTEGRATION_GUIDE.md                   # Step-by-step instructions for dashboard & React integration
    └── tests/
        ├── gpsValidator.test.js                   # Unit tests for GPS bounds, accuracy, and jump filters
        ├── affineTransform.test.js                # Unit tests for coordinate transformation and inverse mapping
        ├── calibrationSolver.test.js              # Unit tests for normal equations and least-squares solver
        ├── interpolator.test.js                   # Unit tests for 60fps lerp, angular wrap-around, and stale states
        ├── semanticLocation.test.js               # Unit tests for landmark proximity and zone matching
        └── run_all_tests.js                       # Test runner executing all 37 assertions
```

---

## 3. Why Each Module Was Built & Why It Was Written This Way

### A. Database Layer (`supabase/01_redbull_tracking_setup.sql`)
- **What:** Private table `redbull_car_telemetry`, public view `redbull_car_live`, and security-definer function `upsert_redbull_location`.
- **Why it was done:** The tracker phone in the car must write live GPS data without exposing secrets or write permissions to the general public who view the map.
- **Why written this way:** 
  - Direct `INSERT` / `UPDATE` from anon users is blocked at the database level with RLS (`USING (FALSE)`).
  - Telemetry writes pass exclusively through a `SECURITY DEFINER` stored procedure that computes `sha256` token digests in PostgreSQL.
  - The public reads through `redbull_car_live`, which strips any internal credentials or hashes.
  - Check constraints (`CHECK (latitude >= -90 AND latitude <= 90)`, etc.) guarantee bad data is rejected before writing.

### B. GPS Validation (`lib/gpsValidator.js`)
- **What:** Rejects invalid coordinates, excessive accuracy errors (> 80m), impossible speeds (> 125 km/h for a campus vehicle), and abnormal teleportation jumps.
- **Why it was done:** Phone GPS chips in campus environments frequently bounce off concrete multi-story buildings (multipath interference), producing temporary fixes hundreds of meters away.
- **Why written this way:** It balances noise rejection without over-filtering. If stationary, sub-second bursts are rate-limited to preserve mobile battery and reduce Supabase throughput.

### C. Numerically Conditioned Least-Squares Calibration (`calibration/calibrationSolver.js` & `lib/affineTransform.js`)
- **What:** Solves $x = a \cdot \text{lng} + b \cdot \text{lat} + c$ and $y = d \cdot \text{lng} + e \cdot \text{lat} + f$ for $N \ge 3$ ground control points.
- **Why it was done:** Real-world GPS coordinates (WGS84 degrees) must be projected accurately onto the custom 1580 x 2891 px SVG campus map.
- **Why written this way:** Standard linear regression on raw coordinates ($lng \approx 85.8$, $lat \approx 20.2$) suffers from numerical precision loss in 64-bit floats due to ill-conditioned Normal equations ($A^T A$). We centered the points around the geographic centroid before solving and then converted back to global coefficients. This reduced RMSE and stabilized the matrix determinant.

### D. Motion Interpolation & Circular Angular Smoothing (`lib/interpolator.js`)
- **What:** 60fps animation controller that smooths transitions between discreet GPS updates received every 2–4 seconds.
- **Why it was done:** Without interpolation, the vehicle marker jumps abruptly every few seconds, looking jerky and disconnected.
- **Why written this way:**
  - Standard linear interpolation of angles fails when crossing $0^\circ$ / $360^\circ$ (e.g. from $355^\circ$ to $10^\circ$, a naïve lerp rotates $345^\circ$ the wrong way). Our angular interpolator computes the shortest angular path across the branch cut.
  - A small jitter threshold ($2.5\text{px}$) prevents the marker from vibrating when the vehicle is parked.
  - Timestamps determine state transitions: `LIVE` (<30s), `DELAYED` (30s–120s), and `OFFLINE` (>120s).

### E. Semantic Proximity Engine (`lib/semanticLocation.js`)
- **What:** Converts raw coordinates into human-readable descriptions like `"Near Student Section (35m)"` or `"At University Auditorium"`.
- **Why it was done:** Users viewing a campus map understand building landmarks much faster than coordinate numbers or abstract map pins.
- **Why written this way:** It uses a data-driven list matching CAMPUSLINK's `CAMPUS_NODES` with customized radial bounding zones.

### F. Shortest-Path Navigation Bridge (`lib/routingBridge.js`)
- **What:** Calculates an A* pedestrian route from the user's current position to the Red Bull car's live location.
- **Why it was done:** Attendees want to find and walk to the Red Bull car during the live event.
- **Why written this way:** Reuses the topological waypoint graph and adjacency list from `campusGraphData.js` in a purely read-only manner without touching any existing routing files.

### G. Mobile Tracker Cockpit (`tracker/tracker.html` & `tracker.js`)
- **What:** Specialized web app designed for the phone mounted inside the vehicle.
- **Why it was done:** Drivers and operators need high-contrast status feedback, confirmation that packets are transmitting, and guarantees that the phone screen won't sleep.
- **Why written this way:**
  - Implements the **Screen Wake Lock API** (`navigator.wakeLock`) with automatic reacquisition when the browser tab resumes from background.
  - High-contrast cockpit UI shows speed in km/h, heading, accuracy in meters, and total packet transmission count.

---

## 4. Test Suite Execution & Verification

An automated test suite (`redbull-tracking/tests/run_all_tests.js`) was created and executed locally with Node.js.

### Test Results:
```
======================================================
  RUNNING CAMPUSLINK RED BULL TRACKING TEST SUITE
======================================================

Testing GPS Validator...
  PASS: GPS Validator (6 assertions)
Testing Affine Transformer...
  PASS: Affine Transformer (8 assertions)
Testing Least-Squares Calibration Solver...
  PASS: Least-Squares Calibration Solver (6 assertions)
Testing Vehicle Interpolator & Math...
  PASS: Vehicle Interpolator (12 assertions)
Testing Campus Semantic Location Resolver...
  PASS: Semantic Location Resolver (5 assertions)

======================================================
  ALL TEST SUITES PASSED SUCCESSFULLY (37 Assertions)
======================================================
```
