/**
 * POST /api/profile/update-handle
 * 
 * Updates the user's TikTok handle in their profile.
 * This is the simple "manual connection" - just save their handle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

let supabaseAdmin: SupabaseClient | null = null;
let supabaseClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseAdmin;
}

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

interface UpdateHandleRequest {
  handle: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Authenticate
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }
  
  const token = authHeader.split(' ')[1];
  const client = getSupabaseClient();
  
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Parse body
  const body = req.body as UpdateHandleRequest;
  
  if (!body.handle) {
    return res.status(400).json({ error: 'Handle is required' });
  }
  
  // Normalize handle (lowercase, no @, trimmed)
  const normalizedHandle = body.handle.toLowerCase().trim().replace(/^@/, '');
  
  if (normalizedHandle.length < 2) {
    return res.status(400).json({ error: 'Handle must be at least 2 characters' });
  }
  
  if (!/^[a-z0-9._]+$/.test(normalizedHandle)) {
    return res.status(400).json({ error: 'Handle can only contain letters, numbers, dots, and underscores' });
  }
  
  // Upsert profile (create if doesn't exist, update if it does)
  const admin = getSupabaseAdmin();
  
  const { error } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      tiktok_handle: normalizedHandle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  
  if (error) {
    // Check for unique constraint violation on tiktok_handle
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This TikTok handle is already connected to another account' });
    }
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({
    success: true,
    profile: {
      tiktok_handle: normalizedHandle,
    },
  });
}
