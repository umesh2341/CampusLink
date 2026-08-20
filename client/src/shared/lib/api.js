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
