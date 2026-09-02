import pool from './db/pool.js';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running DB migration for notification preferences identity...');

    await client.query('BEGIN');

    // 1. Drop existing primary key constraint on subscription_id
    await client.query(`
      DO $$
      DECLARE
        pk_name text;
      BEGIN
        SELECT constraint_name INTO pk_name
        FROM information_schema.table_constraints
        WHERE table_name = 'subscription_preferences' AND constraint_type = 'PRIMARY KEY';

        IF pk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE subscription_preferences DROP CONSTRAINT ' || pk_name;
        END IF;
      END $$;
    `);

    // 2. Add new primary key 'id' if not exists
    await client.query(`
      ALTER TABLE subscription_preferences ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    `);

    // 3. Add user_id column
    await client.query(`
      ALTER TABLE subscription_preferences ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    `);

    // 4. Map user_id from push_subscriptions
    await client.query(`
      UPDATE subscription_preferences sp
      SET user_id = ps.user_id
      FROM push_subscriptions ps
      WHERE sp.subscription_id = ps.id AND ps.user_id IS NOT NULL AND sp.user_id IS NULL;
    `);

    // 5. Deduplicate rows where user_id IS NOT NULL, keeping the most recently updated one
    await client.query(`
      DELETE FROM subscription_preferences
      WHERE user_id IS NOT NULL AND id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM subscription_preferences
        WHERE user_id IS NOT NULL
        ORDER BY user_id, updated_at DESC
      );
    `);

    // 6. Make subscription_id nullable
    await client.query(`
      ALTER TABLE subscription_preferences ALTER COLUMN subscription_id DROP NOT NULL;
    `);

    // 7. Nullify subscription_id for the rows that now belong to a user_id
    // This allows one user_id row to act for all subscriptions for that user.
    await client.query(`
      UPDATE subscription_preferences
      SET subscription_id = NULL
      WHERE user_id IS NOT NULL;
    `);

    // 8. Add unique constraints
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_pref_user_id ON subscription_preferences(user_id) WHERE user_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_pref_sub_id ON subscription_preferences(subscription_id) WHERE subscription_id IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
