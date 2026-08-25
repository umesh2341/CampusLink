/**
 * useNavigation.js
 *
 * Custom React hook for CampusLink navigation management.
 * Connects the live user location with the target building,
 * calculates the shortest directional path, and maintains navigation lifecycle.
 *
 * Supports transport modes: WALK | BIKE | CAR
 */

import { useState, useCallback, useRef } from 'react';
import { calculateCampusRoute } from '../lib/routingEngine.js';
import { buildingCoords } from '../../../shared/lib/buildingCoords.js';

export function useNavigation() {
  const [navigationStatus, setNavigationStatus] = useState('idle'); // 'idle' | 'calculating' | 'active' | 'error'
  const [activeRoute, setActiveRoute] = useState(null);
  const [destinationBuilding, setDestinationBuilding] = useState(null);
  const [navigationError, setNavigationError] = useState(null);
  const [transportMode, setTransportModeState] = useState('WALK'); // 'WALK' | 'BIKE' | 'CAR'

  // Refs to support recalculation when mode changes (avoids stale closures)
  const destinationRef = useRef(null);
  const userLocationRef = useRef(null);

  /**
   * Internal route calculation shared by startNavigation and setTransportMode
   */
  const _calculateAndSetRoute = useCallback((building, userLocation, mode) => {
    setNavigationError(null);
    setNavigationStatus('calculating');
    setDestinationBuilding(building);
    destinationRef.current = building;
    userLocationRef.current = userLocation;

    if (!userLocation || userLocation.x === null || userLocation.y === null || typeof userLocation.x !== 'number' || typeof userLocation.y !== 'number') {
      setNavigationStatus('error');
      setNavigationError('Current location unavailable.');
      setActiveRoute(null);
      return;
    }

    try {
      const result = calculateCampusRoute({
        startLocation: { x: userLocation.x, y: userLocation.y },
        destinationBuilding: building,
        buildingCoordsMap: buildingCoords,
        transportMode: mode,
      });

      if (result.status === 'active' && result.route) {
        setActiveRoute(result.route);
        setNavigationStatus('active');
        setNavigationError(null);
      } else {
        setActiveRoute(null);
        setNavigationStatus(result.status === 'no_route' ? 'no_route' : 'error');
        setNavigationError(result.error || 'No route available.');
      }
    } catch (err) {
      console.error('[Navigation] Route calculation exception:', err);
      setActiveRoute(null);
      setNavigationStatus('error');
      setNavigationError('Failed to calculate route.');
    }
  }, []);

  /**
   * Start navigation from the user's current live location to a selected building
   */
  const startNavigation = useCallback((building, userLocation, mode) => {
    if (!building) return;
    const activeMode = mode ?? transportMode;
    setTransportModeState(activeMode);
    _calculateAndSetRoute(building, userLocation, activeMode);
  }, [_calculateAndSetRoute, transportMode]);

  /**
   * Stop active navigation and clean up route state
   * (Does NOT stop the global live GPS tracker)
   */
  const stopNavigation = useCallback(() => {
    setNavigationStatus('idle');
    setActiveRoute(null);
    setDestinationBuilding(null);
    setNavigationError(null);
    destinationRef.current = null;
    userLocationRef.current = null;
  }, []);

  /**
   * Switch destination while navigation is active or start new route
   */
  const updateDestination = useCallback((newBuilding, userLocation) => {
    if (!newBuilding) {
      stopNavigation();
      return;
    }
    startNavigation(newBuilding, userLocation);
  }, [startNavigation, stopNavigation]);

  /**
   * Change transport mode and recalculate active route
   */
  const setTransportMode = useCallback((newMode) => {
    setTransportModeState(newMode);
    // Recalculate if navigation is currently active
    if (destinationRef.current && userLocationRef.current) {
      _calculateAndSetRoute(destinationRef.current, userLocationRef.current, newMode);
    }
  }, [_calculateAndSetRoute]);

  return {
    isNavigating: navigationStatus === 'active' || navigationStatus === 'calculating' || navigationStatus === 'no_route',
    navigationStatus,
    activeRoute,
    destinationBuilding,
    navigationError,
    transportMode,
    startNavigation,
    stopNavigation,
    updateDestination,
    setTransportMode,
  };
}

export default useNavigation;
