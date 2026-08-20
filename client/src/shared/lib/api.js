/**
 * api.js — all fetch helpers used by useQuery hooks.
 * Each function returns a plain value (parsed JSON) so useQuery
 * can cache, deduplicate, and retry them automatically.
 */

export const API_BASE = import.meta.env.VITE_API_URL || '';

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
export async function fetchClubs() {
  const res = await fetch('/api/clubs');
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

/** Update user's current GPS location on backend */
export async function updateUserLocation(locationData, userId = '11111111-2222-3333-4444-555555555555') {
  const res = await fetch('/api/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(locationData),
  });
  if (!res.ok) throw new Error('Failed to update live location');
  return res.json();
}

/** Retrieve user's current stored location */
export async function fetchUserLocation(userId = '11111111-2222-3333-4444-555555555555') {
  const res = await fetch('/api/location/me', {
    headers: {
      'x-user-id': userId,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user location');
  return res.json();
}

/** Stop location sharing on backend */
export async function stopUserLocationSharing(userId = '11111111-2222-3333-4444-555555555555') {
  const res = await fetch('/api/location/me', {
    method: 'DELETE',
    headers: {
      'x-user-id': userId,
    },
  });
  if (!res.ok) throw new Error('Failed to stop location sharing');
  return res.json();
}

/** Retrieve active users sharing location on campus */
export async function fetchActiveLocations(userId = '11111111-2222-3333-4444-555555555555') {
  const res = await fetch('/api/location/active', {
    headers: {
      'x-user-id': userId,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch active campus locations');
  return res.json();
}

