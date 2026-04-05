import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Helper to get environment variables in both Node and Vite environments
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  // @ts-ignore
  return import.meta.env?.[key];
};

// Try multiple possible environment variable names
const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Public client for Auth and public data
export const supabase = createSupabaseClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing! Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Service role client for backend/admin operations
export function createSupabase() {
  const url = supabaseUrl;
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY');

  if (!url || !key) {
    console.warn('Service role Supabase client missing credentials');
    return null;
  }

  return createSupabaseClient(url, key);
}
