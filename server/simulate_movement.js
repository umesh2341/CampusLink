import pool from './db/pool.js';
import { updateLocation, getMyLocation } from './controllers/locationController.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; return this; },
  };
  return res;
}

// Campus waypoints along ITER main avenue from North to South
const WAYPOINTS = [
  { name: 'North Entrance (Near LH5)', lat: 20.254800, lng: 85.797200 },
  { name: 'Passing Boys Hostel 2', lat: 20.254100, lng: 85.797500 },
  { name: 'Arriving at Electronics Office', lat: 20.253200, lng: 85.797900 },
  { name: 'Entering Academic Block / C-Block Corridor', lat: 20.252400, lng: 85.798400 },
  { name: 'Central Garden & Food Court Area', lat: 20.251500, lng: 85.799100 },
  { name: 'South Sports Complex / Cricket Grounds', lat: 20.249800, lng: 85.801000 },
];

async function simulateMovement() {
  console.log('🚶 Starting Simulated Campus Walk for Student...\n');

  const testUser = {
    id: '11111111-2222-3333-4444-555555555555',
    name: 'John Doe',
    email: 'student@iter.soa.ac.in',
    role: 'student',
  };

  for (let i = 0; i < WAYPOINTS.length; i++) {
    const wp = WAYPOINTS[i];
    console.log(`📍 Waypoint ${i + 1}/${WAYPOINTS.length}: ${wp.name}`);
    console.log(`   Coordinates: (${wp.lat.toFixed(6)}, ${wp.lng.toFixed(6)})`);

    const req = {
      user: testUser,
      body: {
        latitude: wp.lat,
        longitude: wp.lng,
        accuracy: 4.5,
        speed: 1.3, // ~4.7 km/h walking speed
        heading: 160.0,
      },
    };

    const res = createMockRes();
    await updateLocation(req, res);

    if (res.statusCode === 200) {
      console.log(`   ↳ ✅ Stored latest location in database. Updated at: ${res.data.data.updated_at}`);
    } else {
      console.error(`   ↳ ❌ Update failed:`, res.data);
    }

    // Verify DB state
    const meRes = createMockRes();
    await getMyLocation({ user: testUser }, meRes);
    console.log(`   ↳ Active State: ${meRes.data.data.status} | Lat: ${meRes.data.data.latitude} | Lng: ${meRes.data.data.longitude}\n`);
  }

  console.log('🎉 Movement simulation completed successfully.');
  await pool.end();
  process.exit(0);
}

simulateMovement();
