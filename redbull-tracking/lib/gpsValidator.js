export function validateGpsPayload(payload, lastKnownState = null, options = {}) {
  const {
    maxAccuracyMeters = 80,
    maxSpeedMps = 35,
    minTimeDeltaMs = 800,
    maxDistanceJumpMeters = 250,
  } = options;

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, reason: 'PAYLOAD_NOT_AN_OBJECT' };
  }

  const lat = Number(payload.latitude);
  const lng = Number(payload.longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { isValid: false, reason: 'INVALID_LATITUDE' };
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { isValid: false, reason: 'INVALID_LONGITUDE' };
  }

  const accuracy = payload.accuracy !== undefined && payload.accuracy !== null
    ? Number(payload.accuracy)
    : null;

  if (accuracy !== null) {
    if (!Number.isFinite(accuracy) || accuracy < 0) {
      return { isValid: false, reason: 'INVALID_ACCURACY_VALUE' };
    }
    if (accuracy > maxAccuracyMeters) {
      return { isValid: false, reason: 'ACCURACY_TOO_POOR', accuracy };
    }
  }

  const speed = payload.speed !== undefined && payload.speed !== null
    ? Number(payload.speed)
    : null;

  if (speed !== null) {
    if (!Number.isFinite(speed) || speed < 0) {
      return { isValid: false, reason: 'INVALID_SPEED_VALUE' };
    }
    if (speed > maxSpeedMps) {
      return { isValid: false, reason: 'EXCESSIVE_SPEED', speed };
    }
  }

  const heading = payload.heading !== undefined && payload.heading !== null
    ? Number(payload.heading)
    : null;

  if (heading !== null) {
    if (!Number.isFinite(heading) || heading < 0 || heading > 360) {
      return { isValid: false, reason: 'INVALID_HEADING_VALUE' };
    }
  }

  const timestamp = payload.timestamp
    ? new Date(payload.timestamp).getTime()
    : Date.now();

  if (isNaN(timestamp) || timestamp > Date.now() + 60000 || timestamp < Date.now() - 86400000) {
    return { isValid: false, reason: 'INVALID_TIMESTAMP' };
  }

  if (lastKnownState && lastKnownState.latitude && lastKnownState.longitude) {
    const lastTimestamp = lastKnownState.timestamp
      ? new Date(lastKnownState.timestamp).getTime()
      : 0;
    const timeDeltaMs = timestamp - lastTimestamp;

    if (timeDeltaMs > 0 && timeDeltaMs < minTimeDeltaMs) {
      return { isValid: false, reason: 'RATE_LIMIT_THROTTLED', timeDeltaMs };
    }

    const distanceMeters = haversineDistanceMeters(
      lastKnownState.latitude,
      lastKnownState.longitude,
      lat,
      lng
    );

    if (timeDeltaMs > 0 && timeDeltaMs < 5000 && distanceMeters > maxDistanceJumpMeters) {
      return { isValid: false, reason: 'IMPOSSIBLE_DISTANCE_JUMP', distanceMeters };
    }
  }

  return {
    isValid: true,
    normalized: {
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      altitude: payload.altitude !== undefined && payload.altitude !== null ? Number(payload.altitude) : null,
      heading: heading,
      speed: speed,
      timestamp: new Date(timestamp).toISOString(),
    },
  };
}

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
