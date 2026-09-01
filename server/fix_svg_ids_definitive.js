/**
 * DEFINITIVE SVG ID SYNC SCRIPT
 * Uses temp IDs to avoid unique constraint violations during swap operations.
 */

import pool from './db/pool.js';

async function fixSvgIds() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1: First reset Ladies Hostel IDs to temp values to avoid constraint conflicts
    console.log('Step 1: Resetting LH IDs to temp values...');
    await client.query("UPDATE buildings SET svg_element_id = 'temp_fix_lh1' WHERE name = 'Ladies Hostel 1'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_fix_lh2' WHERE name = 'Ladies Hostel 2'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_fix_lh3' WHERE name = 'Ladies Hostel 3'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_fix_lh4' WHERE name = 'Ladies Hostel 4'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_fix_lh5' WHERE name = 'Ladies Hostel 5'");
    
    // Step 2: Set correct values (lhN = Ladies Hostel N, direct match)
    console.log('Step 2: Setting correct LH IDs...');
    await client.query("UPDATE buildings SET svg_element_id = 'lh1' WHERE name = 'Ladies Hostel 1'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh2' WHERE name = 'Ladies Hostel 2'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh3' WHERE name = 'Ladies Hostel 3'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh4' WHERE name = 'Ladies Hostel 4'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh5' WHERE name = 'Ladies Hostel 5'");
    console.log('  ✓ Ladies Hostels: lh1=LH1, lh2=LH2, lh3=LH3, lh4=LH4, lh5=LH5');

    // Step 3: Ensure G Block has correct ID  
    console.log('Step 3: Fixing G Block...');
    const gCheck = await client.query("SELECT id FROM buildings WHERE name = 'G Block'");
    if (gCheck.rows.length > 0) {
      await client.query("UPDATE buildings SET svg_element_id = 'G-block' WHERE name = 'G Block'");
      console.log('  ✓ G Block -> G-block');
    } else {
      // Insert G Block if missing
      await client.query(`
        INSERT INTO buildings (name, short_name, slug, svg_element_id, type, category, hide_label)
        VALUES ('G Block', 'G BLOCK', 'g-block', 'G-block', 'academic', 'academic', false)
      `);
      console.log('  ✓ G Block inserted with svg_element_id=G-block');
    }

    // Step 4: Verify all other critical buildings have correct IDs
    console.log('Step 4: Verifying critical building IDs...');
    const checks = [
      { name: 'Library',  expected: 'library' },
      { name: 'D Block',  expected: 'd-block' },
      { name: 'G Block',  expected: 'G-block' },
    ];
    for (const { name, expected } of checks) {
      const r = await client.query('SELECT svg_element_id FROM buildings WHERE name = $1', [name]);
      if (r.rows.length === 0) {
        console.warn(`  ⚠ NOT FOUND: "${name}"`);
      } else if (r.rows[0].svg_element_id !== expected) {
        console.warn(`  ⚠ MISMATCH: "${name}" has ${r.rows[0].svg_element_id}, expected ${expected}`);
        await client.query('UPDATE buildings SET svg_element_id = $1 WHERE name = $2', [expected, name]);
        console.log(`  ✓ Fixed: "${name}" -> ${expected}`);
      } else {
        console.log(`  ✓ OK: "${name}" -> ${r.rows[0].svg_element_id}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ All svg_element_id values committed successfully.\n');

    // Print final state
    const { rows } = await client.query(
      'SELECT name, svg_element_id FROM buildings ORDER BY name'
    );
    console.log('=== FINAL DATABASE STATE ===');
    rows.forEach(r => console.log(`  ${(r.svg_element_id || 'NULL').padEnd(25)} -> ${r.name}`));

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ ROLLBACK due to error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixSvgIds();
