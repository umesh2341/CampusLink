import pool from './db/pool.js';

async function testPreferencesFlow() {
  try {
    console.log('Testing Push Preferences Update Flow...');

    // 1. Create a test subscription
    const testEndpoint = 'https://push.example.com/send/pref-test-token-777';
    const subRes = await pool.query(`
      INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key)
      VALUES ($1, 'dummy_p256dh_777', 'dummy_auth_777')
      ON CONFLICT (endpoint) DO UPDATE SET p256dh_key = EXCLUDED.p256dh_key
      RETURNING *;
    `, [testEndpoint]);

    const subId = subRes.rows[0].id;

    // 2. Ensure subscription_preferences row
    await pool.query(`
      INSERT INTO subscription_preferences (subscription_id)
      VALUES ($1)
      ON CONFLICT (subscription_id) DO NOTHING;
    `, [subId]);

    // 3. Fetch a club ID to mute (e.g. Coding Club)
    const clubRes = await pool.query("SELECT id FROM clubs WHERE name = 'Coding Club'");
    const codingClubId = clubRes.rows[0].id;

    // 4. Update preferences via SQL (simulating PATCH /api/push/preferences)
    // Mute Coding Club and keep only ['hackathon', 'workshop']
    const updatedRes = await pool.query(`
      UPDATE subscription_preferences sp
      SET muted_club_ids = $1, enabled_tags = $2, updated_at = NOW()
      FROM push_subscriptions ps
      WHERE sp.subscription_id = ps.id AND ps.endpoint = $3
      RETURNING sp.*;
    `, [[codingClubId], ['hackathon', 'workshop'], testEndpoint]);

    console.log('✅ Updated subscription_preferences row in DB:');
    console.log('  Subscription ID:', updatedRes.rows[0].subscription_id);
    console.log('  Muted Club IDs:', updatedRes.rows[0].muted_club_ids);
    console.log('  Enabled Tags:', updatedRes.rows[0].enabled_tags);
    console.log('  Updated At:', updatedRes.rows[0].updated_at);

    process.exit(0);
  } catch (err) {
    console.error('❌ Preferences test failed:', err);
    process.exit(1);
  }
}

testPreferencesFlow();
