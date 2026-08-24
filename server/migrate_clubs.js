import 'dotenv/config';
import pool from './db/pool.js';

async function migrateClubs() {
  try {
    await pool.query(`
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS discord TEXT;
      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS lead_name VARCHAR(255);
    `);

    console.log('Club profile columns are ready.');
  } catch (error) {
    console.error('Club migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrateClubs();