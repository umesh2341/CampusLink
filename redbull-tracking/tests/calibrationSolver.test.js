import assert from 'assert';
import { solveAffineCalibration } from '../calibration/calibrationSolver.js';

export function runCalibrationSolverTests() {
  console.log('Testing Least-Squares Calibration Solver...');

  const syntheticAnchors = [
    { name: 'P1', lat: 20.2500, lng: 85.8000, x: 500, y: 100 },
    { name: 'P2', lat: 20.2500, lng: 85.8020, x: 1000, y: 100 },
    { name: 'P3', lat: 20.2460, lng: 85.8000, x: 500, y: 2000 },
    { name: 'P4', lat: 20.2460, lng: 85.8020, x: 1000, y: 2000 },
    { name: 'P5', lat: 20.2480, lng: 85.8010, x: 750, y: 1050 },
  ];

  const res1 = solveAffineCalibration(syntheticAnchors);
  assert.strictEqual(res1.success, true, 'Synthetic anchors should solve successfully');
  assert.strictEqual(res1.pointCount, 5);
  assert(res1.metrics.rmse < 1.0, 'Synthetic grid should have near-zero RMSE');
  assert.strictEqual(res1.metrics.quality, 'EXCELLENT');
  assert.strictEqual(res1.metrics.isAcceptableForEvent, true);

  const tooFewAnchors = [
    { name: 'P1', lat: 20.2500, lng: 85.8000, x: 500, y: 100 },
    { name: 'P2', lat: 20.2500, lng: 85.8020, x: 1000, y: 100 },
  ];
  const res2 = solveAffineCalibration(tooFewAnchors);
  assert.strictEqual(res2.success, false, 'Fewer than 3 anchors must fail');

  console.log('  PASS: Least-Squares Calibration Solver (6 assertions)');
}
