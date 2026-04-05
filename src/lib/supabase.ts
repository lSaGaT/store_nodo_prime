import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Helper to get environment variables in both Node and Vite environments
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  // @ts-ignore
  return import.meta.env?.[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Public client for Auth and public data
// We use a dummy URL if missing to prevent immediate crash, but log a warning
export const supabase = createSupabaseClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Service role client for backend/admin operations
export function createSupabase() {
  const url = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    return null;
  }

  return createSupabaseClient(url, key);
}
