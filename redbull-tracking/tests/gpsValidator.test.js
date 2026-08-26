import assert from 'assert';
import { validateGpsPayload, haversineDistanceMeters } from '../lib/gpsValidator.js';

export function runGpsValidatorTests() {
  console.log('Testing GPS Validator...');

  const validPayload = {
    latitude: 20.2485,
    longitude: 85.8010,
    accuracy: 12.5,
    speed: 4.2,
    heading: 180,
    timestamp: new Date().toISOString(),
  };

  const res1 = validateGpsPayload(validPayload);
  assert.strictEqual(res1.isValid, true, 'Valid payload should pass validation');
  assert.strictEqual(res1.normalized.latitude, 20.2485);
  assert.strictEqual(res1.normalized.longitude, 85.8010);

  const invalidLatPayload = {
    latitude: 105.0,
    longitude: 85.8010,
  };
  const res2 = validateGpsPayload(invalidLatPayload);
  assert.strictEqual(res2.isValid, false, 'Invalid latitude should fail');
  assert.strictEqual(res2.reason, 'INVALID_LATITUDE');

  const poorAccuracyPayload = {
    latitude: 20.2485,
    longitude: 85.8010,
    accuracy: 150.0,
  };
  const res3 = validateGpsPayload(poorAccuracyPayload, null, { maxAccuracyMeters: 80 });
  assert.strictEqual(res3.isValid, false, 'Poor accuracy should fail');
  assert.strictEqual(res3.reason, 'ACCURACY_TOO_POOR');

  const excessiveSpeedPayload = {
    latitude: 20.2485,
    longitude: 85.8010,
    speed: 85.0,
  };
  const res4 = validateGpsPayload(excessiveSpeedPayload, null, { maxSpeedMps: 35 });
  assert.strictEqual(res4.isValid, false, 'Excessive speed should fail');
  assert.strictEqual(res4.reason, 'EXCESSIVE_SPEED');

  const lastState = {
    latitude: 20.2485,
    longitude: 85.8010,
    timestamp: new Date(Date.now() - 1000).toISOString(),
  };
  const jumpedPayload = {
    latitude: 20.2800,
    longitude: 85.8500,
    timestamp: new Date().toISOString(),
  };
  const res5 = validateGpsPayload(jumpedPayload, lastState, { maxDistanceJumpMeters: 250 });
  assert.strictEqual(res5.isValid, false, 'Impossible jump should be caught');
  assert.strictEqual(res5.reason, 'IMPOSSIBLE_DISTANCE_JUMP');

  const dist = haversineDistanceMeters(20.2485, 85.8010, 20.2495, 85.8010);
  assert(dist > 100 && dist < 120, 'Haversine distance should calculate ~111 meters for 0.001 deg lat difference');

  console.log('  PASS: GPS Validator (6 assertions)');
}
