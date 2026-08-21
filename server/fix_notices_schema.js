import pool from './db/pool.js';
import 'dotenv/config';

async function fixNoticesSchema() {
  try {
    console.log('Altering notices table to set default for published_at...');
    await pool.query(`ALTER TABLE notices ALTER COLUMN published_at SET DEFAULT NOW();`);
    
    console.log('Backfilling existing null published_at values...');
    await pool.query(`UPDATE notices SET published_at = NOW() WHERE published_at IS NULL;`);
    
    console.log('Verifying default exists...');
    const res = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'published_at'");
    console.log('Column default result:', res.rows[0]);
    
    console.log('Verifying rows are backfilled...');
    const rowsRes = await pool.query("SELECT id, title, published_at FROM notices");
    console.log('Current rows:', rowsRes.rows);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
fixNoticesSchema();
