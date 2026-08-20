/**
 * locationToCampusCoordinates.js
 *
 * Mathematical Transformation Layer: WGS84 GPS (Latitude/Longitude) → Campus SVG (x, y)
 *
 * Employs a 2D Affine Transformation calibrated with 3 Ground Control Anchors (GCPs)
 * across ITER, SOA University campus to map real-world geolocation fixes onto
 * the fixed 1580px x 2891px SVG canvas.
 */

// Ground Control Points (GCPs) for ITER, SOA University
export const CAMPUS_GEO_CONFIG = {
  campusName: 'ITER, SOA University',
  centerLat: 20.2520,
  centerLng: 85.7985,
  svgWidth: 1580,
  svgHeight: 2891,
  
  // Perimeter bounding box for campus validity checking
  bounds: {
    minLat: 20.2470,
    maxLat: 20.2570,
    minLng: 85.7930,
    maxLng: 85.8035,
  },

  // 3 Ground Control Anchors for Affine transformation matrix solving
  anchors: [
    { name: 'LH5 (North Gate)', lat: 20.2548, lng: 85.7972, svgX: 676, svgY: 48 },
    { name: 'Sports Complex / BH9 (South)', lat: 20.2492, lng: 85.8015, svgX: 1451, svgY: 2637 },
    { name: 'D-Block (West Academic)', lat: 20.2521, lng: 85.7950, svgX: 321, svgY: 1266 },
  ],
};

/**
 * Solve 2D affine transformation coefficients using 3 reference points:
 *  x = a * lat + b * lng + c
 *  y = d * lat + e * lng + f
 */
function solveAffineMatrix(anchors) {
  const [p1, p2, p3] = anchors;

  const det =
    p1.lat * (p2.lng - p3.lng) -
    p2.lat * (p1.lng - p3.lng) +
    p3.lat * (p1.lng - p2.lng);

  if (Math.abs(det) < 1e-12) {
    // Fallback linear scaling if degenerate
    return { a: 0, b: 0, c: 790, d: 0, e: 0, f: 1445 };
  }

  const a = (p1.svgX * (p2.lng - p3.lng) - p2.svgX * (p1.lng - p3.lng) + p3.svgX * (p1.lng - p2.lng)) / det;
  const b = (p1.lat * (p2.svgX - p3.svgX) - p2.lat * (p1.svgX - p3.svgX) + p3.lat * (p1.svgX - p2.svgX)) / det;
  const c = p1.svgX - a * p1.lat - b * p1.lng;

  const d = (p1.svgY * (p2.lng - p3.lng) - p2.svgY * (p1.lng - p3.lng) + p3.svgY * (p1.lng - p2.lng)) / det;
  const e = (p1.lat * (p2.svgY - p3.svgY) - p2.lat * (p1.svgY - p3.svgY) + p3.lat * (p1.svgY - p2.svgY)) / det;
  const f = p1.svgY - d * p1.lat - e * p1.lng;

  return { a, b, c, d, e, f };
}

const affineCoefficients = solveAffineMatrix(CAMPUS_GEO_CONFIG.anchors);

/**
 * Convert GPS latitude & longitude to CampusLink SVG x, y coordinates
 * @param {Object} coords - { latitude, longitude, accuracy }
 * @returns {Object} { x, y, isInsideCampus, status, accuracyRadiusPixels }
 */
export function convertGpsToCampusCoordinates({ latitude, longitude, accuracy = null }) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { x: null, y: null, isInsideCampus: false, status: 'INVALID_COORDINATES' };
  }

  const { bounds, svgWidth, svgHeight } = CAMPUS_GEO_CONFIG;
  const isInsideCampus =
    latitude >= bounds.minLat &&
    latitude <= bounds.maxLat &&
    longitude >= bounds.minLng &&
    longitude <= bounds.maxLng;

  const { a, b, c, d, e, f } = affineCoefficients;
  let rawX = a * latitude + b * longitude + c;
  let rawY = d * latitude + e * longitude + f;

  // Clamp within SVG boundaries
  const x = Math.max(20, Math.min(svgWidth - 20, Math.round(rawX)));
  const y = Math.max(20, Math.min(svgHeight - 20, Math.round(rawY)));

  // Approximate meter-to-SVG pixel scaling (~0.45 pixels per meter on 1580x2891 map)
  const accuracyRadiusPixels = accuracy ? Math.max(8, Math.min(80, Math.round(accuracy * 0.45))) : 16;

  return {
    x,
    y,
    isInsideCampus,
    status: isInsideCampus ? 'INSIDE_CAMPUS' : 'OUTSIDE_CAMPUS',
    accuracyRadiusPixels,
  };
}

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
