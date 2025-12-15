/**
 * POST /api/profile/update-handle
 * 
 * Updates the user's TikTok handle in their profile.
 * This is the simple "manual connection" - just save their handle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded fallback for local dev (these are public anon keys, safe to include)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_d930CJeQo6JWUM0O903Azw_Pix4GX6q';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

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
  displayName?: string;
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
  
  // Update profile
  const admin = getSupabaseAdmin();
  
  const updateData: Record<string, any> = {
    tiktok_handle: normalizedHandle,
    updated_at: new Date().toISOString(),
  };
  
  if (body.displayName) {
    updateData.display_name = body.displayName.trim();
  }
  
  const { data, error } = await admin
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This TikTok handle is already connected to another account' });
    }
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({
    success: true,
    profile: {
      tiktok_handle: data.tiktok_handle,
      display_name: data.display_name,
    },
  });
}
