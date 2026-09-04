import 'dotenv/config';
import pool from './db/pool.js';

try {
  await pool.query(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE NOT NULL;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  `);
  console.log('Event creator and visibility columns are ready.');
} catch (error) {
  console.error('Event visibility migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
