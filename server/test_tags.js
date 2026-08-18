import pool from './db/pool.js';

async function test() {
  try {
    const bRes = await pool.query('SELECT id FROM buildings LIMIT 1');
    const buildingId = bRes.rows[0].id;
    const insRes = await pool.query(`
      INSERT INTO events (title, description, start_time, end_time, building_id, organizing_club, tags, is_approved)
      VALUES ('Tag Test Event', 'Testing multi-select tags', NOW(), NOW() + INTERVAL '2 hours', $1, 'Coding Club', ARRAY['hackathon','workshop'], TRUE)
      RETURNING *;
    `, [buildingId]);

    console.log('✅ Created event with tags:', insRes.rows[0].id, insRes.rows[0].tags);
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

test();
