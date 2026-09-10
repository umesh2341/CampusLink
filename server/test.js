import pool from './db/pool.js';

async function test() {
  try {
    await pool.query(`
      INSERT INTO subscription_preferences (subscription_id)
      VALUES ('7a5d3516-bc7a-47c8-95bd-92d15d68590a')
      ON CONFLICT (subscription_id) WHERE subscription_id IS NOT NULL DO NOTHING;
    `);
    console.log('Success');
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
test();
