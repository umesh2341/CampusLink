import pool from './pool.js';

async function migrateNoticeYears() {
  try {
    console.log('Running DB migration for notice target_year and notification preferences...');

    // ── 1. Add target_year to notices ────────────────────────────────────
    // Safe for fresh DB: column gets DEFAULT 'everyone'
    // Safe for existing DB: existing notices default to 'everyone'
    await pool.query(`
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS target_year VARCHAR(20) NOT NULL DEFAULT 'everyone';
    `);
    console.log('✅ notices.target_year ensured (default: everyone).');

    // Backfill any existing notices that might have NULL target_year
    await pool.query(`
      UPDATE notices SET target_year = 'everyone' WHERE target_year IS NULL;
    `);
    console.log('✅ Existing notices backfilled to target_year = everyone.');

    // ── 2. Add notification_years to subscription_preferences ─────────────
    // Default: all years (backward compatible — existing users keep receiving everything)
    await pool.query(`
      ALTER TABLE subscription_preferences
        ADD COLUMN IF NOT EXISTS notification_years TEXT[]
        NOT NULL DEFAULT ARRAY['1st','2nd','3rd','4th'];
    `);
    console.log('✅ subscription_preferences.notification_years ensured (default: all years).');

    // ── 3. Backfill existing subscriptions that have NULL notification_years ──
    await pool.query(`
      UPDATE subscription_preferences
      SET notification_years = ARRAY['1st','2nd','3rd','4th']
      WHERE notification_years IS NULL;
    `);
    console.log('✅ Existing subscriptions backfilled with all years.');

    console.log('🎉 Notice year targeting migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Notice year migration failed:', error);
    process.exit(1);
  }
}

migrateNoticeYears();
