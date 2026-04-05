// Server-side Supabase for backend (Node.js/Express)
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role client for admin operations (server-side only)
export function createSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Service role Supabase client missing credentials');
    return null;
  }

  return createSupabaseClient(url, key);
}

// Create a basic client for server-side use (uses anon key)
export const supabase = createSupabaseClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);
