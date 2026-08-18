/**
 * useAppStore — global UI state for CampusLink
 *
 * Manages three cross-component concerns that were previously
 * scattered across App.jsx useState calls and prop-drilled:
 *
 *  1. selectedBuilding  — which building is highlighted on the map
 *                         (shared by InteractiveMap and SearchBar result taps)
 *  2. isSidePanelOpen   — controls SidePanel visibility
 *  3. lastViewedMap     — per-building "last viewed" timestamp used for
 *                         seen/unseen badge colour logic; persisted to localStorage
 *
 * React Query stays untouched — this store handles only UI/derived state.
 */

import { create } from 'zustand';

const LS_KEY = 'campuslink_last_viewed_buildings';

/** Read the seen-state map from localStorage on store init */
function loadLastViewed() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist the seen-state map to localStorage */
function saveLastViewed(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch { /* ignore quota / private-mode errors */ }
}

const useAppStore = create((set, get) => ({
  // ── Building selection ────────────────────────────────────
  /** The full building object currently selected, or null */
  selectedBuilding: null,

  /** Open the side panel for a building and record "viewed now" */
  selectBuilding: (building) => {
    const nowISO = new Date().toISOString();
    const current = get().lastViewedMap;
    const updated = { ...current, [building.id]: nowISO };
    saveLastViewed(updated);
    set({
      selectedBuilding: { ...building },
      isSidePanelOpen: true,
      lastViewedMap: updated,
    });
  },

  /** Highlight a building on the map without opening the side panel */
  highlightBuilding: (building) => {
    set({
      selectedBuilding: { ...building },
      isSidePanelOpen: false,
    });
  },

  /** Clear the selected building and close the panel */
  clearBuilding: () => {
    set({ selectedBuilding: null, isSidePanelOpen: false });
  },

  // ── Side panel ────────────────────────────────────────────
  isSidePanelOpen: false,
  closeSidePanel: () => set({ isSidePanelOpen: false, selectedBuilding: null }),

  // ── Seen/unseen badge state ───────────────────────────────
  /**
   * Map of { [buildingId: string]: ISO-timestamp-string }
   * Loaded from localStorage on store init.
   */
  lastViewedMap: loadLastViewed(),

  /**
   * Explicitly mark a building as viewed at a given time (defaults to now).
   * Persists to localStorage.
   */
  markBuildingViewed: (buildingId, isoTimestamp = new Date().toISOString()) => {
    const updated = { ...get().lastViewedMap, [buildingId]: isoTimestamp };
    saveLastViewed(updated);
    set({ lastViewedMap: updated });
  },

  // ── Map Viewport Transform Persistence ──────────────────
  mapZoom: null,
  mapPan: null,
  setMapTransform: (zoom, pan) => set({ mapZoom: zoom, mapPan: pan }),
}));

export default useAppStore;
