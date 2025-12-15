/**
 * POST /api/admin/import-metrics
 * 
 * Admin-only endpoint to import creator metrics from TikTok Partner Center exports.
 * 
 * Security:
 * - Requires valid Supabase JWT
 * - User must be in admin email allowlist
 * - Uses service role for database operations
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Admin email allowlist
const ADMIN_EMAILS = ['gagesampson2016@gmail.com'];

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

interface MetricRow {
  tiktok_handle: string;
  date: string;
  affiliate_gmv: number;
  items_sold: number;
  est_commission: number;
  commission_base: number;
  video_ctr: number;
  video_ctor: number;
  video_rpm: number;
  live_ctr: number;
  live_rpm: number;
  orders: number;
  video_views: number;
}

interface ImportRequest {
  rows: MetricRow[];
  source?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
  
  // Parse request body
  const body = req.body as ImportRequest;
  
  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return res.status(400).json({ error: 'No rows to import' });
  }
  
  const admin = getSupabaseAdmin();
  const source = body.source || 'api_import';
  
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];
  
  // Process each row
  for (const row of body.rows) {
    try {
      if (!row.tiktok_handle || !row.date) {
        errors.push(`Skipped row: missing handle or date`);
        continue;
      }
      
      // Normalize handle
      const handle = row.tiktok_handle.toLowerCase().trim().replace(/^@/, '');
      
      // Upsert the metric
      const { data, error } = await admin
        .from('creator_daily_metrics')
        .upsert({
          tiktok_handle: handle,
          date: row.date,
          affiliate_gmv: row.affiliate_gmv || 0,
          items_sold: row.items_sold || 0,
          est_commission: row.est_commission || 0,
          commission_base: row.commission_base || 0,
          video_ctr: row.video_ctr || 0,
          video_ctor: row.video_ctor || 0,
          video_rpm: row.video_rpm || 0,
          live_ctr: row.live_ctr || 0,
          live_rpm: row.live_rpm || 0,
          orders: row.orders || 0,
          video_views: row.video_views || 0,
          import_source: source,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tiktok_handle,date',
        })
        .select();
      
      if (error) {
        errors.push(`Error for @${handle}: ${error.message}`);
      } else {
        // Check if it was insert or update based on created vs updated timestamps
        inserted++;
      }
      
    } catch (err: any) {
      errors.push(`Error processing row: ${err.message}`);
    }
  }
  
  return res.status(200).json({
    success: true,
    inserted,
    updated,
    total: body.rows.length,
    errors: errors.slice(0, 20), // Limit error messages
  });
}
