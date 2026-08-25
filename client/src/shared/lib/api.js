/**
 * api.js — all fetch helpers used by useQuery hooks.
 * Each function returns a plain value (parsed JSON) so useQuery
 * can cache, deduplicate, and retry them automatically.
 *
 * Authenticated requests include the Supabase access token via
 * the Authorization header. The token is obtained lazily from
 * supabase.auth.getSession() so we don't need to pass it around.
 */

import { supabase } from './supabase';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://campuslinks.onrender.com');

/**
 * Get the current Supabase access token, if available.
 * Returns null if no session exists.
 */
async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Build headers for an API request.
 * If authenticated is true, includes the Authorization header.
 */
async function buildHeaders(authenticated = false, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (authenticated) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Authenticated fetch wrapper.
 * Includes Supabase access token in the Authorization header.
 */
export async function authFetch(url, options = {}) {
  const token = await getAccessToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

/** Generate or retrieve a persistent anonymous RFC4122 UUID for the current device/tester. */
export function getOrCreateDeviceId() {
  const STORAGE_KEY = 'campuslink_device_uuid';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '11111111-2222-3333-4444-555555555555';
  }
}

/** Fetch the full buildings list (with active_event_count and latest_event_created_at). */
export async function fetchBuildings() {
  const res = await fetch(`${API_BASE}/api/buildings`);
  if (!res.ok) throw new Error('Failed to fetch buildings');
  return res.json();
}

/** Fetch active events for a single building. */
export async function fetchBuildingEvents(buildingId) {
  const res = await fetch(`${API_BASE}/api/buildings/${buildingId}/events`);
  if (!res.ok) throw new Error(`Failed to fetch events for building ${buildingId}`);
  return res.json();
}

/**
 * Fetch search results for a query string.
 * Returns { results: [...] }.
 */
export async function fetchSearchResults(query) {
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}

/** Fetch list of all campus student clubs. */
export const fetchClubs = async () => {
  const res = await fetch(`${API_BASE}/api/clubs`);
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
};

export const fetchNotices = async () => {
  const res = await fetch(`${API_BASE}/api/notices`);
  if (!res.ok) throw new Error('Failed to fetch notices');
  return res.json();
};

/** Update user's current GPS location on backend (authenticated) */
export async function updateUserLocation(locationData) {
  const headers = await buildHeaders(true, { 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE}/api/location`, {
    method: 'POST',
    headers,
    body: JSON.stringify(locationData),
  });
  if (!res.ok) throw new Error('Failed to update live location');
  return res.json();
}

/** Retrieve user's current stored location (authenticated) */
export async function fetchUserLocation() {
  const headers = await buildHeaders(true);
  const res = await fetch(`${API_BASE}/api/location/me`, { headers });
  if (!res.ok) throw new Error('Failed to fetch user location');
  return res.json();
}

/** Stop location sharing on backend (authenticated) */
export async function stopUserLocationSharing() {
  const headers = await buildHeaders(true);
  const res = await fetch(`${API_BASE}/api/location/me`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to stop location sharing');
  return res.json();
}

/** Retrieve active users sharing location on campus (authenticated) */
export async function fetchActiveLocations() {
  const headers = await buildHeaders(true);
  const res = await fetch(`${API_BASE}/api/location/active`, { headers });
  if (!res.ok) throw new Error('Failed to fetch active campus locations');
  return res.json();
}
