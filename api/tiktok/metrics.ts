/**
 * GET /api/tiktok/metrics
 * 
 * Fetches TikTok Shop metrics for the authenticated user.
 * This endpoint makes server-side calls to TikTok's API using stored tokens.
 * 
 * SECURITY:
 * - Validates user authentication via Supabase JWT
 * - Only returns data for the authenticated user
 * - Uses stored tokens, never exposes them to client
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// TikTok Shop API base URL
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface TikTokAPIResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user via Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  // Verify the JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Get user's TikTok connection (using service role to access tokens)
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return res.status(404).json({ 
        error: 'No TikTok account connected',
        needsConnection: true 
      });
    }

    // Check if token is expired
    if (new Date(connection.token_expires_at) < new Date()) {
      // Token expired - need to refresh
      const refreshed = await refreshAccessToken(connection, user.id);
      if (!refreshed) {
        return res.status(401).json({ 
          error: 'TikTok session expired',
          needsReconnection: true 
        });
      }
    }

    // Fetch metrics from TikTok API
    // For now, return mock data structure - replace with real API calls
    const metrics = await fetchTikTokMetrics(connection.access_token, connection.shop_id);

    // Cache metrics in database for faster future loads
    await cacheMetrics(user.id, connection.id, metrics);

    return res.status(200).json({
      connected: true,
      username: connection.tiktok_username,
      metrics,
    });

  } catch (error) {
    console.error('Metrics fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

/**
 * Refresh an expired access token
 */
async function refreshAccessToken(connection: any, userId: string): Promise<boolean> {
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!appKey || !appSecret) {
    return false;
  }

  try {
    const response = await fetch('https://auth.tiktok-shops.com/api/v2/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (data.code !== 0 || !data.data) {
      return false;
    }

    // Update tokens in database
    const tokenExpiresAt = new Date(Date.now() + data.data.access_token_expire_in * 1000);

    await supabaseAdmin
      .from('tiktok_connections')
      .update({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        token_expires_at: tokenExpiresAt.toISOString(),
      })
      .eq('id', connection.id);

    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch metrics from TikTok Shop API
 * TODO: Replace with actual API calls when ready
 */
async function fetchTikTokMetrics(accessToken: string, shopId: string | null) {
  // For now, return structured mock data
  // This will be replaced with actual TikTok API calls
  
  // Example of what a real API call would look like:
  // const response = await fetch(`${TIKTOK_API_BASE}/affiliate/202309/orders/search`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${accessToken}`,
  //     'Content-Type': 'application/json',
  //     'x-tts-access-token': accessToken,
  //   },
  //   body: JSON.stringify({ ... }),
  // });

  return {
    summary: {
      gmv7Day: 12450.00,
      gmv30Day: 48230.00,
      commission7Day: 1867.50,
      commission30Day: 7234.50,
      ordersTotal: 342,
      itemsSold: 589,
      refundRate: 2.3,
    },
    dailyGMV: [
      { date: '2024-12-07', value: 1520 },
      { date: '2024-12-08', value: 1890 },
      { date: '2024-12-09', value: 2100 },
      { date: '2024-12-10', value: 1750 },
      { date: '2024-12-11', value: 2340 },
      { date: '2024-12-12', value: 1650 },
      { date: '2024-12-13', value: 1200 },
    ],
    topProducts: [
      { name: 'Viral Skincare Set', sales: 145, revenue: 4350 },
      { name: 'LED Face Mask', sales: 89, revenue: 3560 },
      { name: 'Hair Growth Serum', sales: 76, revenue: 2280 },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Cache metrics in Supabase for faster loads
 */
async function cacheMetrics(userId: string, connectionId: string, metrics: any) {
  const today = new Date().toISOString().split('T')[0];

  try {
    await supabaseAdmin.rpc('insert_user_analytics', {
      p_user_id: userId,
      p_connection_id: connectionId,
      p_metric_type: 'gmv_weekly',
      p_metric_value: metrics.summary.gmv7Day,
      p_metric_data: metrics,
      p_period_start: today,
      p_period_end: today,
    });
  } catch (error) {
    console.error('Failed to cache metrics:', error);
  }
}
