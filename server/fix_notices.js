import pool from './db/pool.js';
import 'dotenv/config';

async function update() {
  await pool.query('UPDATE notices SET published_at = NOW()');
  console.log('Updated published_at');
  process.exit(0);
}
update();
