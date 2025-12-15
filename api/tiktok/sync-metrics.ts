/**
 * /api/tiktok/sync-metrics
 * 
 * Syncs creator performance metrics from TikTok Partner Center APIs
 * 
 * This endpoint:
 * 1. Fetches performance data from TikTok's Affiliate Partner API
 * 2. Writes normalized metrics to creator_performance_metrics table
 * 3. Returns summary stats for dashboard display
 * 
 * Should be called:
 * - On dashboard load (with rate limiting)
 * - Via scheduled cron job (daily sync)
 * - Manually by user ("Refresh" button)
 * 
 * TikTok Partner Center API Reference:
 * - Affiliate Partner: /affiliate/{version}/creators/performance
 * - Analytics: /analytics/{version}/reports
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { 
  SyncMetricsRequest, 
  SyncMetricsResponse,
  PerformanceSummary,
  DailyMetric,
  TopProduct,
} from '../../lib/tiktokPartnerTypes';

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// TikTok API base
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

/**
 * Get authenticated user from JWT
 */
async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Calculate date range for sync
 */
function getDateRange(request?: SyncMetricsRequest) {
  if (request?.dateRange) {
    return request.dateRange;
  }
  
  // Default: last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * TODO: Implement actual TikTok API call
 * This is the structure based on Partner Center documentation
 */
async function fetchFromTikTokAPI(
  accessToken: string,
  endpoint: string,
  params: Record<string, any>
): Promise<any> {
  // TODO: Implement with actual TikTok API credentials
  // 
  // const appKey = process.env.TIKTOK_APP_KEY;
  // const appSecret = process.env.TIKTOK_APP_SECRET;
  // 
  // // Sign the request per TikTok requirements
  // const timestamp = Math.floor(Date.now() / 1000);
  // const signature = generateSignature(appSecret, timestamp, params);
  // 
  // const response = await fetch(`${TIKTOK_API_BASE}${endpoint}`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'x-tts-access-token': accessToken,
  //   },
  //   body: JSON.stringify({
  //     ...params,
  //     app_key: appKey,
  //     timestamp,
  //     sign: signature,
  //   }),
  // });
  // 
  // return response.json();

  // For now, return mock data
  return null;
}

/**
 * Generate mock performance data
 * In production, this would come from TikTok API
 */
function generateMockPerformanceData(dateRange: { startDate: string; endDate: string }) {
  const days: any[] = [];
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  
  const current = new Date(start);
  while (current <= end) {
    // Generate random but realistic-looking data
    const baseGMV = 800 + Math.random() * 1500;
    const orders = Math.floor(15 + Math.random() * 35);
    const clicks = Math.floor(200 + Math.random() * 500);
    const impressions = clicks * (3 + Math.random() * 5);
    
    days.push({
      date: current.toISOString().split('T')[0],
      impressions: Math.floor(impressions),
      clicks,
      orders,
      gmv: Math.round(baseGMV * 100) / 100,
      commission: Math.round(baseGMV * 0.15 * 100) / 100,
      itemsSold: Math.floor(orders * (1.2 + Math.random() * 0.8)),
      refunds: Math.floor(Math.random() * 3),
      refundAmount: Math.round(Math.random() * 50 * 100) / 100,
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * Generate mock product data
 */
function generateMockProductData() {
  const products = [
    { id: 'prod_001', name: 'Glow Serum Pro', category: 'Beauty' },
    { id: 'prod_002', name: 'LED Face Mask 3.0', category: 'Beauty' },
    { id: 'prod_003', name: 'Biotin Hair Gummies', category: 'Supplements' },
    { id: 'prod_004', name: 'Smart Pet Feeder', category: 'Pets' },
    { id: 'prod_005', name: 'Vitamin C Complex', category: 'Supplements' },
  ];
  
  return products.map(p => ({
    ...p,
    gmv: Math.round((2000 + Math.random() * 8000) * 100) / 100,
    orders: Math.floor(50 + Math.random() * 200),
    commission: 0,
    commissionRate: 0.10 + Math.random() * 0.10,
    clicks: Math.floor(500 + Math.random() * 2000),
    impressions: 0,
  })).map(p => ({
    ...p,
    commission: Math.round(p.gmv * p.commissionRate * 100) / 100,
    impressions: Math.floor(p.clicks * (4 + Math.random() * 3)),
  })).sort((a, b) => b.gmv - a.gmv);
}

/**
 * Sync metrics to database
 */
async function syncMetricsToDatabase(
  userId: string,
  connectionId: string,
  dailyData: any[]
): Promise<number> {
  let syncedCount = 0;
  
  for (const day of dailyData) {
    try {
      await supabaseAdmin.rpc('upsert_creator_performance', {
        p_user_id: userId,
        p_tiktok_connection_id: connectionId,
        p_metric_date: day.date,
        p_product_id: null,
        p_product_name: null,
        p_tap_offer_id: null,
        p_impressions: day.impressions,
        p_clicks: day.clicks,
        p_orders: day.orders,
        p_gmv: day.gmv,
        p_commission_earned: day.commission,
        p_items_sold: day.itemsSold,
        p_refunds: day.refunds,
        p_refund_amount: day.refundAmount,
      });
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync metrics for ${day.date}:`, error);
    }
  }
  
  return syncedCount;
}

/**
 * Calculate summary from synced data
 */
async function calculateSummary(
  userId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<PerformanceSummary> {
  // Get metrics from database
  const { data: metrics, error } = await supabase
    .from('creator_performance_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('metric_date', dateRange.startDate)
    .lte('metric_date', dateRange.endDate)
    .order('metric_date', { ascending: false });

  if (error || !metrics?.length) {
    return {
      gmv7Day: 0,
      gmv30Day: 0,
      gmvAllTime: 0,
      commission7Day: 0,
      commission30Day: 0,
      commissionAllTime: 0,
      orders7Day: 0,
      orders30Day: 0,
      ordersAllTime: 0,
      itemsSold7Day: 0,
      itemsSold30Day: 0,
      avgCommissionRate: 0,
      avgRefundRate: 0,
      gmvTrend7Day: 0,
      gmvTrend30Day: 0,
    };
  }

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Calculate aggregates
  const last7Days = metrics.filter(m => new Date(m.metric_date) >= sevenDaysAgo);
  const previous7Days = metrics.filter(m => {
    const date = new Date(m.metric_date);
    return date >= fourteenDaysAgo && date < sevenDaysAgo;
  });

  const sum = (arr: any[], field: string) => arr.reduce((acc, m) => acc + (parseFloat(m[field]) || 0), 0);

  const gmv7Day = sum(last7Days, 'gmv');
  const gmv30Day = sum(metrics.slice(0, 30), 'gmv');
  const previousGmv7Day = sum(previous7Days, 'gmv');

  const gmvTrend7Day = previousGmv7Day > 0 
    ? ((gmv7Day - previousGmv7Day) / previousGmv7Day) * 100 
    : 0;

  const totalOrders = sum(metrics, 'orders');
  const totalRefunds = sum(metrics, 'refunds');
  const totalGmv = sum(metrics, 'gmv');
  const totalCommission = sum(metrics, 'commission_earned');

  return {
    gmv7Day: Math.round(gmv7Day * 100) / 100,
    gmv30Day: Math.round(gmv30Day * 100) / 100,
    gmvAllTime: Math.round(totalGmv * 100) / 100,
    commission7Day: Math.round(sum(last7Days, 'commission_earned') * 100) / 100,
    commission30Day: Math.round(sum(metrics.slice(0, 30), 'commission_earned') * 100) / 100,
    commissionAllTime: Math.round(totalCommission * 100) / 100,
    orders7Day: sum(last7Days, 'orders'),
    orders30Day: sum(metrics.slice(0, 30), 'orders'),
    ordersAllTime: totalOrders,
    itemsSold7Day: sum(last7Days, 'items_sold'),
    itemsSold30Day: sum(metrics.slice(0, 30), 'items_sold'),
    avgCommissionRate: totalGmv > 0 ? totalCommission / totalGmv : 0,
    avgRefundRate: totalOrders > 0 ? totalRefunds / totalOrders : 0,
    gmvTrend7Day: Math.round(gmvTrend7Day * 100) / 100,
    gmvTrend30Day: 0, // Would need 60 days of data
  };
}

/**
 * Get daily metrics for chart
 */
async function getDailyMetrics(
  userId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<DailyMetric[]> {
  const { data: metrics, error } = await supabase
    .from('creator_performance_metrics')
    .select('metric_date, gmv, commission_earned, orders, clicks')
    .eq('user_id', userId)
    .gte('metric_date', dateRange.startDate)
    .lte('metric_date', dateRange.endDate)
    .order('metric_date', { ascending: true });

  if (error || !metrics) {
    return [];
  }

  return metrics.map(m => ({
    date: m.metric_date,
    gmv: parseFloat(m.gmv) || 0,
    commission: parseFloat(m.commission_earned) || 0,
    orders: m.orders || 0,
    clicks: m.clicks || 0,
  }));
}

/**
 * Get top products
 */
async function getTopProducts(userId: string): Promise<TopProduct[]> {
  // In production, this would aggregate from creator_performance_metrics
  // grouped by product_id. For now, return mock data.
  const mockProducts = generateMockProductData();
  
  return mockProducts.slice(0, 5).map(p => ({
    productId: p.id,
    productName: p.name,
    productCategory: p.category,
    gmv: p.gmv,
    orders: p.orders,
    commission: p.commission,
    commissionRate: p.commissionRate,
  }));
}

/**
 * POST - Sync metrics from TikTok
 */
async function handleSyncMetrics(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body as SyncMetricsRequest;
  const dateRange = getDateRange(body);

  try {
    // Get user's TikTok connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return res.status(400).json({ 
        error: 'No TikTok account connected',
        needsConnection: true,
      });
    }

    // Check rate limiting (don't sync more than once per 15 minutes unless forced)
    if (!body?.forceRefresh) {
      const { data: recentSync } = await supabaseAdmin
        .from('creator_performance_metrics')
        .select('synced_from_tiktok_at')
        .eq('user_id', user.id)
        .order('synced_from_tiktok_at', { ascending: false })
        .limit(1)
        .single();

      if (recentSync?.synced_from_tiktok_at) {
        const lastSync = new Date(recentSync.synced_from_tiktok_at);
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        if (lastSync > fifteenMinutesAgo) {
          // Return cached data instead
          const summary = await calculateSummary(user.id, dateRange);
          const dailyMetrics = await getDailyMetrics(user.id, dateRange);
          const topProducts = await getTopProducts(user.id);

          return res.status(200).json({
            success: true,
            syncedRecords: 0,
            cached: true,
            lastSyncedAt: recentSync.synced_from_tiktok_at,
            summary,
            dailyMetrics,
            topProducts,
          });
        }
      }
    }

    // TODO: Fetch from TikTok API
    // const tiktokData = await fetchFromTikTokAPI(
    //   connection.access_token,
    //   '/affiliate/202405/creators/performance',
    //   { 
    //     start_date: dateRange.startDate,
    //     end_date: dateRange.endDate,
    //   }
    // );

    // For now, use mock data
    const dailyData = generateMockPerformanceData(dateRange);

    // Sync to database
    const syncedCount = await syncMetricsToDatabase(
      user.id,
      connection.id,
      dailyData
    );

    // Calculate fresh summary
    const summary = await calculateSummary(user.id, dateRange);
    const dailyMetrics = await getDailyMetrics(user.id, dateRange);
    const topProducts = await getTopProducts(user.id);

    const response: SyncMetricsResponse & { 
      dailyMetrics: DailyMetric[]; 
      topProducts: TopProduct[];
    } = {
      success: true,
      syncedRecords: syncedCount,
      lastSyncedAt: new Date().toISOString(),
      summary,
      dailyMetrics,
      topProducts,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Metrics sync error:', error);
    return res.status(500).json({ error: 'Failed to sync metrics' });
  }
}

/**
 * GET - Get cached metrics without syncing
 */
async function handleGetMetrics(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user has TikTok connection
    const { data: connection } = await supabase
      .from('tiktok_connections')
      .select('id, tiktok_username, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return res.status(200).json({
        connected: false,
        needsConnection: true,
      });
    }

    const dateRange = getDateRange();
    const summary = await calculateSummary(user.id, dateRange);
    const dailyMetrics = await getDailyMetrics(user.id, dateRange);
    const topProducts = await getTopProducts(user.id);

    // Get last sync time
    const { data: lastSync } = await supabaseAdmin
      .from('creator_performance_metrics')
      .select('synced_from_tiktok_at')
      .eq('user_id', user.id)
      .order('synced_from_tiktok_at', { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      connected: true,
      summary,
      dailyMetrics,
      topProducts,
      lastSyncedAt: lastSync?.synced_from_tiktok_at || null,
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    return res.status(500).json({ error: 'Failed to get metrics' });
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      return handleGetMetrics(req, res);
    case 'POST':
      return handleSyncMetrics(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
