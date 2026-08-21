import pool from './db/pool.js';
import 'dotenv/config';

async function checkSchema() {
  try {
    const res = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'notices'");
    console.log(res.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkSchema();
