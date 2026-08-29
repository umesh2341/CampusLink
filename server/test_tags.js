import pool from './db/pool.js';

async function test() {
  try {
    const bRes = await pool.query('SELECT id FROM buildings LIMIT 1');
    const buildingId = bRes.rows[0].id;
    const insRes = await pool.query(`
      INSERT INTO events (title, description, start_time, end_time, building_id, organizing_club, tags)
      VALUES 
      ('Hackathon 2024', 'Annual hackathon', NOW(), NOW() + interval '24 hours', 'e7f1628a-ad31-4003-ae02-cb769659878f', 'Coding Club', ARRAY['hackathon', 'tech_event']),
      ('Cultural Fest', 'Dance and music', NOW(), NOW() + interval '5 hours', '52d42f5c-ef16-4925-b623-9987c08cb211', 'Dance Club', ARRAY['cultural_event']),
      ('Web Dev Workshop', 'Learn React', NOW(), NOW() + interval '3 hours', 'e7f1628a-ad31-4003-ae02-cb769659878f', 'Web Club', ARRAY['workshop', 'tech_event'])
      RETURNING id, title, tags;
    `);

    console.log('✅ Created events:', insRes.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

test();
