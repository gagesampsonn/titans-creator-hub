import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

/**
 * Single Supabase client instance for the entire app
 * 
 * Configuration:
 * - persistSession: true (default) - saves session to localStorage
 * - autoRefreshToken: true (default) - automatically refreshes tokens
 * - detectSessionInUrl: true - important for OAuth callbacks
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use localStorage for session persistence
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Debug: Log when this module is loaded
console.log('[Supabase] Client initialized with URL:', supabaseUrl?.slice(0, 30) + '...');
