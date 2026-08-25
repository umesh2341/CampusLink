/**
 * client/src/shared/lib/supabase.js
 *
 * Browser-side Supabase client for authentication.
 * Uses the anon key (safe to expose in the browser).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. ' +
    'Authentication will not work. Set these in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'placeholder-key'
);
