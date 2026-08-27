import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { createAffineTransformer }       from '../lib/affineTransform.js';
import { createVehicleInterpolator }     from '../lib/interpolator.js';
import { createSemanticLocationResolver } from '../lib/semanticLocation.js';

// placeholder coefficients — run calibration_page.html against real landmarks before the event
const DEFAULT_COEFFICIENTS = {
  a:  478863.683905,
  b: -19596.875341,
  c: -40689501.705,
  d:  3693.35968,
  e: -499077.146284,
  f:  9789781.4823,
};

export function initViewer(customConfig = {}) {
  let supabase      = null;
  let rtChannel     = null;
  let animFrameId   = null;

  const coeffs       = customConfig.coefficients || DEFAULT_COEFFICIENTS;
  const transformer  = createAffineTransformer(coeffs);
  const interpolator = createVehicleInterpolator();
  const semantic     = createSemanticLocationResolver();

  // default user position (Academic Block entrance) — updated via setUserLocation if GPS available
  let userPos      = { x: 437, y: 650 };
  let activeRoute  = null;

  const el = {
    mapViewport:    document.getElementById('mapViewport'),
    mapContainer:   document.getElementById('mapContainer'),
    vehicleMarker:  document.getElementById('vehicleMarker'),
    vehicleHeading: document.getElementById('vehicleHeading'),
    accCircle:      document.getElementById('accuracyCircle'),
    routeLayer:     document.getElementById('routeLayer'),
    statusBadge:    document.getElementById('statusBadge'),
    landmarkText:   document.getElementById('landmarkText'),
    speedText:      document.getElementById('speedText'),
    timeText:       document.getElementById('updatedTimeText'),
    btnNav:         document.getElementById('btnNavigate'),
    navDetails:     document.getElementById('navDetails'),
  };

  function connect() {
    const url = customConfig.supabaseUrl
      || document.getElementById('cfgSupabaseUrl')?.value?.trim()
      || new URLSearchParams(window.location.search).get('url');

    const key = customConfig.supabaseKey
      || document.getElementById('cfgSupabaseKey')?.value?.trim()
      || new URLSearchParams(window.location.search).get('key');

    if (!url || !key) return;

    if (rtChannel) { rtChannel.unsubscribe(); rtChannel = null; }

    supabase = createClient(url, key, { auth: { persistSession: false } });
    fetchInitial();
    subscribeRT();
  }

  async function fetchInitial() {
    if (!supabase) return;
    try {
      // try the public view first — it excludes secret_token_hash
      const { data, error } = await supabase
        .from('redbull_car_live')
        .select('*')
        .eq('device_label', 'REDBULL_CAR_01')
        .maybeSingle();

      if (!error && data) { onTelemetry(data); return; }

      // fallback to direct table if view hasn't been created yet
      const fb = await supabase
        .from('redbull_car_telemetry')
        .select('latitude, longitude, accuracy, altitude, heading, speed, updated_at')
        .eq('device_label', 'REDBULL_CAR_01')
        .maybeSingle();
      if (fb.data) onTelemetry(fb.data);
    } catch (_e) {}
  }

  function subscribeRT() {
    if (!supabase) return;

    rtChannel = supabase
      .channel('redbull-telemetry-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'redbull_car_telemetry',
        filter: 'device_label=eq.REDBULL_CAR_01',
      }, payload => {
        if (payload.new) onTelemetry(payload.new);
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED')    setStatus('LIVE');
        if (status === 'CHANNEL_ERROR') setStatus('OFFLINE');
      });
  }

  function onTelemetry(row) {
    if (!row || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') return;

    const { x, y, accuracyRadiusPixels: accR } = transformer.toMapCoordinates(
      row.latitude, row.longitude, row.accuracy
    );
    if (x === null || y === null) return;

    interpolator.setTarget({
      x, y,
      heading:       row.heading  != null ? Number(row.heading)  : null,
      accuracyRadius: accR,
      speed:          row.speed   != null ? Number(row.speed)    : 0,
      accuracy:       row.accuracy != null ? Number(row.accuracy) : null,
      updatedAt:      row.updated_at || Date.now(),
    });

    const loc = semantic.resolveLocation(x, y);
    el.landmarkText.innerText = loc.description;
    el.speedText.innerText    = row.speed ? `${(row.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h';
    el.timeText.innerText     = new Date(row.updated_at || Date.now()).toLocaleTimeString();

    // keep route line pointing at the car if nav is active
    if (activeRoute) drawRoute({ x, y });
  }

  function renderLoop() {
    const state = interpolator.update();

    if (state && el.vehicleMarker) {
      el.vehicleMarker.style.transform = `translate(${state.x}px, ${state.y}px)`;
      el.vehicleMarker.style.display   = 'block';

      if (el.vehicleHeading) el.vehicleHeading.style.transform = `rotate(${state.heading}deg)`;

      if (el.accCircle) {
        el.accCircle.setAttribute('cx', state.x);
        el.accCircle.setAttribute('cy', state.y);
        el.accCircle.setAttribute('r',  Math.max(12, state.accuracyRadius));
        el.accCircle.style.display = 'block';
      }

      setStatus(state.status);
    }

    animFrameId = requestAnimationFrame(renderLoop);
  }

  function setStatus(s) {
    if (!el.statusBadge) return;
    el.statusBadge.innerText  = s;
    el.statusBadge.className  = 'badge ' + (
      s === 'LIVE'     ? 'badge-green'  :
      s === 'WEAK_GPS' ? 'badge-amber'  :
      s === 'DELAYED'  ? 'badge-orange' : 'badge-red'
    );
  }

  function drawRoute(carPt) {
    const dx      = carPt.x - userPos.x;
    const dy      = carPt.y - userPos.y;
    const distPx  = Math.hypot(dx, dy);
    const dist    = Math.max(5, Math.round(distPx / 4.6));
    const eta     = Math.max(1, Math.ceil(dist / 75));
    const path    = `M ${userPos.x} ${userPos.y} L ${carPt.x} ${carPt.y}`;

    activeRoute = { path, dist, eta };

    if (el.routeLayer) {
      el.routeLayer.innerHTML =
        `<path d="${path}" fill="none" stroke="#e11d48" stroke-width="8"
               stroke-linecap="round" stroke-linejoin="round"
               stroke-dasharray="14 10" class="nav-route-anim"/>` +
        `<path d="${path}" fill="none" stroke="#fff"   stroke-width="4"
               stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (el.navDetails) {
      el.navDetails.innerText      = `Straight-line: ${dist}m (~${eta} min walk)`;
      el.navDetails.style.display  = 'block';
    }
  }

  function clearRoute() {
    activeRoute = null;
    if (el.routeLayer)  el.routeLayer.innerHTML    = '';
    if (el.navDetails)  el.navDetails.style.display = 'none';
  }

  function toggleNav() {
    const state = interpolator.getCurrentState();
    if (!state) { alert('Vehicle location not available yet.'); return; }

    if (activeRoute) {
      clearRoute();
      el.btnNav.innerText  = 'Navigate To Car';
      el.btnNav.className  = 'btn btn-primary';
    } else {
      drawRoute({ x: state.x, y: state.y });
      el.btnNav.innerText  = 'Stop Navigation';
      el.btnNav.className  = 'btn btn-danger';
    }
  }

  if (el.btnNav) el.btnNav.addEventListener('click', toggleNav);

  connect();
  animFrameId = requestAnimationFrame(renderLoop);

  return {
    destroy: () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (rtChannel)   rtChannel.unsubscribe();
    },
    pushTelemetry: (data) => onTelemetry(data),
    setUserLocation: (pt) => {
      userPos = pt;
      const cur = interpolator.getCurrentState();
      if (cur && activeRoute) drawRoute(cur);
    },
  };
}
