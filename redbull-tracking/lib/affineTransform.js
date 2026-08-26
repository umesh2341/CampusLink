export function createAffineTransformer(coefficients, mapConfig = {}) {
  const {
    a = 0,
    b = 0,
    c = 0,
    d = 0,
    e = 0,
    f = 0,
  } = coefficients || {};

  const {
    svgWidth = 1580,
    svgHeight = 2891,
    bounds = {
      minLat: 20.2435,
      maxLat: 20.2520,
      minLng: 85.7975,
      maxLng: 85.8045,
    },
    pixelsPerMeter = 4.6,
  } = mapConfig;

  function toMapCoordinates(latitude, longitude, accuracy = null) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        x: null,
        y: null,
        isInsideBounds: false,
        accuracyRadiusPixels: 0,
      };
    }

    const rawX = a * lng + b * lat + c;
    const rawY = d * lng + e * lat + f;

    const isInsideBounds =
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng;

    const clampedX = Math.max(0, Math.min(svgWidth, Math.round(rawX)));
    const clampedY = Math.max(0, Math.min(svgHeight, Math.round(rawY)));

    const accuracyRadiusPixels = accuracy !== null && accuracy !== undefined
      ? Math.max(8, Math.min(180, Math.round(Number(accuracy) * pixelsPerMeter)))
      : 24;

    return {
      x: clampedX,
      y: clampedY,
      rawX: rawX,
      rawY: rawY,
      isInsideBounds: isInsideBounds,
      accuracyRadiusPixels: accuracyRadiusPixels,
    };
  }

  function toGpsCoordinates(x, y) {
    const px = Number(x);
    const py = Number(y);

    const det = a * e - b * d;
    if (Math.abs(det) < 1e-15) {
      return { latitude: null, longitude: null };
    }

    const adjX = px - c;
    const adjY = py - f;

    const lng = (e * adjX - b * adjY) / det;
    const lat = (-d * adjX + a * adjY) / det;

    return {
      latitude: lat,
      longitude: lng,
    };
  }

  return {
    toMapCoordinates,
    toGpsCoordinates,
    coefficients: { a, b, c, d, e, f },
    mapConfig,
  };
}
