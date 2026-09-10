const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.aovketvcxpzyrqxqcgkn:L84LY03LT0FrTDhk@aws-0-ap-south-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'")).then(res => { console.log(res.rows.map(r => r.column_name)); client.end(); }).catch(console.error);
