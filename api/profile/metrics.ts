/**
 * GET /api/profile/metrics
 * 
 * Returns logged-in user's metrics.
 * Checks: 1) has handle, 2) handle in linked_creators, 3) has metrics data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
      connected: false,
      handle: null,
      isLinked: false,
      hasData: false,
      summary: { totalGmv: 0, totalCommission: 0, totalItems: 0, avgCtr: 0 },
      dailyMetrics: [],
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
