import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const CONFIG_KEY = 'redbull_tracker_auth_config';

function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {}
}

export function initTracker() {
  let supabase = null;
  let watchId = null;
  let wakeLock = null;
  let isTrackingActive = false;

  let lastSentState = null;
  let sendCount = 0;
  let errorCount = 0;

  const elements = {
    supabaseUrl: document.getElementById('supabaseUrl'),
    supabaseKey: document.getElementById('supabaseKey'),
    secretToken: document.getElementById('secretToken'),
    deviceLabel: document.getElementById('deviceLabel'),
    btnToggle: document.getElementById('btnToggle'),
    btnManualPulse: document.getElementById('btnManualPulse'),
    statusBadge: document.getElementById('statusBadge'),
    wakeLockBadge: document.getElementById('wakeLockBadge'),
    statLat: document.getElementById('statLat'),
    statLng: document.getElementById('statLng'),
    statAccuracy: document.getElementById('statAccuracy'),
    statSpeed: document.getElementById('statSpeed'),
    statHeading: document.getElementById('statHeading'),
    statSentCount: document.getElementById('statSentCount'),
    statLastSent: document.getElementById('statLastSent'),
    errorLog: document.getElementById('errorLog'),
  };

  const stored = loadStoredConfig();
  if (stored) {
    if (stored.supabaseUrl) elements.supabaseUrl.value = stored.supabaseUrl;
    if (stored.supabaseKey) elements.supabaseKey.value = stored.supabaseKey;
    if (stored.secretToken) elements.secretToken.value = stored.secretToken;
    if (stored.deviceLabel) elements.deviceLabel.value = stored.deviceLabel;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('url')) elements.supabaseUrl.value = urlParams.get('url');
  if (urlParams.get('key')) elements.supabaseKey.value = urlParams.get('key');
  if (urlParams.get('secret')) elements.secretToken.value = urlParams.get('secret');

  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        elements.wakeLockBadge.innerText = 'WakeLock: ACTIVE';
        elements.wakeLockBadge.className = 'badge badge-green';
        wakeLock.addEventListener('release', () => {
          elements.wakeLockBadge.innerText = 'WakeLock: RELEASED';
          elements.wakeLockBadge.className = 'badge badge-amber';
        });
      } catch (err) {
        elements.wakeLockBadge.innerText = 'WakeLock: FAILED';
        elements.wakeLockBadge.className = 'badge badge-red';
      }
    } else {
      elements.wakeLockBadge.innerText = 'WakeLock: UNSUPPORTED';
      elements.wakeLockBadge.className = 'badge badge-muted';
    }
  }

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isTrackingActive) {
      await requestWakeLock();
    }
  });

  async function startTracking() {
    const url = elements.supabaseUrl.value.trim();
    const key = elements.supabaseKey.value.trim();
    const secret = elements.secretToken.value.trim();
    const device = elements.deviceLabel.value.trim() || 'REDBULL_CAR_01';

    if (!url || !key || !secret) {
      showError('Please fill in Supabase URL, Anon Key, and Tracker Secret.');
      return;
    }

    saveConfig({ supabaseUrl: url, supabaseKey: key, secretToken: secret, deviceLabel: device });

    try {
      supabase = createClient(url, key, {
        auth: { persistSession: false },
      });
    } catch (err) {
      showError('Failed to initialize Supabase client: ' + err.message);
      return;
    }

    if (!navigator.geolocation) {
      showError('Geolocation is not supported by this browser.');
      return;
    }

    isTrackingActive = true;
    elements.btnToggle.innerText = 'Stop Live Transmission';
    elements.btnToggle.className = 'btn btn-danger';
    elements.statusBadge.innerText = 'TRANSMITTING';
    elements.statusBadge.className = 'badge badge-green pulse';

    await requestWakeLock();

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    watchId = navigator.geolocation.watchPosition(
      handleGeoSuccess,
      handleGeoError,
      geoOptions
    );
  }

  function stopTracking() {
    isTrackingActive = false;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }

    elements.btnToggle.innerText = 'Start Live Transmission';
    elements.btnToggle.className = 'btn btn-primary';
    elements.statusBadge.innerText = 'STANDBY';
    elements.statusBadge.className = 'badge badge-muted';
  }

  async function handleGeoSuccess(pos) {
    if (!isTrackingActive) return;

    const coords = pos.coords;
    const lat = coords.latitude;
    const lng = coords.longitude;
    const accuracy = coords.accuracy;
    const speed = coords.speed !== null && coords.speed >= 0 ? coords.speed : null;
    const heading = coords.heading !== null && !isNaN(coords.heading) && coords.heading >= 0 ? coords.heading : null;
    const altitude = coords.altitude;

    elements.statLat.innerText = lat.toFixed(7);
    elements.statLng.innerText = lng.toFixed(7);
    elements.statAccuracy.innerText = `±${Math.round(accuracy)}m`;
    elements.statSpeed.innerText = speed !== null ? `${(speed * 3.6).toFixed(1)} km/h` : '--';
    elements.statHeading.innerText = heading !== null ? `${Math.round(heading)}°` : '--';

    if (accuracy > 90) {
      elements.statusBadge.innerText = 'WEAK GPS';
      elements.statusBadge.className = 'badge badge-amber';
    } else {
      elements.statusBadge.innerText = 'TRANSMITTING';
      elements.statusBadge.className = 'badge badge-green pulse';
    }

    const now = Date.now();
    if (lastSentState) {
      const timeDelta = now - lastSentState.time;
      if (timeDelta < 1200) {
        return;
      }
    }

    await transmitLocation({
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      altitude: altitude,
      heading: heading,
      speed: speed,
    });
  }

  function handleGeoError(err) {
    let msg = 'GPS Error: ' + err.message;
    if (err.code === 1) msg = 'Location permission denied by user.';
    if (err.code === 2) msg = 'GPS signal unavailable. Move outdoors.';
    if (err.code === 3) msg = 'GPS acquisition timed out. Retrying...';
    showError(msg);
    elements.statusBadge.innerText = 'GPS ERROR';
    elements.statusBadge.className = 'badge badge-red';
  }

  async function transmitLocation(data) {
    if (!supabase) return;

    const secret = elements.secretToken.value.trim();
    const device = elements.deviceLabel.value.trim() || 'REDBULL_CAR_01';

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('upsert_redbull_location', {
        p_device_label: device,
        p_secret_token: secret,
        p_latitude: data.latitude,
        p_longitude: data.longitude,
        p_accuracy: data.accuracy,
        p_altitude: data.altitude,
        p_heading: data.heading,
        p_speed: data.speed,
      });

      if (rpcErr) {
        throw new Error(rpcErr.message);
      }

      if (rpcRes && rpcRes.success === false) {
        throw new Error(rpcRes.error || 'Server rejected payload');
      }

      sendCount++;
      lastSentState = { ...data, time: Date.now() };
      elements.statSentCount.innerText = sendCount;
      elements.statLastSent.innerText = new Date().toLocaleTimeString();
      clearError();
    } catch (err) {
      errorCount++;
      showError(`Transmission Failed: ${err.message}`);
    }
  }

  function showError(msg) {
    elements.errorLog.style.display = 'block';
    elements.errorLog.innerText = msg;
  }

  function clearError() {
    elements.errorLog.style.display = 'none';
    elements.errorLog.innerText = '';
  }

  elements.btnToggle.addEventListener('click', () => {
    if (isTrackingActive) {
      stopTracking();
    } else {
      startTracking();
    }
  });

  elements.btnManualPulse.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => handleGeoSuccess(pos),
      (err) => handleGeoError(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}
