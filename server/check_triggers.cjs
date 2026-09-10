const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.aovketvcxpzyrqxqcgkn:L84LY03LT0FrTDhk@aws-0-ap-south-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'events'")).then(res => { console.log(res.rows); client.end(); }).catch(console.error);
