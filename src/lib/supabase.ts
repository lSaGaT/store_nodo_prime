// This file is a barrel export that chooses the right implementation
// based on the environment (browser vs Node.js)

// Dynamic import based on environment
let supabaseClient: any;

if (typeof window !== 'undefined') {
  // Browser/client-side - use the client version
  const { supabase } = require('./supabase-client');
  supabaseClient = supabase;
} else {
  // Server-side - create a client with process.env
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  supabaseClient = createClient(url || '', key || '');
}

export const supabase = supabaseClient;

// Server-side function for admin operations
export function createSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Service role Supabase client missing credentials');
    return null;
  }

  return createClient(url, key);
}
