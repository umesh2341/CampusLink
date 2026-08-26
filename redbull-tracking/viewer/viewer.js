import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { createAffineTransformer } from '../lib/affineTransform.js';
import { createVehicleInterpolator } from '../lib/interpolator.js';
import { createSemanticLocationResolver } from '../lib/semanticLocation.js';
import { calculateRouteToCar } from '../lib/routingBridge.js';

const DEFAULT_COEFFICIENTS = {
  a: 478863.683905,
  b: -19596.875341,
  c: -40689501.705,
  d: 3693.35968,
  e: -499077.146284,
  f: 9789781.4823,
};

export function initViewer(customConfig = {}) {
  let supabase = null;
  let realtimeChannel = null;
  let animationFrameId = null;

  const coefficients = customConfig.coefficients || DEFAULT_COEFFICIENTS;
  const transformer = createAffineTransformer(coefficients);
  const interpolator = createVehicleInterpolator();
  const semanticResolver = createSemanticLocationResolver();

  let userSimulatedLocation = { x: 437, y: 650 };
  let currentActiveRoute = null;

  const elements = {
    mapViewport: document.getElementById('mapViewport'),
    mapContainer: document.getElementById('mapContainer'),
    vehicleMarker: document.getElementById('vehicleMarker'),
    vehicleHeading: document.getElementById('vehicleHeading'),
    accuracyCircle: document.getElementById('accuracyCircle'),
    routeLayer: document.getElementById('routeLayer'),
    statusBadge: document.getElementById('statusBadge'),
    landmarkText: document.getElementById('landmarkText'),
    speedText: document.getElementById('speedText'),
    updatedTimeText: document.getElementById('updatedTimeText'),
    btnNavigate: document.getElementById('btnNavigate'),
    navDetails: document.getElementById('navDetails'),
  };

  function setupSupabase() {
    const url = customConfig.supabaseUrl ||
      document.getElementById('cfgSupabaseUrl')?.value?.trim() ||
      new URLSearchParams(window.location.search).get('url');

    const key = customConfig.supabaseKey ||
      document.getElementById('cfgSupabaseKey')?.value?.trim() ||
      new URLSearchParams(window.location.search).get('key');

    if (!url || !key) return;

    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    fetchInitialState();
    subscribeRealtime();
  }

  async function fetchInitialState() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('redbull_car_live')
        .select('*')
        .eq('device_label', 'REDBULL_CAR_01')
        .maybeSingle();

      if (error) {
        const fallbackRes = await supabase
          .from('redbull_car_telemetry')
          .select('latitude, longitude, accuracy, altitude, heading, speed, updated_at')
          .eq('device_label', 'REDBULL_CAR_01')
          .maybeSingle();

        if (fallbackRes.data) {
          processIncomingTelemetry(fallbackRes.data);
        }
        return;
      }

      if (data) {
        processIncomingTelemetry(data);
      }
    } catch (err) {
      console.error('Initial state fetch error:', err.message);
    }
  }

  function subscribeRealtime() {
    if (!supabase) return;

    realtimeChannel = supabase
      .channel('redbull-telemetry-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redbull_car_telemetry',
          filter: 'device_label=eq.REDBULL_CAR_01',
        },
        (payload) => {
          if (payload.new) {
            processIncomingTelemetry(payload.new);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          updateStatusUI('LIVE');
        } else if (status === 'CHANNEL_ERROR') {
          updateStatusUI('OFFLINE');
        }
      });
  }

  function processIncomingTelemetry(row) {
    if (!row || typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
      return;
    }

    const { x, y, accuracyRadiusPixels } = transformer.toMapCoordinates(
      row.latitude,
      row.longitude,
      row.accuracy
    );

    if (x === null || y === null) return;

    interpolator.setTarget({
      x: x,
      y: y,
      heading: row.heading !== null && row.heading !== undefined ? Number(row.heading) : null,
      accuracyRadius: accuracyRadiusPixels,
      speed: row.speed !== null && row.speed !== undefined ? Number(row.speed) : 0,
      accuracy: row.accuracy !== null && row.accuracy !== undefined ? Number(row.accuracy) : null,
      updatedAt: row.updated_at || Date.now(),
    });

    const semantic = semanticResolver.resolveLocation(x, y);
    elements.landmarkText.innerText = semantic.description;
    elements.speedText.innerText = row.speed ? `${(row.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h';
    elements.updatedTimeText.innerText = new Date(row.updated_at || Date.now()).toLocaleTimeString();

    if (currentActiveRoute) {
      recalculateRoute({ x, y });
    }
  }

  function renderLoop() {
    const state = interpolator.update();

    if (state && elements.vehicleMarker) {
      elements.vehicleMarker.style.transform = `translate(${state.x}px, ${state.y}px)`;
      elements.vehicleMarker.style.display = 'block';

      if (elements.vehicleHeading) {
        elements.vehicleHeading.style.transform = `rotate(${state.heading}deg)`;
      }

      if (elements.accuracyCircle) {
        elements.accuracyCircle.setAttribute('cx', state.x);
        elements.accuracyCircle.setAttribute('cy', state.y);
        elements.accuracyCircle.setAttribute('r', Math.max(12, state.accuracyRadius));
        elements.accuracyCircle.style.display = 'block';
      }

      updateStatusUI(state.status);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }

  function updateStatusUI(status) {
    if (!elements.statusBadge) return;

    elements.statusBadge.innerText = status;
    elements.statusBadge.className = 'badge ' + (
      status === 'LIVE' ? 'badge-green' :
      status === 'WEAK_GPS' ? 'badge-amber' :
      status === 'DELAYED' ? 'badge-orange' : 'badge-red'
    );
  }

  function recalculateRoute(carPoint) {
    const routeRes = calculateRouteToCar(userSimulatedLocation, carPoint);
    if (routeRes.status === 'active' && routeRes.route) {
      currentActiveRoute = routeRes.route;
      if (elements.routeLayer) {
        elements.routeLayer.innerHTML = `
          <path d="${routeRes.route.svgPathD}" fill="none" stroke="#e11d48" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="14 10" class="nav-route-anim" />
          <path d="${routeRes.route.svgPathD}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        `;
      }
      if (elements.navDetails) {
        elements.navDetails.innerText = `Walking Route: ${routeRes.route.distanceMeters}m (${routeRes.route.estimatedMinutes} min walk)`;
        elements.navDetails.style.display = 'block';
      }
    }
  }

  function toggleNavigation() {
    const currentState = interpolator.getCurrentState();
    if (!currentState) {
      alert('Vehicle location not available yet.');
      return;
    }

    if (currentActiveRoute) {
      currentActiveRoute = null;
      if (elements.routeLayer) elements.routeLayer.innerHTML = '';
      if (elements.navDetails) elements.navDetails.style.display = 'none';
      elements.btnNavigate.innerText = 'Navigate To Car';
      elements.btnNavigate.className = 'btn btn-primary';
    } else {
      recalculateRoute({ x: currentState.x, y: currentState.y });
      elements.btnNavigate.innerText = 'Stop Navigation';
      elements.btnNavigate.className = 'btn btn-danger';
    }
  }

  if (elements.btnNavigate) {
    elements.btnNavigate.addEventListener('click', toggleNavigation);
  }

  setupSupabase();
  animationFrameId = requestAnimationFrame(renderLoop);

  return {
    destroy: () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (realtimeChannel) realtimeChannel.unsubscribe();
    },
    pushTelemetryManual: (data) => processIncomingTelemetry(data),
    setUserLocation: (pt) => {
      userSimulatedLocation = pt;
      const cur = interpolator.getCurrentState();
      if (cur && currentActiveRoute) recalculateRoute(cur);
    },
  };
}
