import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Support both unified DATABASE_URL, connection URIs in DB_HOST, or individual env variables
const dbHost = process.env.DB_HOST || 'localhost';
const isUri = dbHost.startsWith('postgresql://') || dbHost.startsWith('postgres://');
const isLocal = dbHost.includes('localhost') || dbHost.includes('127.0.0.1');

const poolConfig = {};

if (isUri) {
  poolConfig.connectionString = dbHost;
  poolConfig.ssl = { rejectUnauthorized: false };
} else if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || 'postgres';
  poolConfig.host = dbHost;
  poolConfig.port = parseInt(process.env.DB_PORT || '5432', 10);
  poolConfig.database = process.env.DB_DATABASE || 'postgres';
  
  if (!isLocal) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(poolConfig);

// Handle unexpected errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export default pool;
