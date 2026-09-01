/**
 * server/lib/supabase.js
 *
 * Supabase client for backend token verification.
 * Uses the SERVICE ROLE key (server-side only — never exposed to frontend).
 * This client is used by the auth middleware to verify Supabase JWTs.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'Auth verification will fail. Set these in your .env file.'
  );
}

// Service role client — used for admin operations like token verification
// This bypasses RLS (which is fine for server-side verification)
export const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseServiceKey || 'placeholder-key'
);

/**
 * Verify a Supabase JWT and return the authenticated user.
 * Returns the user object or null if the token is invalid.
 */
export async function verifySupabaseToken(accessToken) {
  if (!accessToken) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('Supabase token verification error:', err.message);
    return null;
  }
}
