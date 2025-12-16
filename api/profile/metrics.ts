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

  // Get metrics
  const { data: metrics } = await admin
    .from('creator_daily_metrics')
    .select('*')
    .eq('tiktok_handle', handle)
    .order('date', { ascending: false })
    .limit(30);

  const hasData = metrics && metrics.length > 0;

  // Calculate summary
  let totalGmv = 0, totalCommission = 0, totalItems = 0;
  const ctrValues: number[] = [];

  if (hasData) {
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
    hasData,
    summary: { totalGmv, totalCommission, totalItems, avgCtr },
    dailyMetrics: metrics || [],
  });
}
