/**
 * Migration: Add hide_label column to buildings and update specific rows.
 *
 * Run once with: node hide_specific_labels.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function run() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const isUri = dbHost.startsWith('postgresql://') || dbHost.startsWith('postgres://');

  const clientConfig = {};
  if (isUri) {
    clientConfig.connectionString = dbHost;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else if (process.env.DATABASE_URL) {
    clientConfig.connectionString = process.env.DATABASE_URL;
    clientConfig.ssl = { rejectUnauthorized: false };
  } else {
    clientConfig.user     = process.env.DB_USER     || 'postgres';
    clientConfig.password = process.env.DB_PASSWORD || 'postgres';
    clientConfig.host     = dbHost;
    clientConfig.port     = parseInt(process.env.DB_PORT || '5432', 10);
    clientConfig.database = process.env.DB_DATABASE || 'postgres';
    if (!dbHost.includes('localhost') && !dbHost.includes('127.0.0.1')) {
      clientConfig.ssl = { rejectUnauthorized: false };
    }
  }

  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('✓ Connected to database.');

    // 1. Add column (idempotent)
    await client.query(`ALTER TABLE buildings ADD COLUMN IF NOT EXISTS hide_label BOOLEAN DEFAULT false;`);
    console.log('✓ hide_label column ensured.');

    // 2. Set hide_label = true for specific buildings
    const result1 = await client.query(`UPDATE buildings SET hide_label = true WHERE svg_element_id = 'electronic-office';`);
    const result2 = await client.query(`UPDATE buildings SET hide_label = true WHERE svg_element_id = 'drive-ev';`);
    
    console.log(`✓ Updated electronic-office: ${result1.rowCount} rows affected.`);
    console.log(`✓ Updated drive-ev: ${result2.rowCount} rows affected.`);

  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
