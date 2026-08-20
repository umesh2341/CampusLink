import pool from './db/pool.js';

async function fixDb() {
  try {
    console.log('Fixing local db schema...');
    await pool.query(`ALTER TABLE buildings ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'academic';`);
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';`);
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`);
    await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
    console.log('DB fixed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDb();
