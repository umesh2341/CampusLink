import pool from './db/pool.js';
import 'dotenv/config';

async function check() {
  const { rows } = await pool.query('SELECT * FROM notices');
  console.log(rows);
  process.exit(0);
}
check();
