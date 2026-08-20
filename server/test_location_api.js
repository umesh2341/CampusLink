import pool from './db/pool.js';
import { updateLocation, getMyLocation, stopSharingLocation, getActiveLocations } from './controllers/locationController.js';

// Mock response builder for testing Express controllers directly
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting Location API & Controller Tests...\n');
  let passed = 0;
  let failed = 0;

  const testUser = {
    id: '11111111-2222-3333-4444-555555555555',
    name: 'John Doe',
    email: 'student@iter.soa.ac.in',
    role: 'student',
  };

  // Test 1: Reject invalid latitude (> 90)
  try {
    const req = {
      user: testUser,
      body: { latitude: 95.5, longitude: 85.798 },
    };
    const res = createMockRes();
    await updateLocation(req, res);

    if (res.statusCode === 400 && res.data.success === false) {
      console.log('✅ Test 1: Reject out-of-bounds latitude (+95.5) passed (400 Bad Request).');
      passed++;
    } else {
      console.error('❌ Test 1 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 1 exception:', err);
    failed++;
  }

  // Test 2: Reject invalid longitude (< -180)
  try {
    const req = {
      user: testUser,
      body: { latitude: 20.252, longitude: -195.0 },
    };
    const res = createMockRes();
    await updateLocation(req, res);

    if (res.statusCode === 400 && res.data.success === false) {
      console.log('✅ Test 2: Reject out-of-bounds longitude (-195.0) passed (400 Bad Request).');
      passed++;
    } else {
      console.error('❌ Test 2 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 2 exception:', err);
    failed++;
  }

  // Test 3: Reject negative accuracy
  try {
    const req = {
      user: testUser,
      body: { latitude: 20.252, longitude: 85.798, accuracy: -5.0 },
    };
    const res = createMockRes();
    await updateLocation(req, res);

    if (res.statusCode === 400 && res.data.success === false) {
      console.log('✅ Test 3: Reject negative accuracy (-5m) passed (400 Bad Request).');
      passed++;
    } else {
      console.error('❌ Test 3 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 3 exception:', err);
    failed++;
  }

  // Test 4: Valid coordinate update (Location A - Electronic Office)
  try {
    const req = {
      user: testUser,
      body: {
        latitude: 20.252450,
        longitude: 85.798200,
        accuracy: 8.5,
        heading: 90.0,
        speed: 1.2,
      },
    };
    const res = createMockRes();
    await updateLocation(req, res);

    if (res.statusCode === 200 && res.data.success === true && res.data.data.latitude === 20.25245) {
      console.log('✅ Test 4: Valid coordinate update passed (200 OK, record stored).');
      passed++;
    } else {
      console.error('❌ Test 4 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 4 exception:', err);
    failed++;
  }

  // Test 5: Retrieve current user location (GET /api/location/me)
  try {
    const req = { user: testUser };
    const res = createMockRes();
    await getMyLocation(req, res);

    if (res.statusCode === 200 && res.data.data && res.data.data.status === 'LIVE') {
      console.log(`✅ Test 5: getMyLocation retrieved stored location (status: ${res.data.data.status}).`);
      passed++;
    } else {
      console.error('❌ Test 5 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 5 exception:', err);
    failed++;
  }

  // Test 6: Retrieve active locations (GET /api/location/active)
  try {
    const req = { user: testUser };
    const res = createMockRes();
    await getActiveLocations(req, res);

    if (res.statusCode === 200 && Array.isArray(res.data.data) && res.data.data.length > 0) {
      console.log(`✅ Test 6: getActiveLocations found ${res.data.data.length} active campus user(s).`);
      passed++;
    } else {
      console.error('❌ Test 6 failed:', res.statusCode, res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 6 exception:', err);
    failed++;
  }

  // Test 7: Stop location sharing (DELETE /api/location/me)
  try {
    const req = { user: testUser };
    const res = createMockRes();
    await stopSharingLocation(req, res);

    // Verify status is now OFFLINE in DB
    const verifyRes = createMockRes();
    await getMyLocation(req, verifyRes);

    if (res.statusCode === 200 && verifyRes.data.data.status === 'OFFLINE') {
      console.log('✅ Test 7: stopSharingLocation successfully toggled status to OFFLINE.');
      passed++;
    } else {
      console.error('❌ Test 7 failed:', res.statusCode, verifyRes.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 7 exception:', err);
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log(`================================\n`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
