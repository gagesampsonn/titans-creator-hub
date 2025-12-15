/**
 * GET /api/profile/metrics
 * 
 * Returns the logged-in user's metrics from creator_daily_metrics
 * based on their saved tiktok_handle.
 * 
 * Also checks linked_creators table to determine agency link status.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
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
  
  const admin = getSupabaseAdmin();
  
  // Get user's profile to find their handle
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('tiktok_handle, display_name')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  if (!profile.tiktok_handle) {
    return res.status(200).json({
      connected: false,
      handle: null,
      isLinkedToAgency: false,
      hasData: false,
      message: 'No TikTok handle connected',
    });
  }
  
  // Check if this handle is in linked_creators table
  const { data: linkedCreator } = await admin
    .from('linked_creators')
    .select('tiktok_handle, display_name, status')
    .eq('tiktok_handle', profile.tiktok_handle)
    .eq('status', 'active')
    .single();
  
  const isLinkedToAgency = !!linkedCreator;
  
  // If not linked to agency, return early with clear message
  if (!isLinkedToAgency) {
    return res.status(200).json({
      connected: true,
      handle: profile.tiktok_handle,
      displayName: profile.display_name,
      isLinkedToAgency: false,
      hasData: false,
      summary: null,
      dailyMetrics: [],
      message: 'Your account is not linked to the agency yet. Please contact your agency manager to get linked.',
    });
  }
  
  // Get their metrics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: metrics, error: metricsError } = await admin
    .from('creator_daily_metrics')
    .select('*')
    .eq('tiktok_handle', profile.tiktok_handle)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });
  
  if (metricsError) {
    console.error('Metrics error:', metricsError);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
  
  // Calculate summary
  const hasData = metrics && metrics.length > 0;
  
  const summary = {
    gmv30Day: 0,
    commission30Day: 0,
    itemsSold30Day: 0,
    orders30Day: 0,
    avgVideoCtr: 0,
    avgVideoRpm: 0,
  };
  
  if (hasData) {
    for (const m of metrics) {
      summary.gmv30Day += Number(m.affiliate_gmv) || 0;
      summary.commission30Day += Number(m.est_commission) || 0;
      summary.itemsSold30Day += Number(m.items_sold) || 0;
      summary.orders30Day += Number(m.orders) || 0;
    }
    
    const ctrValues = metrics.filter(m => m.video_ctr > 0).map(m => Number(m.video_ctr));
    const rpmValues = metrics.filter(m => m.video_rpm > 0).map(m => Number(m.video_rpm));
    
    summary.avgVideoCtr = ctrValues.length > 0 
      ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length 
      : 0;
    summary.avgVideoRpm = rpmValues.length > 0 
      ? rpmValues.reduce((a, b) => a + b, 0) / rpmValues.length 
      : 0;
  }
  
  return res.status(200).json({
    connected: true,
    handle: profile.tiktok_handle,
    displayName: profile.display_name || linkedCreator?.display_name,
    isLinkedToAgency: true,
    hasData,
    summary,
    dailyMetrics: metrics || [],
    message: hasData 
      ? undefined 
      : 'You are linked to the agency! Metrics will appear after the next daily import.',
  });
}
