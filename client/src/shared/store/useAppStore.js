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
  // ── Unified Overlay State ─────────────────────────────────
  /**
   * Only one primary overlay can be open at a time.
   * Valid values: 'SIDE_PANEL' | 'NAV_MENU' | 'NOTICE_BOARD' | 'CLUBS' | 'ABOUT' | 'NOTIFICATIONS' | 'PROFILE' | 'FEEDBACK' | 'LOCATION_CONSENT' | 'ALL_EVENTS' | null
   */
  activeOverlay: null,
  
  /** 
   * Switch the active overlay, with a 200ms delay to allow the current one to exit.
   */
  switchOverlay: (newOverlay) => {
    const current = get().activeOverlay;
    if (current && current !== newOverlay && newOverlay !== null) {
      // Close current overlay to trigger its exit animation
      set({ activeOverlay: null });
      // Wait for exit animation (200ms) before opening the new one
      setTimeout(() => {
        set({ activeOverlay: newOverlay });
      }, 200);
    } else {
      set({ activeOverlay: newOverlay });
    }
  },

  closeOverlay: () => set({ activeOverlay: null }),

  // ── Building selection ────────────────────────────────────
  /** The full building object currently selected, or null */
  selectedBuilding: null,

  /** Open the side panel for a building and record "viewed now" */
  selectBuilding: (building) => {
    const nowISO = new Date().toISOString();
    const current = get().lastViewedMap;
    const updated = { ...current, [building.id]: nowISO };
    saveLastViewed(updated);
    
    // Use the smooth transition logic
    get().switchOverlay('SIDE_PANEL');
    
    set({
      selectedBuilding: { ...building },
      lastViewedMap: updated,
    });
  },

  /** Highlight a building on the map without opening the side panel */
  highlightBuilding: (building) => {
    get().switchOverlay(null);
    set({
      selectedBuilding: { ...building },
    });
  },

  /** Clear the selected building and close the panel */
  clearBuilding: () => {
    get().switchOverlay(null);
    set({ selectedBuilding: null });
  },

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
