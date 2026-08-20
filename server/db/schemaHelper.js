import pool from './pool.js';

let columnsCache = null;

export async function detectSchema() {
  if (columnsCache) return columnsCache;

  const schema = {
    buildings: {
      category: 'category',
    },
    events: {
      organizing_club: 'organizing_club',
      registration_url: 'registration_url',
      is_approved: 'is_approved',
      has_status: false,
    }
  };

  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('buildings', 'events');
    `);

    const cols = res.rows;
    
    // Check buildings columns
    const buildingCols = cols.filter(c => c.table_name === 'buildings').map(c => c.column_name);
    if (buildingCols.includes('type') && !buildingCols.includes('category')) {
      schema.buildings.category = 'type';
    }

    // Check events columns
    const eventCols = cols.filter(c => c.table_name === 'events').map(c => c.column_name);
    if (eventCols.includes('organizer_name') && !eventCols.includes('organizing_club')) {
      schema.events.organizing_club = 'organizer_name';
    }
    if (eventCols.includes('external_form_url') && !eventCols.includes('registration_url')) {
      schema.events.registration_url = 'external_form_url';
    }
    if (eventCols.includes('status')) {
      schema.events.has_status = true;
    }

    columnsCache = schema;
    console.log('✅ Auto-detected database schema mapping:', schema);
    return schema;
  } catch (err) {
    console.warn('⚠️ Failed to auto-detect schema, using defaults:', err.message);
    return schema;
  }
}
