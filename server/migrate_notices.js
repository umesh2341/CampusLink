import pool from './db/pool.js';

async function runMigration() {
  try {
    console.log('Running DB schema migration for notice tags...');

    await pool.query(`
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE subscription_preferences ADD COLUMN IF NOT EXISTS enabled_notice_years TEXT[] DEFAULT ARRAY['1st_year', '2nd_year', '3rd_year', '4th_year', 'general'];
    `);

    console.log('✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
