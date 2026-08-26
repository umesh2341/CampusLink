import assert from 'assert';
import {
  createVehicleInterpolator,
  normalizeAngle,
  interpolateAngle,
  calculateHeadingAngle,
} from '../lib/interpolator.js';

export function runInterpolatorTests() {
  console.log('Testing Vehicle Interpolator & Math...');

  assert.strictEqual(normalizeAngle(0), 0);
  assert.strictEqual(normalizeAngle(360), 0);
  assert.strictEqual(normalizeAngle(370), 10);
  assert.strictEqual(normalizeAngle(-10), 350);

  const angle1 = interpolateAngle(350, 10, 0.5);
  assert.strictEqual(angle1, 0, 'Interpolating across 0 degrees should go forward, not backward across 340 deg');

  const angle2 = interpolateAngle(10, 350, 0.5);
  assert.strictEqual(angle2, 0, 'Interpolating from 10 to 350 should cross 0');

  const headingNorth = calculateHeadingAngle(100, 100, 100, 50);
  assert(Math.abs(headingNorth - 0) < 0.1 || Math.abs(headingNorth - 360) < 0.1, 'Moving up (negative Y) is North (0 deg)');

  const headingEast = calculateHeadingAngle(100, 100, 150, 100);
  assert(Math.abs(headingEast - 90) < 0.1, 'Moving right (positive X) is East (90 deg)');

  const interpolator = createVehicleInterpolator({ x: 100, y: 100, heading: 0 });
  interpolator.setTarget({ x: 200, y: 200, heading: 90, speed: 5, accuracyRadius: 30, updatedAt: Date.now() });

  const step1 = interpolator.update();
  assert(step1.x > 100 && step1.x <= 200, 'X should move towards target');
  assert(step1.y > 100 && step1.y <= 200, 'Y should move towards target');
  assert.strictEqual(step1.status, 'LIVE');

  interpolator.setTarget({ x: 200, y: 200, updatedAt: Date.now() - 40000 });
  const stepStale = interpolator.update();
  assert.strictEqual(stepStale.status, 'DELAYED', 'Should be DELAYED after 40s');

  interpolator.setTarget({ x: 200, y: 200, updatedAt: Date.now() - 150000 });
  const stepOffline = interpolator.update();
  assert.strictEqual(stepOffline.status, 'OFFLINE', 'Should be OFFLINE after 150s');

  console.log('  PASS: Vehicle Interpolator (12 assertions)');
}
