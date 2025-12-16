import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myylgglbtroabqclzvvn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';

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
