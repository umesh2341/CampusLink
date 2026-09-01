import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let currentConfigKey = '';

export function getRedBullSupabaseClient(config = {}) {
  const url = config.supabaseUrl ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL : '') ||
    '';

  const anonKey = config.supabaseAnonKey ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') ||
    (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY : '') ||
    '';

  const configKey = `${url}::${anonKey}`;

  if (cachedClient && currentConfigKey === configKey) {
    return cachedClient;
  }

  if (!url || !anonKey) {
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  currentConfigKey = configKey;
  return cachedClient;
}
