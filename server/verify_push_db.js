import pool from './db/pool.js';

async function verifyDb() {
  try {
    const subRes = await pool.query('SELECT * FROM push_subscriptions ORDER BY created_at DESC LIMIT 1');
    console.log('📦 push_subscriptions row:', subRes.rows[0]);

    if (subRes.rows.length > 0) {
      const prefRes = await pool.query('SELECT * FROM subscription_preferences WHERE subscription_id = $1', [subRes.rows[0].id]);
      console.log('⚙️ subscription_preferences row:', prefRes.rows[0]);
    }

    process.exit(0);
  } catch (err) {
    console.error('Db verify error:', err);
    process.exit(1);
  }
}

verifyDb();
