import pool from './server/db/pool.js';
import 'dotenv/config';

async function fixDb() {
  try {
    console.log('Adding club_id to events table...');
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;`);
    console.log('DB fixed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixDb();
