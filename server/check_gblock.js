import pool from './db/pool.js';

async function checkState() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT name, svg_element_id, short_name FROM buildings ORDER BY name`
    );
    console.log('=== CURRENT DATABASE STATE ===');
    rows.forEach(r => console.log(`  ${r.svg_element_id.padEnd(20)} -> ${r.name} (short: ${r.short_name})`));
  } catch (e) {
    console.error(e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkState();
