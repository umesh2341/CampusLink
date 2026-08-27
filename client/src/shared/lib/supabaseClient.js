import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aovketvcxpzyrqxqcgkn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AlVLXjgpsr3E73r4MyM1Hg_w8Yj6KHx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
