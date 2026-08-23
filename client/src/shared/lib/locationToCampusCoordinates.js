/**
 * locationToCampusCoordinates.js
 *
 * Mathematical Transformation Layer: WGS84 GPS (Latitude/Longitude) → Campus SVG (x, y)
 *
 * Employs a calibrated 2D Affine Transformation using multi-point Ground Control Anchors (GCPs)
 * derived directly from OpenStreetMap landmark coordinates across ITER, SOA University campus to
 * map real-world geolocation fixes accurately onto the fixed 1580px x 2891px SVG canvas.
 */

// Ground Control Points (GCPs) for ITER, SOA University
export const CAMPUS_GEO_CONFIG = {
  campusName: 'ITER, SOA University',
  centerLat: 20.2485,
  centerLng: 85.8010,
  svgWidth: 1580,
  svgHeight: 2891,
  
  // Perimeter bounding box for campus validity checking (covering all blocks and North/South hostels)
  bounds: {
    minLat: 20.2435,
    maxLat: 20.2520,
    minLng: 85.7975,
    maxLng: 85.8045,
  },

  // Calibrated Ground Control Anchors across North, Core Academic, and South Campus zones
  anchors: [
    { name: 'LH-5 (North Gate)', lat: 20.250620, lng: 85.801050, svgX: 676, svgY: 48 },
    { name: 'BH-7 (North-West)', lat: 20.250403, lng: 85.800364, svgX: 389, svgY: 138 },
    { name: 'BH-2 (North)', lat: 20.250319, lng: 85.800819, svgX: 590, svgY: 180 },
    { name: 'BH-1 (North)', lat: 20.249985, lng: 85.800832, svgX: 572, svgY: 366 },
    { name: 'Admin / Academic Block', lat: 20.249472, lng: 85.800603, svgX: 437, svgY: 650 },
    { name: 'Centre for Data Science', lat: 20.249447, lng: 85.801393, svgX: 869, svgY: 614 },
    { name: 'Futsal / Football Court 1', lat: 20.249177, lng: 85.801115, svgX: 709, svgY: 766 },
    { name: 'Auditorium', lat: 20.249192, lng: 85.801627, svgX: 941, svgY: 794 },
    { name: 'C-Block', lat: 20.248795, lng: 85.801163, svgX: 716, svgY: 961 },
    { name: 'SC-Block (Sports Complex)', lat: 20.248375, lng: 85.801274, svgX: 764, svgY: 1177 },
    { name: 'F-Block', lat: 20.248446, lng: 85.801871, svgX: 1053, svgY: 1213 },
    { name: 'Food Court / Cafeteria', lat: 20.248166, lng: 85.802406, svgX: 1337, svgY: 1308 },
    { name: 'E-Block', lat: 20.247555, lng: 85.801300, svgX: 871, svgY: 1485 },
    { name: 'Basketball / Cricket Ground', lat: 20.247594, lng: 85.800515, svgX: 394, svgY: 1614 },
    { name: 'LH-4 (South-West)', lat: 20.247100, lng: 85.800700, svgX: 583, svgY: 1836 },
    { name: 'LH-3 (South)', lat: 20.246450, lng: 85.801350, svgX: 847, svgY: 2143 },
    { name: 'BH-5 / BH-8 (South-East)', lat: 20.245800, lng: 85.802300, svgX: 1302, svgY: 2436 },
    { name: 'BH-9 (South Gate)', lat: 20.245450, lng: 85.802400, svgX: 1451, svgY: 2637 },
    { name: 'Football Court 2 (South End)', lat: 20.245050, lng: 85.802100, svgX: 1344, svgY: 2830 },
  ],
};

/**
 * Numerically stable Least Squares regression solver for 2D Affine Transformation:
 *  x = a * (lat - centerLat) + b * (lng - centerLng) + c_rel
 *  y = d * (lat - centerLat) + e * (lng - centerLng) + f_rel
 */
function solveCalibratedAffineMatrix(anchors, centerLat, centerLng) {
  let sum_lat2 = 0, sum_lng2 = 0, sum_lat_lng = 0, sum_lat = 0, sum_lng = 0;
  let sum_x_lat = 0, sum_x_lng = 0, sum_x = 0;
  let sum_y_lat = 0, sum_y_lng = 0, sum_y = 0;
  const n = anchors.length;

  for (const p of anchors) {
    const lat = p.lat - centerLat;
    const lng = p.lng - centerLng;
    const x = p.svgX;
    const y = p.svgY;

    sum_lat2 += lat * lat;
    sum_lng2 += lng * lng;
    sum_lat_lng += lat * lng;
    sum_lat += lat;
    sum_lng += lng;

    sum_x_lat += x * lat;
    sum_x_lng += x * lng;
    sum_x += x;

    sum_y_lat += y * lat;
    sum_y_lng += y * lng;
    sum_y += y;
  }

  function solve3x3(M, V) {
    const det =
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

    if (Math.abs(det) < 1e-18) {
      return [0, 0, 790];
    }

    function detReplace(colIdx) {
      const Mc = M.map((row, rIdx) => {
        const nr = [...row];
        nr[colIdx] = V[rIdx];
        return nr;
      });
      return (
        Mc[0][0] * (Mc[1][1] * Mc[2][2] - Mc[1][2] * Mc[2][1]) -
        Mc[0][1] * (Mc[1][0] * Mc[2][2] - Mc[1][2] * Mc[2][0]) +
        Mc[0][2] * (Mc[1][0] * Mc[2][1] - Mc[1][1] * Mc[2][0])
      );
    }

    return [
      detReplace(0) / det,
      detReplace(1) / det,
      detReplace(2) / det,
    ];
  }

  const M = [
    [sum_lat2, sum_lat_lng, sum_lat],
    [sum_lat_lng, sum_lng2, sum_lng],
    [sum_lat, sum_lng, n],
  ];

  const [a_rel, b_rel, c_rel] = solve3x3(M, [sum_x_lat, sum_x_lng, sum_x]);
  const [d_rel, e_rel, f_rel] = solve3x3(M, [sum_y_lat, sum_y_lng, sum_y]);

  return {
    a_rel,
    b_rel,
    c_rel,
    d_rel,
    e_rel,
    f_rel,
    centerLat,
    centerLng,
  };
}

const affineCoefficients = solveCalibratedAffineMatrix(
  CAMPUS_GEO_CONFIG.anchors,
  CAMPUS_GEO_CONFIG.centerLat,
  CAMPUS_GEO_CONFIG.centerLng
);

/**
 * Convert GPS latitude & longitude to CampusLink SVG x, y coordinates
 * @param {Object} coords - { latitude, longitude, accuracy }
 * @returns {Object} { x, y, isInsideCampus, status, accuracyRadiusPixels }
 */
export function convertGpsToCampusCoordinates({ latitude, longitude, accuracy = null }) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    return { x: null, y: null, isInsideCampus: false, status: 'INVALID_COORDINATES' };
  }

  const { bounds, svgWidth, svgHeight } = CAMPUS_GEO_CONFIG;
  const isInsideCampus =
    latitude >= bounds.minLat &&
    latitude <= bounds.maxLat &&
    longitude >= bounds.minLng &&
    longitude <= bounds.maxLng;

  const { a_rel, b_rel, c_rel, d_rel, e_rel, f_rel, centerLat, centerLng } = affineCoefficients;
  const dLat = latitude - centerLat;
  const dLng = longitude - centerLng;

  const rawX = a_rel * dLat + b_rel * dLng + c_rel;
  const rawY = d_rel * dLat + e_rel * dLng + f_rel;

  // If projected position is outside the SVG canvas (with a generous 300px buffer),
  // return null so the marker does NOT render rather than snapping to a corner.
  // This prevents every user appearing at (10,10) when their first GPS fix is inaccurate.
  const BUFFER = 300;
  if (rawX < -BUFFER || rawX > svgWidth + BUFFER || rawY < -BUFFER || rawY > svgHeight + BUFFER) {
    return {
      x: null,
      y: null,
      rawX: Math.round(rawX),
      rawY: Math.round(rawY),
      isInsideCampus: false,
      status: 'OUT_OF_BOUNDS',
      accuracyRadiusPixels: 20,
    };
  }

  // Clamp within SVG boundaries with a small margin — only reached for positions
  // that are close to campus (within the 300px buffer above).
  const x = Math.max(10, Math.min(svgWidth - 10, Math.round(rawX)));
  const y = Math.max(10, Math.min(svgHeight - 10, Math.round(rawY)));

  // Meter-to-SVG pixel scaling: ~4.6 pixels per meter across the 1580x2891 canvas (~534 meters N-S)
  const accuracyRadiusPixels = accuracy
    ? Math.max(12, Math.min(120, Math.round(accuracy * 4.6)))
    : 20;

  return {
    x,
    y,
    rawX: Math.round(rawX),
    rawY: Math.round(rawY),
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
