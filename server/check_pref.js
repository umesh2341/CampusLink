import pool from './db/pool.js';

async function check() {
  try {
    const userId = 'f37d106b-dba1-40b9-b109-b4350fad027d';
    const query = `
      SELECT id, user_id, subscription_id, enabled_tags, enabled_notice_years, muted_club_ids, updated_at
      FROM subscription_preferences
      WHERE user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    if (rows.length > 0) {
      console.log('✅ Preferences found:');
      console.log(JSON.stringify(rows[0], null, 2));
    } else {
      console.log('❌ No preferences row found for this user_id');
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    process.exit(0);
  }
}

check();
