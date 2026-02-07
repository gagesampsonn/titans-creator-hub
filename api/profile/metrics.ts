/**
 * GET /api/profile/metrics
 * 
 * Returns logged-in user's metrics.
 * Checks: 1) has handle, 2) handle in linked_creators, 3) has metrics data
 * 
 * SECURITY: Rate limited to 60 requests/min (read-only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '../_shared/rateLimit';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 60 requests per minute (read-only)
  if (applyRateLimit(req, res, 'profile-metrics', 'readonly')) return;

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

  // Get profile - try by user ID first, then by email as fallback
  let handle: string | null = null;
  
  const { data: profileById } = await admin
    .from('profiles')
    .select('tiktok_handle')
    .eq('id', user.id)
    .single();
  
  if (profileById?.tiktok_handle) {
    handle = profileById.tiktok_handle;
  } else if (user.email) {
    // Fallback: look up by email (handles case where profile exists but with different user ID)
    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('tiktok_handle')
      .eq('email', user.email.toLowerCase())
      .single();
    
    if (profileByEmail?.tiktok_handle) {
      handle = profileByEmail.tiktok_handle;
      console.log(`[Metrics] Found profile by email for ${user.email} with handle @${handle}`);
      
      // Create/update profile for current user ID with the found handle
      await admin
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          tiktok_handle: handle,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    }
  }

  // If no handle set, check if user's email is already linked to a creator
  if (!handle && user.email) {
    const userEmailLower = user.email.toLowerCase();
    
    // First try: Check linked_creators table for email column (if it exists)
    let linkedHandle: string | null = null;
    try {
      const { data: linkedByEmail } = await admin
        .from('linked_creators')
        .select('tiktok_handle')
        .eq('email', userEmailLower)
        .single();
      
      if (linkedByEmail?.tiktok_handle) {
        linkedHandle = linkedByEmail.tiktok_handle;
      }
    } catch (err) {
      // Email column might not exist yet, try fallback
      console.log('[Metrics] Email column not available, using fallback mapping');
    }
    
    // Fallback: Check known email-to-handle mappings (for immediate functionality)
    // This is a temporary solution until the email column is added to linked_creators
    if (!linkedHandle) {
      const knownEmailMappings: Record<string, string> = {
        'gagesampson2016@gmail.com': 'ttshopl',
        // Add more mappings here as needed
      };
      linkedHandle = knownEmailMappings[userEmailLower] || null;
    }
    
    if (linkedHandle) {
      // Verify the handle is in linked_creators
      const { data: isLinked } = await admin
        .from('linked_creators')
        .select('tiktok_handle')
        .eq('tiktok_handle', linkedHandle)
        .single();
      
      if (isLinked) {
        // Auto-link: Update the user's profile with their TikTok handle
        handle = linkedHandle;
        
        await admin
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            tiktok_handle: handle,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        console.log(`[Metrics] Auto-linked user ${user.email} to handle @${handle}`);
      }
    }
  }

  if (!handle) {
    return res.status(200).json({
      connected: false,
      handle: null,
      isLinked: false,
      hasData: false,
      summary: { totalGmv: 0, totalCommission: 0, totalItems: 0, avgCtr: 0 },
      dailyMetrics: [],
    });
  }

  // Check if linked to agency
  const { data: linked } = await admin
    .from('linked_creators')
    .select('tiktok_handle')
    .eq('tiktok_handle', handle)
    .single();

  if (!linked) {
    return res.status(200).json({
      connected: true,
      handle,
      isLinked: false,
      hasData: false,
      summary: { totalGmv: 0, totalCommission: 0, totalItems: 0, avgCtr: 0 },
      dailyMetrics: [],
    });
  }

  // Get daily metrics (legacy)
  const { data: metrics } = await admin
    .from('creator_daily_metrics')
    .select('*')
    .eq('tiktok_handle', handle)
    .order('date', { ascending: false })
    .limit(30);

  // Get period summary with comparison data
  const { data: periodSummary } = await admin
    .from('creator_period_summary')
    .select('*')
    .eq('tiktok_handle', handle)
    .order('date_end', { ascending: false })
    .limit(1)
    .single();

  // Use period summary if available, otherwise fall back to daily metrics
  const hasData = periodSummary || (metrics && metrics.length > 0);

  // Calculate summary from period summary or daily metrics
  let totalGmv = 0, totalCommission = 0, totalItems = 0, totalOrders = 0;
  let gmvChange = 0, itemsChange = 0, ordersChange = 0;
  let dateStart = '', dateEnd = '', comparisonStart = '', comparisonEnd = '';
  let topNiche = '', topNicheGmv = 0;
  const ctrValues: number[] = [];

  if (periodSummary) {
    // Use period summary data
    totalGmv = Number(periodSummary.total_gmv) || 0;
    totalCommission = Number(periodSummary.total_commission) || 0;
    totalItems = Number(periodSummary.total_items) || 0;
    totalOrders = Number(periodSummary.total_orders) || 0;
    gmvChange = Number(periodSummary.gmv_change_pct) || 0;
    itemsChange = Number(periodSummary.items_change_pct) || 0;
    ordersChange = Number(periodSummary.orders_change_pct) || 0;
    dateStart = periodSummary.date_start;
    dateEnd = periodSummary.date_end;
    comparisonStart = periodSummary.comparison_start;
    comparisonEnd = periodSummary.comparison_end;
    topNiche = periodSummary.top_niche || '';
    topNicheGmv = Number(periodSummary.top_niche_gmv) || 0;
  } else if (metrics && metrics.length > 0) {
    // Fall back to daily metrics
    for (const m of metrics) {
      totalGmv += Number(m.affiliate_gmv) || 0;
      totalCommission += Number(m.est_commission) || 0;
      totalItems += Number(m.items_sold) || 0;
      if (m.video_ctr > 0) ctrValues.push(Number(m.video_ctr));
    }
  }

  const avgCtr = ctrValues.length > 0 
    ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length 
    : 0;

  return res.status(200).json({
    connected: true,
    handle,
    isLinked: true,
    hasData: !!hasData,
    summary: { 
      totalGmv, 
      totalCommission, 
      totalItems, 
      totalOrders,
      avgCtr,
      // Comparison data
      gmvChange,
      itemsChange,
      ordersChange,
      // Top niche
      topNiche,
      topNicheGmv,
    },
    period: {
      dateStart,
      dateEnd,
      comparisonStart,
      comparisonEnd,
    },
    dailyMetrics: metrics || [],
  });
}
