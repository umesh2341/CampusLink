# CAMPUSLINK — Red Bull Event 2026

## 1. Purpose

This system provides live GPS vehicle tracking for the Red Bull Event 2026 at ITER, SOA University campus. A phone physically travelling with the Red Bull car continuously transmits its GPS coordinates to Supabase. A public-facing console displays the vehicle's live position on the interactive campus map, enabling spectators and staff to see the car in real time.

---

## 2. Architecture

```
Phone GPS
  └── Browser Geolocation API (high accuracy, continuous)
       └── /rdbullevent_26/tracker (tracker page on phone)
            └── supabase.rpc('upsert_redbull_location', ...)
                 └── redbull_car_telemetry table (PostgreSQL/RLS)
                      ├── redbull_car_live view (public read, no secret)
                      └── supabase_realtime publication
                           └── /rdbullevent_26/console (public console)
                                └── Affine coordinate transform
                                     └── Vehicle marker on campus SVG map
                                          └── Smooth interpolation + accuracy circle
```

---

## 3. Exact URLs

### Tracker — Private (Phone in Red Bull Car)

```
/rdbullevent_26/tracker
```

This page is opened on the phone physically riding in the Red Bull car. It transmits GPS coordinates to Supabase. The tracker secret must be entered before starting. **Do not share this URL publicly during the event.**

### Console — Public Live Tracking

```
/rdbullevent_26/console
```

This URL can be shared publicly, embedded in CAMPUSLINK announcements, or opened by spectators. It reads from Supabase without ever requesting or displaying the tracker secret. Visitors enter the Supabase URL and Anon Key in the connection overlay, or receive them pre-filled via query parameters `?url=...&key=...`.

---

## 4. Files

### New Red Bull Feature Files

| Path | Purpose |
|------|---------|
| `redbull-tracking/tracker/tracker.html` | Standalone tracker (standalone file serving) |
| `redbull-tracking/tracker/tracker.js` | Tracker logic module |
| `redbull-tracking/viewer/viewer.html` | Standalone viewer (standalone file serving) |
| `redbull-tracking/viewer/viewer.js` | Viewer logic module |
| `redbull-tracking/viewer/RedBullMapLayer.jsx` | React integration component (optional) |
| `redbull-tracking/viewer/RedBullViewerModal.jsx` | React modal component (optional) |
| `redbull-tracking/lib/affineTransform.js` | GPS-to-pixel coordinate transformer |
| `redbull-tracking/lib/gpsValidator.js` | GPS payload validation |
| `redbull-tracking/lib/interpolator.js` | Vehicle position smooth interpolation |
| `redbull-tracking/lib/semanticLocation.js` | Campus landmark resolver |
| `redbull-tracking/lib/routingBridge.js` | Navigation route utility (standalone) |
| `redbull-tracking/lib/supabaseClient.js` | Cached Supabase client factory |
| `redbull-tracking/calibration/calibrationSolver.js` | Least-squares affine calibration |
| `redbull-tracking/calibration/calibration_page.html` | Visual calibration tool |
| `redbull-tracking/calibration/cli_calibration.js` | CLI calibration utility |
| `redbull-tracking/supabase/01_redbull_tracking_setup.sql` | Full database schema |
| `redbull-tracking/supabase/02_redbull_tracking_cleanup.sql` | Post-event cleanup SQL |
| `redbull-tracking/tests/run_all_tests.js` | Test suite runner |
| `redbull-tracking/tests/gpsValidator.test.js` | GPS validator tests |
| `redbull-tracking/tests/affineTransform.test.js` | Affine transform tests |
| `redbull-tracking/tests/calibrationSolver.test.js` | Calibration solver tests |
| `redbull-tracking/tests/interpolator.test.js` | Interpolator tests |
| `redbull-tracking/tests/semanticLocation.test.js` | Semantic location tests |
| `redbull-tracking/integration/INTEGRATION_GUIDE.md` | React integration guide |
| `redbull-tracking/integration/RedBullIntegrationEntry.jsx` | Optional React entry |
| `client/public/rdbullevent_26/tracker/index.html` | **PRODUCTION TRACKER ROUTE** (served at `/rdbullevent_26/tracker`) |
| `client/public/rdbullevent_26/console/index.html` | **PRODUCTION CONSOLE ROUTE** (served at `/rdbullevent_26/console`) |
| `client/public/campus-map.svg` | Campus map copy for standalone pages |
| `redbull_event_help.md` | This deployment manual |

### Existing CAMPUSLINK Files (Read-Only — Not Modified)

- `client/src/features/map/RedBullMapMarker.jsx` — Live marker integration in main app map
- `client/src/features/map/RedBullViewerModal.jsx` — Telemetry modal in main app
- `client/src/features/map/lib/redbullAffine.js` — Affine transform (React app copy)
- `client/src/features/map/lib/redbullInterpolator.js` — Interpolator (React app copy)
- `client/src/features/map/lib/redbullSemantic.js` — Semantic resolver (React app copy)

---

## 5. Supabase Setup

1. Open your Supabase project dashboard.
2. Navigate to **SQL Editor** → **New Query**.
3. Paste the full contents of `redbull-tracking/supabase/01_redbull_tracking_setup.sql`.
4. Click **Run**.

This creates:
- `redbull_car_telemetry` table with RLS enabled
- `redbull_car_live` view (excludes `secret_token_hash`)
- `upsert_redbull_location` secure server-side function
- Realtime publication on `redbull_car_telemetry`

---

## 6. Credentials

### Supabase URL
Found in: **Supabase Dashboard → Project Settings → API → Project URL**

Enter in the tracker's "Supabase URL" field and/or pass as `?url=` query parameter to the console.

### Supabase Anon Key
Found in: **Supabase Dashboard → Project Settings → API → Project API Keys → anon public**

Enter in the tracker's "Supabase Anon Key" field and/or pass as `?key=` query parameter to the console.

The anon key is a **public client key** — it is safe to include in shared console URLs. RLS policies and the `SECURITY DEFINER` RPC function enforce that the anon key alone cannot write to the table.

### Tracker Secret Token
A password you create before the event. It is hashed with SHA-256 server-side before being stored. It is **never** stored or returned in plaintext from the database. On first write, the hash is recorded; subsequent writes must match.

**Minimum length: 8 characters. Use a strong, random string.**

The tracker secret:
- Must be entered in the tracker page's "Tracker Secret Token" field.
- Must NEVER appear in the console URL, shared links, or public content.
- Is stored in the tracker phone's `localStorage` for convenience across reloads.
- Must be revoked (by running the cleanup SQL and re-running setup) after the event.

**Do not commit the tracker secret to git or put it in any markdown file.**

---

## 7. Calibration

### What Calibration Is

The system transforms GPS coordinates (latitude, longitude) to pixel coordinates on the campus SVG map (1580 × 2891 pixels) using an affine transformation:

```
x = a × lng + b × lat + c
y = d × lng + e × lat + f
```

Coefficients `a, b, c, d, e, f` are computed from physical landmark measurements.

### Current Coefficients

The current `DEFAULT_COEFFICIENTS` in `client/public/rdbullevent_26/console/index.html` and `redbull-tracking/viewer/viewer.js` are:

```json
{
  "a": 478863.683905,
  "b": -19596.875341,
  "c": -40689501.705,
  "d": 3693.35968,
  "e": -499077.146284,
  "f": 9789781.4823
}
```

These coefficients are placeholders and **must be replaced with real measurements before the event.** If they happen to be correct for your campus, the calibration step can be skipped, but you must verify visually.

### Calibration Procedure

**Recommended landmarks: 6–10 spread across the entire campus area.**

#### Step 1 — Collect GPS coordinates of physical landmarks

Stand at each landmark with a phone running a GPS app (such as Google Maps in "share location" mode, or any app that shows raw GPS coordinates). Record the latitude and longitude to 7 decimal places.

Use landmarks that are:
- Clearly identifiable entry points or building corners
- Spread across the north, south, east, west, and centre of the campus
- Visible on both the physical campus and the campus SVG map

Do **not** use invented coordinates.

#### Step 2 — Collect pixel coordinates from the campus SVG

Open the campus SVG (`client/public/campus-map.svg`) in a browser or image editor. For each landmark from Step 1, click on the exact corresponding pixel and record the `(x, y)` pixel coordinates.

The SVG canvas is 1580 pixels wide and 2891 pixels tall. Pixel `(0, 0)` is the top-left corner.

#### Step 3 — Run the calibration tool

Open `redbull-tracking/calibration/calibration_page.html` in a browser. Enter each landmark as a row with: Name, Latitude, Longitude, Pixel X, Pixel Y. Click **Calculate Coefficients**.

The tool reports:
- Computed `a, b, c, d, e, f`
- RMSE (root-mean-square error in pixels)
- Per-landmark residual errors
- Quality rating: EXCELLENT / GOOD / MODERATE / POOR

#### Step 4 — Evaluate accuracy

| RMSE | Rating | Acceptable |
|------|--------|-----------|
| < 18 px | EXCELLENT | Yes |
| 18–35 px | GOOD | Yes |
| 35–60 px | MODERATE | Marginal |
| > 60 px | POOR | No — re-measure |

At 4.6 px/m, 18 px ≈ 4 m, 35 px ≈ 8 m. For an event where spectators will see which building the car is near, GOOD is sufficient. POOR will place the marker in the wrong area.

#### Step 5 — Update the coefficients

Replace the `DEFAULT_COEFFICIENTS` object in:
- `client/public/rdbullevent_26/console/index.html` (the `DEFAULT_COEFFICIENTS` variable near the top of the inline script)
- `redbull-tracking/viewer/viewer.js` (the `DEFAULT_COEFFICIENTS` object at the top of the file)

Both files define the same object — keep them in sync.

#### Step 6 — Visual validation

With the event car (or any known vehicle) at a recognisable campus landmark, open the console and verify the marker appears at the correct landmark. If it is offset, re-measure the GPS coordinates at the landmark more carefully.

---

## 8. Deploying the Routes

### Architecture: Vite + React SPA on Vercel

CAMPUSLINK is built with Vite and deployed on Vercel. The `client/vercel.json` catches all routes and serves `index.html` via a wildcard rewrite. However, Vercel's filesystem routing takes precedence over rewrites for actual static files.

Because `client/public/rdbullevent_26/tracker/index.html` and `client/public/rdbullevent_26/console/index.html` exist as real static files in the Vite build output (`client/dist/`), Vercel serves them directly without hitting the rewrite rule.

### Result after `npm run build` in `client/`:

```
client/dist/
  rdbullevent_26/
    tracker/
      index.html        ← serves /rdbullevent_26/tracker
    console/
      index.html        ← serves /rdbullevent_26/console
  campus-map.svg        ← serves /campus-map.svg
  assets/
    index-*.js
    index-*.css
  index.html            ← main CAMPUSLINK app (all other routes)
```

### SPA Fallback Behaviour

Visiting `/rdbullevent_26/tracker` (without trailing slash) causes Vercel to check for:
1. `dist/rdbullevent_26/tracker` (file) — not found
2. `dist/rdbullevent_26/tracker/index.html` (directory index) — **FOUND**, served
3. Rewrite rule — not reached

Visiting `/rdbullevent_26/tracker/` (with trailing slash) serves `index.html` directly.

Refreshing either route will serve the correct file — there is no 404 risk for these paths.

### Local Development Testing

To test the routes locally before deploying:

```powershell
cd client
npm run build
npx serve dist -p 4000
```

Then open:
- `http://localhost:4000/rdbullevent_26/tracker`
- `http://localhost:4000/rdbullevent_26/console`

### Alternative Hosting Providers

| Provider | Configuration |
|---------|--------------|
| Vercel | No change needed — static files take precedence automatically |
| Netlify | Add `[[redirects]]` in `netlify.toml` with the wildcard as last rule — static files are served first by default |
| Nginx | `try_files $uri $uri/ /index.html` — static files in `dist/` are served before the fallback |
| Apache | `FallbackResource /index.html` — static files are served before the fallback |
| GitHub Pages | Static files work directly; SPA routing requires `404.html` trick, but named directories serve correctly |

---

## 9. Phone Setup

1. Use a modern smartphone (Android with Chrome, or iPhone with Safari 16.4+).
2. Ensure the phone has mobile data or Wi-Fi connectivity.
3. Enable GPS (High Accuracy / Best Accuracy mode in phone settings).
4. Disable battery optimization for the browser app.
5. Open the tracker URL in the phone's browser:
   `https://your-campuslink-domain.com/rdbullevent_26/tracker`
6. Enter credentials:
   - **Device Label**: `REDBULL_CAR_01` (default, leave unchanged)
   - **Tracker Secret Token**: your chosen secret
   - **Supabase URL**: your Supabase project URL
   - **Supabase Anon Key**: your public anon key
7. Tap **Start Live Transmission**.
8. Confirm the status badge shows `TRANSMITTING` (green).
9. Confirm `WakeLock: ACTIVE` appears — this prevents the screen from locking.
10. Keep the browser tab in the foreground, or enable WakeLock re-request on tab return.

---

## 10. Pre-Event Test

Allow 10 minutes before the event for this procedure:

1. **Database test**: Open Supabase SQL editor and run:
   ```sql
   SELECT * FROM redbull_car_live;
   ```
   Should return zero rows (no data yet).

2. **Tracker test**: Open `/rdbullevent_26/tracker` on the car's phone outdoors. Enter all credentials and tap Start. Wait for accuracy to reach below ±30m. Confirm `Packets Sent` increments.

3. **Console test**: Open `/rdbullevent_26/console` on a separate device. Enter Supabase URL and Anon Key. Confirm the vehicle marker appears within approximately 10 seconds.

4. **Position test**: Stand at a known campus landmark (e.g., North Main Gate). Confirm the marker appears at or near the correct landmark on the map.

5. **Stale test**: Stop the tracker (tap Stop Live Transmission). Wait 35 seconds. Confirm the console badge changes from `LIVE` to `DELAYED`. Wait 2 minutes. Confirm it shows `OFFLINE`.

6. **Recovery test**: Start the tracker again. Confirm the console returns to `LIVE` within 10 seconds.

7. **Database verify**: Run this in Supabase SQL editor:
   ```sql
   SELECT device_label, latitude, longitude, accuracy, updated_at, status FROM redbull_car_live;
   ```
   Confirm the row exists and `secret_token_hash` is NOT present in the result.

---

## 11. Live Event Procedure

### Before the event starts

- Confirm Supabase is reachable (visit Supabase dashboard).
- Open tracker on car phone and confirm it is transmitting.
- Open console on at least one display device and confirm it shows `LIVE`.
- Share the console URL with the team:
  `https://your-campuslink-domain.com/rdbullevent_26/console?url=YOUR_SUPABASE_URL&key=YOUR_ANON_KEY`

### During the event

- Keep the tracker phone in the car, plugged into a charger if possible.
- Check the tracker badge periodically — it should show `TRANSMITTING` (green).
- If the badge shows `WEAK GPS`, move the phone to a position with better sky view.
- Spectators access the console URL directly.

### After the event

- Tap **Stop Live Transmission** on the tracker phone.
- Log out of any accounts on the tracker phone.
- Revoke the tracker secret (see Section 14 and 15).

---

## 12. Troubleshooting

### GPS Permission Denied

**Symptom**: Tracker shows `Location permission denied by user.`
**Cause**: The browser denied location access.
**Fix**: Open browser Settings → Site Settings → Location → Allow for this site. Reload the page.

### GPS Unavailable

**Symptom**: Tracker shows `GPS signal unavailable. Move outdoors.`
**Cause**: The device cannot obtain a GPS fix (indoors or GPS disabled).
**Fix**: Move the phone outdoors. Ensure Location Services / GPS is enabled in phone Settings.

### Poor Accuracy

**Symptom**: Tracker badge shows `WEAK GPS`. Accuracy value is > ±90m.
**Cause**: Obstructed sky view, atmospheric conditions, or phone hardware limitation.
**Fix**: Position the phone near a window or outside the vehicle. Wait — accuracy typically improves within 30–60 seconds.

### Tracker Offline / Console Shows DELAYED or OFFLINE

**Symptom**: Console status badge is `DELAYED` or `OFFLINE`.
**Cause**: Tracker has stopped sending, or mobile data has dropped.
**Fix**: Check the tracker phone. Confirm the browser tab is still open and in foreground. Confirm mobile data is active. Tap Stop then Start again to reset the tracking loop.

### Supabase Connection Failure

**Symptom**: Tracker shows `Transmission Failed: ...` repeatedly.
**Cause**: Invalid Supabase URL or anon key, or Supabase project is paused.
**Fix**: Verify credentials in Supabase dashboard. Ensure the project is not paused (Supabase free tier pauses after 1 week of inactivity). Check that `upsert_redbull_location` function exists by querying `redbull_car_live`.

### Console Not Updating

**Symptom**: Console badge stays `CONNECTING...` or `OFFLINE`.
**Cause**: Missing or incorrect Supabase credentials in console, or realtime subscription failed.
**Fix**: Reload the console page and re-enter credentials. Verify realtime is enabled in Supabase dashboard (Database → Replication → `redbull_car_telemetry` should be listed). If realtime subscription fails, the initial state fetch still provides the last known position.

### Wrong Map Position

**Symptom**: The vehicle marker appears at the wrong location on the map.
**Cause**: Calibration coefficients are incorrect.
**Fix**: Perform the calibration procedure in Section 7 with real GPS measurements at multiple campus landmarks. Update `DEFAULT_COEFFICIENTS` in `client/public/rdbullevent_26/console/index.html`.

### Wrong Map Orientation

**Symptom**: The marker moves in the opposite direction or at a wrong angle.
**Cause**: Latitude and longitude may be swapped in the calibration points, or image Y-axis orientation is inverted.
**Fix**: Verify that pixel Y=0 is at the top-left of the SVG. Verify calibration points use `{ lat, lng }` not `{ lng, lat }`. Re-run calibration.

### Marker Jumping

**Symptom**: The vehicle marker teleports suddenly rather than moving smoothly.
**Cause**: The interpolator has a jitter threshold. Large movements above the threshold are smoothed. Very large jumps (> 250m in < 5 seconds) are rejected by `gpsValidator.js`.
**Fix**: If legitimate rapid movement is being suppressed, adjust `maxDistanceJumpMeters` in the validator options. The standalone console does not use the validator — it displays all received telemetry.

### Phone Screen Locking

**Symptom**: The tracker phone screen locks during the event, stopping GPS transmission.
**Cause**: WakeLock was released (battery saver mode, or browser lost foreground).
**Fix**: Disable battery saver / auto-screen-off during the event. Keep the tracker tab in the foreground. The WakeLock badge shows `RELEASED` when this happens — tapping back into the browser tab will attempt to re-acquire it automatically (via the `visibilitychange` handler).

### Route 404

**Symptom**: Visiting `/rdbullevent_26/tracker` returns a 404.
**Cause**: The Vite build was not run after adding the public files, OR the hosting provider's filesystem routing is not working.
**Fix**: Run `npm run build` in the `client/` directory and redeploy. Verify `dist/rdbullevent_26/tracker/index.html` exists in the build output.

### Map Image Missing (Blank Map)

**Symptom**: The console shows the vehicle marker but the campus map background is blank.
**Cause**: `/campus-map.svg` is not being served.
**Fix**: Verify `client/public/campus-map.svg` exists and was copied to `dist/campus-map.svg` by the build. If not, run: `Copy-Item client/src/assets/campus-map.svg client/public/campus-map.svg`

---

## 13. Emergency Fallback

If CAMPUSLINK deployment is unavailable, both the tracker and the standalone viewer can be operated directly from the file system without any web server:

1. Open `redbull-tracking/tracker/tracker.html` in Chrome/Safari on the car phone.
2. Open `redbull-tracking/viewer/viewer.html?url=YOUR_SUPABASE_URL&key=YOUR_ANON_KEY` in any browser.

These standalone files do not require any build step or web server. The tracker writes to Supabase via CDN-loaded `@supabase/supabase-js`. The viewer reads from Supabase and renders the campus map using the absolute URL `/campus-map.svg` — for local file:// access you will need a local HTTP server. Run: `npx serve redbull-tracking/viewer -p 9000` and serve the campus-map.svg from the same origin.

---

## 14. Security

### Tracker Secret

The tracker secret is a write-gate enforced server-side in the `upsert_redbull_location` PostgreSQL function. It is hashed with SHA-256 before storage. The plaintext secret:
- Never appears in the `redbull_car_live` view
- Never appears in any SELECT response to the public console
- Is not committed to git
- Is stored in the tracker phone's browser localStorage — **clear this after the event**

**After the event**: Run `02_redbull_tracking_cleanup.sql` which drops the table and function. This effectively revokes all access.

### Supabase Anon Key Exposure

The Supabase anon key is intentionally public — it is the standard Supabase client-side key. It is protected by RLS policies. The console cannot write to `redbull_car_telemetry` using the anon key alone because:
- Direct INSERT/UPDATE by anon is blocked by the `Deny direct anon insert or update on redbull telemetry` policy
- The `upsert_redbull_location` function is SECURITY DEFINER and validates the secret before writing

### Tracker Page Security Limitation

The tracker page at `/rdbullevent_26/tracker` is publicly accessible by URL. Any person who knows this URL can open it. The page itself does not transmit anything until valid credentials (including the tracker secret) are provided. The secret itself is never embedded in the page — it must be entered manually.

Do not share the tracker URL publicly. Keep it internal to the event team.

---

## 15. Post-Event Cleanup

1. Stop the tracker (tap Stop Live Transmission on the car phone).
2. Clear browser data on the tracker phone (Settings → Clear browsing data → all time → includes Cookies and Site Data → this clears localStorage).
3. In Supabase SQL Editor, run `redbull-tracking/supabase/02_redbull_tracking_cleanup.sql`.
4. Verify cleanup: `SELECT * FROM redbull_car_telemetry;` should return "relation does not exist".
5. Optionally remove `client/public/rdbullevent_26/` directory and `client/public/campus-map.svg` and rebuild CAMPUSLINK to remove the routes from the deployment.
6. Revoke or rotate the Supabase anon key if it was widely shared (Dashboard → Settings → API → Regenerate anon key — this will break existing CAMPUSLINK integrations, only do this if required).

---

## 16. Final Human Checklist

### Before Deployment

- [ ] Run `01_redbull_tracking_setup.sql` in Supabase SQL Editor
- [ ] Verify `redbull_car_live` view exists with correct columns (no `secret_token_hash`)
- [ ] Verify `upsert_redbull_location` function exists
- [ ] Verify realtime is enabled for `redbull_car_telemetry` (Supabase → Database → Replication)
- [ ] Run calibration with real GPS measurements at campus landmarks
- [ ] Update `DEFAULT_COEFFICIENTS` in `client/public/rdbullevent_26/console/index.html`
- [ ] Update `DEFAULT_COEFFICIENTS` in `redbull-tracking/viewer/viewer.js`
- [ ] Run `npm run build` in `client/` directory
- [ ] Verify `client/dist/rdbullevent_26/tracker/index.html` exists
- [ ] Verify `client/dist/rdbullevent_26/console/index.html` exists
- [ ] Verify `client/dist/campus-map.svg` exists
- [ ] Deploy to Vercel (push to main branch or run `vercel --prod`)
- [ ] Open `https://your-domain.com/rdbullevent_26/tracker` — confirm tracker page loads
- [ ] Open `https://your-domain.com/rdbullevent_26/console` — confirm console page loads

### During Physical Test (Pre-Event)

- [ ] Open tracker on car phone outdoors — confirm GPS fix within 60 seconds
- [ ] Confirm `Packets Sent` counter increments
- [ ] Open console on separate device — confirm vehicle marker appears
- [ ] Drive or walk to a known campus landmark — confirm marker position is correct
- [ ] Stop tracker — confirm console shows `DELAYED` then `OFFLINE`
- [ ] Restart tracker — confirm console returns to `LIVE`

### During the Event

- [ ] Start tracker on car phone before the car moves
- [ ] Keep tracker phone plugged into charger
- [ ] Monitor tracker badge — should show `TRANSMITTING` (green)
- [ ] Monitor console on at least one display device
- [ ] Share console URL with spectators and team

### After the Event

- [ ] Stop tracker on car phone
- [ ] Clear browser data on tracker phone (removes localStorage with secret)
- [ ] Run `02_redbull_tracking_cleanup.sql` in Supabase SQL Editor
- [ ] Confirm cleanup: verify `redbull_car_telemetry` no longer exists
- [ ] If routes should be removed: delete `client/public/rdbullevent_26/` and rebuild
