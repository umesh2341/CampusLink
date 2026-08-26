export function solveAffineCalibration(referencePoints) {
  if (!Array.isArray(referencePoints) || referencePoints.length < 3) {
    return {
      success: false,
      error: 'At least 3 valid reference points are required for 2D affine calibration.',
      pointCount: Array.isArray(referencePoints) ? referencePoints.length : 0,
    };
  }

  const validPoints = referencePoints.filter((p) => {
    return (
      p &&
      typeof p.lat === 'number' && Number.isFinite(p.lat) &&
      typeof p.lng === 'number' && Number.isFinite(p.lng) &&
      typeof p.x === 'number' && Number.isFinite(p.x) &&
      typeof p.y === 'number' && Number.isFinite(p.y)
    );
  });

  if (validPoints.length < 3) {
    return {
      success: false,
      error: 'Fewer than 3 valid numerical reference points provided.',
      validPointCount: validPoints.length,
    };
  }

  const n = validPoints.length;

  let meanLng = 0;
  let meanLat = 0;
  for (const pt of validPoints) {
    meanLng += pt.lng;
    meanLat += pt.lat;
  }
  meanLng /= n;
  meanLat /= n;

  let sumLng2 = 0;
  let sumLat2 = 0;
  let sumLngLat = 0;
  let sumLng = 0;
  let sumLat = 0;

  let sumXLng = 0;
  let sumXLat = 0;
  let sumX = 0;

  let sumYLng = 0;
  let sumYLat = 0;
  let sumY = 0;

  for (const pt of validPoints) {
    const dLng = pt.lng - meanLng;
    const dLat = pt.lat - meanLat;
    const x = pt.x;
    const y = pt.y;

    sumLng2 += dLng * dLng;
    sumLat2 += dLat * dLat;
    sumLngLat += dLng * dLat;
    sumLng += dLng;
    sumLat += dLat;

    sumXLng += x * dLng;
    sumXLat += x * dLat;
    sumX += x;

    sumYLng += y * dLng;
    sumYLat += y * dLat;
    sumY += y;
  }

  const M = [
    [sumLng2, sumLngLat, sumLng],
    [sumLngLat, sumLat2, sumLat],
    [sumLng, sumLat, n],
  ];

  const Vx = [sumXLng, sumXLat, sumX];
  const Vy = [sumYLng, sumYLat, sumY];

  const solX = solveLinear3x3(M, Vx);
  const solY = solveLinear3x3(M, Vy);

  if (!solX || !solY) {
    return {
      success: false,
      error: 'Singular matrix encountered. Reference points may be collinear.',
      validPointCount: n,
    };
  }

  const a = solX[0];
  const b = solX[1];
  const c = solX[2] - a * meanLng - b * meanLat;

  const d = solY[0];
  const e = solY[1];
  const f = solY[2] - d * meanLng - e * meanLat;

  let sumSqError = 0;
  let maxError = 0;
  const residuals = [];

  for (const pt of validPoints) {
    const predictedX = a * pt.lng + b * pt.lat + c;
    const predictedY = d * pt.lng + e * pt.lat + f;

    const diffX = predictedX - pt.x;
    const diffY = predictedY - pt.y;
    const distanceErrorPx = Math.sqrt(diffX * diffX + diffY * diffY);

    if (distanceErrorPx > maxError) {
      maxError = distanceErrorPx;
    }
    sumSqError += distanceErrorPx * distanceErrorPx;

    residuals.push({
      name: pt.name || `Point_${residuals.length + 1}`,
      lat: pt.lat,
      lng: pt.lng,
      actualX: pt.x,
      actualY: pt.y,
      predictedX: Math.round(predictedX * 10) / 10,
      predictedY: Math.round(predictedY * 10) / 10,
      errorX: Math.round(Math.abs(diffX) * 10) / 10,
      errorY: Math.round(Math.abs(diffY) * 10) / 10,
      totalErrorPx: Math.round(distanceErrorPx * 10) / 10,
    });
  }

  const rmse = Math.sqrt(sumSqError / n);
  const averageError = residuals.reduce((acc, r) => acc + r.totalErrorPx, 0) / n;

  let quality = 'POOR';
  if (rmse < 18) {
    quality = 'EXCELLENT';
  } else if (rmse < 35) {
    quality = 'GOOD';
  } else if (rmse < 60) {
    quality = 'MODERATE';
  }

  return {
    success: true,
    pointCount: n,
    coefficients: {
      a: Number(a.toFixed(6)),
      b: Number(b.toFixed(6)),
      c: Number(c.toFixed(4)),
      d: Number(d.toFixed(6)),
      e: Number(e.toFixed(6)),
      f: Number(f.toFixed(4)),
    },
    metrics: {
      rmse: Math.round(rmse * 100) / 100,
      averageErrorPx: Math.round(averageError * 100) / 100,
      maxErrorPx: Math.round(maxError * 100) / 100,
      quality: quality,
      isAcceptableForEvent: rmse < 45,
    },
    residuals: residuals,
    exportSnippet: JSON.stringify({
      a: Number(a.toFixed(6)),
      b: Number(b.toFixed(6)),
      c: Number(c.toFixed(4)),
      d: Number(d.toFixed(6)),
      e: Number(e.toFixed(6)),
      f: Number(f.toFixed(4)),
    }, null, 2),
  };
}

function solveLinear3x3(matrix, vector) {
  const [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22],
  ] = matrix;

  const det =
    m00 * (m11 * m22 - m12 * m21) -
    m01 * (m10 * m22 - m12 * m20) +
    m02 * (m10 * m21 - m11 * m20);

  if (Math.abs(det) < 1e-18) {
    return null;
  }

  const det0 =
    vector[0] * (m11 * m22 - m12 * m21) -
    m01 * (vector[1] * m22 - m12 * vector[2]) +
    m02 * (vector[1] * m21 - m11 * vector[2]);

  const det1 =
    m00 * (vector[1] * m22 - m12 * vector[2]) -
    vector[0] * (m10 * m22 - m12 * m20) +
    m02 * (m10 * vector[2] - vector[1] * m20);

  const det2 =
    m00 * (m11 * vector[2] - vector[1] * m21) -
    m01 * (m10 * vector[2] - vector[1] * m20) +
    vector[0] * (m10 * m21 - m11 * m20);

  return [det0 / det, det1 / det, det2 / det];
}
