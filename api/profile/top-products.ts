/**
 * GET /api/profile/top-products
 * 
 * Returns logged-in user's top 5 products by GMV.
 * Only shows products with GMV > 0 and items_sold > 0.
 * 
 * SECURITY: Rate limited to 60 requests/min (read-only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Inline rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function applyRateLimit(req: VercelRequest, res: VercelResponse, prefix: string): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;
  
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }
  record.count++;
  return false;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 60 requests per minute
  if (applyRateLimit(req, res, 'profile-top-products')) return;

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('tiktok_handle')
    .eq('id', user.id)
    .single();

  if (!profile?.tiktok_handle) {
    return res.status(200).json({
      hasProducts: false,
      products: [],
      dateRange: null
    });
  }

  const handle = profile.tiktok_handle;

  // Check if linked to agency
  const { data: linked } = await admin
    .from('linked_creators')
    .select('tiktok_handle')
    .eq('tiktok_handle', handle)
    .single();

  if (!linked) {
    return res.status(200).json({
      hasProducts: false,
      products: [],
      dateRange: null
    });
  }

  // Get top 5 products by GMV (only with GMV > 0 and items_sold > 0)
  const { data: products, error: productsError } = await admin
    .from('creator_product_metrics')
    .select('*')
    .eq('tiktok_handle', handle)
    .gt('gmv', 0)
    .gt('items_sold', 0)
    .order('gmv', { ascending: false })
    .limit(5);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }

  const hasProducts = products && products.length > 0;
  
  // Get date range from the first product (all should have same date range from import)
  const dateRange = hasProducts 
    ? { start: products[0].date_start, end: products[0].date_end }
    : null;

  return res.status(200).json({
    hasProducts,
    products: products || [],
    dateRange
  });
}
