export function createVehicleInterpolator(initialState = null, options = {}) {
  const {
    smoothingFactor = 0.15,
    headingSmoothingFactor = 0.2,
    jitterThresholdPixels = 2.5,
    staleThresholdMs = 30000,
    offlineThresholdMs = 120000,
    weakGpsThresholdAccuracy = 60,
  } = options;

  let current = initialState ? {
    x: initialState.x ?? 0,
    y: initialState.y ?? 0,
    heading: initialState.heading ?? 0,
    accuracyRadius: initialState.accuracyRadius ?? 20,
    speed: initialState.speed ?? 0,
    updatedAt: initialState.updatedAt ?? Date.now(),
  } : null;

  let target = current ? { ...current } : null;

  function setTarget(newTarget) {
    if (!newTarget || typeof newTarget.x !== 'number' || typeof newTarget.y !== 'number') {
      return;
    }

    const targetHeading = typeof newTarget.heading === 'number' && Number.isFinite(newTarget.heading)
      ? normalizeAngle(newTarget.heading)
      : (current ? calculateHeadingAngle(current.x, current.y, newTarget.x, newTarget.y, current.heading) : 0);

    const now = Date.now();
    const updateTime = newTarget.updatedAt
      ? new Date(newTarget.updatedAt).getTime()
      : now;

    target = {
      x: newTarget.x,
      y: newTarget.y,
      heading: targetHeading,
      accuracyRadius: newTarget.accuracyRadius ?? 20,
      speed: newTarget.speed ?? 0,
      updatedAt: updateTime,
      accuracy: newTarget.accuracy ?? null,
    };

    if (!current) {
      current = { ...target };
    }
  }

  function update() {
    if (!current || !target) {
      return null;
    }

    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > jitterThresholdPixels * jitterThresholdPixels) {
      current.x += dx * smoothingFactor;
      current.y += dy * smoothingFactor;
    } else {
      current.x = target.x;
      current.y = target.y;
    }

    current.heading = interpolateAngle(current.heading, target.heading, headingSmoothingFactor);
    current.accuracyRadius += (target.accuracyRadius - current.accuracyRadius) * smoothingFactor;
    current.speed = target.speed;

    const elapsed = Date.now() - target.updatedAt;
    let status = 'LIVE';

    if (elapsed > offlineThresholdMs) {
      status = 'OFFLINE';
    } else if (elapsed > staleThresholdMs) {
      status = 'DELAYED';
    } else if (target.accuracy && target.accuracy > weakGpsThresholdAccuracy) {
      status = 'WEAK_GPS';
    }

    return {
      x: current.x,
      y: current.y,
      heading: current.heading,
      accuracyRadius: current.accuracyRadius,
      speed: current.speed,
      status: status,
      elapsedMs: elapsed,
      targetX: target.x,
      targetY: target.y,
      targetHeading: target.heading,
    };
  }

  function getCurrentState() {
    return current ? { ...current } : null;
  }

  function reset() {
    current = null;
    target = null;
  }

  return {
    setTarget,
    update,
    getCurrentState,
    reset,
  };
}

export function normalizeAngle(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

export function interpolateAngle(currentAngle, targetAngle, factor) {
  const c = normalizeAngle(currentAngle);
  const t = normalizeAngle(targetAngle);

  let delta = t - c;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  return normalizeAngle(c + delta * factor);
}

export function calculateHeadingAngle(x1, y1, x2, y2, fallback = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return fallback;
  }
  const rad = Math.atan2(dx, -dy);
  const deg = (rad * 180) / Math.PI;
  return normalizeAngle(deg);
}
