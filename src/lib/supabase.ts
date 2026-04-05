// Server-side Supabase - runs in Node.js, uses process.env
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role client for backend/admin operations (server-side only)
export function createSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Service role Supabase client missing credentials');
    return null;
  }

  return createSupabaseClient(url, key);
}

// Re-export client for backward compatibility (will be replaced in browser)
export { supabase } from './supabase-client.js';
