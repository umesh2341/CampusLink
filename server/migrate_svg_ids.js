import pool from './db/pool.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Running D Block and Library swap...');
    await client.query("UPDATE buildings SET svg_element_id = 'temp_lib' WHERE svg_element_id = 'library'");
    await client.query("UPDATE buildings SET svg_element_id = 'library' WHERE svg_element_id = 'd-block'");
    await client.query("UPDATE buildings SET svg_element_id = 'd-block' WHERE svg_element_id = 'temp_lib'");

    console.log('Running Ladies Hostels rotation...');
    await client.query("UPDATE buildings SET svg_element_id = 'temp_lh1' WHERE svg_element_id = 'lh1'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_lh2' WHERE svg_element_id = 'lh2'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_lh3' WHERE svg_element_id = 'lh3'");
    await client.query("UPDATE buildings SET svg_element_id = 'temp_lh4' WHERE svg_element_id = 'lh4'");

    await client.query("UPDATE buildings SET svg_element_id = 'lh3' WHERE svg_element_id = 'temp_lh1'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh4' WHERE svg_element_id = 'temp_lh2'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh2' WHERE svg_element_id = 'temp_lh3'");
    await client.query("UPDATE buildings SET svg_element_id = 'lh1' WHERE svg_element_id = 'temp_lh4'");

    console.log('Checking if G Block already exists...');
    const gCheck = await client.query("SELECT id FROM buildings WHERE slug = 'g-block'");
    if (gCheck.rows.length === 0) {
      console.log('Inserting G Block...');
      await client.query(`
        INSERT INTO buildings (name, short_name, slug, svg_element_id, type, category, hide_label) 
        VALUES ('G Block', 'G BLOCK', 'g-block', 'G-block', 'academic', 'academic', false)
      `);
    } else {
      console.log('G Block already exists. Updating svg_element_id...');
      await client.query("UPDATE buildings SET svg_element_id = 'G-block' WHERE slug = 'g-block'");
    }

    await client.query('COMMIT');
    console.log('Migration committed successfully.\n');

    console.log('--- FINAL MAPPING ---');
    const { rows } = await client.query(`
      SELECT name, svg_element_id 
      FROM buildings 
      WHERE svg_element_id IN ('d-block', 'library', 'lh1', 'lh2', 'lh3', 'lh4', 'G-block')
      ORDER BY name
    `);
    console.table(rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back.', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
