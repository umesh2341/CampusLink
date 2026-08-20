import pool from './pool.js';

async function migrateLocation() {
  try {
    console.log('Running DB migration for user profiles and live locations...');

    // 1. Create profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email       VARCHAR(255) UNIQUE,
        name        VARCHAR(255) NOT NULL,
        role        VARCHAR(50) DEFAULT 'student' NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Profiles table ensured.');

    // Seed a default student profile for development / testing if table is empty
    await pool.query(`
      INSERT INTO profiles (id, email, name, role)
      VALUES (
        '11111111-2222-3333-4444-555555555555',
        'student@iter.soa.ac.in',
        'John Doe',
        'student'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Default profile ensured.');

    // 2. Create user_locations table (single latest record per user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_locations (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
        latitude    NUMERIC(10, 7) NOT NULL,
        longitude   NUMERIC(10, 7) NOT NULL,
        accuracy    NUMERIC(8, 2),
        altitude    NUMERIC(8, 2),
        heading     NUMERIC(6, 2),
        speed       NUMERIC(6, 2),
        is_active   BOOLEAN DEFAULT TRUE NOT NULL,
        updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON user_locations(updated_at);
      CREATE INDEX IF NOT EXISTS idx_user_locations_active ON user_locations(is_active) WHERE is_active = TRUE;
    `);
    console.log('✅ User locations table and indexes ensured.');

    console.log('🎉 Location migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Location migration failed:', error);
    process.exit(1);
  }
}

migrateLocation();
