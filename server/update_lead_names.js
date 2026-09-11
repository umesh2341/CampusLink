import pool from './db/pool.js';

async function updateLeadNames() {
  try {
    console.log('Updating all club lead_names to "Updating Soon"...');

    const res = await pool.query(
      `UPDATE clubs SET lead_name = 'Updating Soon' RETURNING name, lead_name`
    );

    console.log(`\n✅ Updated ${res.rowCount} clubs:\n`);
    res.rows.forEach(r => console.log(`  - ${r.name} → "${r.lead_name}"`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

updateLeadNames();
