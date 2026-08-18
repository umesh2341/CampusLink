import pool from './db/pool.js';

async function migrate() {
  try {
    console.log('Running DB schema migration for event tags and subscriptions...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL UNIQUE,
        logo_url    TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;

      ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint      TEXT NOT NULL UNIQUE,
        p256dh_key    TEXT NOT NULL,
        auth_key      TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS subscription_preferences (
        subscription_id  UUID PRIMARY KEY REFERENCES push_subscriptions(id) ON DELETE CASCADE,
        muted_club_ids   UUID[] DEFAULT '{}',
        enabled_tags     TEXT[] DEFAULT ARRAY['hackathon','tech_event','workshop','cultural_event','college_official'],
        updated_at       TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
