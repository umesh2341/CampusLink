import 'dotenv/config';
import { dispatchEventPushNotification } from './services/pushService.js';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: 'postgresql://postgres.aovketvcxpzyrqxqcgkn:L84LY03LT0FrTDhk@aws-0-ap-south-1.pooler.supabase.com:5432/postgres' });

async function test() {
  await client.connect();
  const res = await client.query("SELECT * FROM events ORDER BY created_at DESC LIMIT 1");
  const event = res.rows[0];
  console.log('Testing push for event:', event.id);
  try {
    await dispatchEventPushNotification(event);
    console.log('Done push logic');
  } catch (err) {
    console.error('Push error:', err);
  }
  await client.end();
}
test().catch(console.error);
