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

// Calibrated campus waypoints along ITER main avenue from North Gate to South Gate
const WAYPOINTS = [
  { name: 'North Entrance (Near LH5 & Gate 1)', lat: 20.250620, lng: 85.801050 },
  { name: 'Passing Boys Hostel 1 & 2 Corridor', lat: 20.250000, lng: 85.800830 },
  { name: 'Arriving at Academic Block / Student Section', lat: 20.249470, lng: 85.800600 },
  { name: 'Entering C-Block & CDS Central Corridor', lat: 20.248800, lng: 85.801160 },
  { name: 'Passing Central Library & Sports Complex', lat: 20.248350, lng: 85.801270 },
  { name: 'Central Food Court & E-Block Gardens', lat: 20.247800, lng: 85.801800 },
  { name: 'South Hostels Area (LH3 / LH4)', lat: 20.246450, lng: 85.801350 },
  { name: 'South Campus Grounds (BH9 / Football Ground 2)', lat: 20.245450, lng: 85.802400 },
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
