/**
 * /api/admin/linked-creators
 * 
 * Admin endpoint to manage linked creators.
 * 
 * GET - List all linked creators
 * POST - Add new linked creator(s)
 * DELETE - Remove a linked creator
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Admin email allowlist
const ADMIN_EMAILS = ['gagesampson2016@gmail.com'];

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
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

// Normalize handle: lowercase, no @, trimmed
function normalizeHandle(handle: string): string {
  return handle.toLowerCase().trim().replace(/^@/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  const token = authHeader.split(' ')[1];
  const client = getSupabaseClient();
  
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Check admin authorization
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const admin = getSupabaseAdmin();
  
  // Handle different methods
  switch (req.method) {
    case 'GET': {
      // List all linked creators
      const { data, error } = await admin
        .from('linked_creators')
        .select('*')
        .order('tiktok_handle', { ascending: true });
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({
        creators: data || [],
        total: data?.length || 0,
      });
    }
    
    case 'POST': {
      // Add new linked creator(s)
      const body = req.body;
      
      // Support single creator or array
      const creatorsToAdd = Array.isArray(body.creators) 
        ? body.creators 
        : body.handle 
          ? [{ handle: body.handle, displayName: body.displayName, notes: body.notes }]
          : [];
      
      if (creatorsToAdd.length === 0) {
        return res.status(400).json({ error: 'No creators provided. Send { handle } or { creators: [...] }' });
      }
      
      const results = {
        added: 0,
        skipped: 0,
        errors: [] as string[],
      };
      
      for (const creator of creatorsToAdd) {
        const handle = normalizeHandle(creator.handle || '');
        
        if (!handle || handle.length < 2) {
          results.errors.push(`Invalid handle: ${creator.handle}`);
          continue;
        }
        
        const { error } = await admin
          .from('linked_creators')
          .upsert({
            tiktok_handle: handle,
            display_name: creator.displayName || creator.display_name || null,
            notes: creator.notes || null,
            status: 'active',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'tiktok_handle',
          });
        
        if (error) {
          results.errors.push(`Error adding @${handle}: ${error.message}`);
        } else {
          results.added++;
        }
      }
      
      return res.status(200).json({
        success: true,
        ...results,
      });
    }
    
    case 'DELETE': {
      // Remove a linked creator
      const handle = normalizeHandle(req.query.handle as string || req.body?.handle || '');
      
      if (!handle) {
        return res.status(400).json({ error: 'Handle is required' });
      }
      
      const { error } = await admin
        .from('linked_creators')
        .delete()
        .eq('tiktok_handle', handle);
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({
        success: true,
        deleted: handle,
      });
    }
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
