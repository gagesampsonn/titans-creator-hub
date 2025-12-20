import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * TikTok Token Refresh
 * 
 * POST /api/tiktok/refresh
 * 
 * Refreshes the TikTok access token using the refresh token.
 * This should be called when the access token is about to expire.
 * 
 * Can be called:
 * 1. Manually when user sees "needs reauth" status
 * 2. Automatically via Vercel Cron job (configured in vercel.json)
 * 3. Before making API calls that fail with token expired error
 * 
 * TikTok Shop API Reference:
 * - Refresh endpoint: POST https://auth.tiktok-shops.com/api/v2/token/refresh
 */

const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY || '';
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TIKTOK_REFRESH_URL = 'https://auth.tiktok-shops.com/api/v2/token/refresh';

interface TikTokRefreshResponse {
  code: number;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    access_token_expire_in: number;
    refresh_token_expire_in: number;
    open_id: string;
    seller_name?: string;
    granted_scopes?: string[];
  };
  request_id?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for cron job header (for scheduled refreshes)
    const isCronJob = req.headers['x-vercel-cron'] === '1';
    
    let userId: string | null = null;

    if (!isCronJob) {
      // If not a cron job, validate user authentication
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      userId = user.id;
    }

    // Validate environment
    if (!TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
      console.error('[TikTok Refresh] Missing TikTok credentials');
      return res.status(500).json({ error: 'TikTok integration not configured' });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[TikTok Refresh] Missing service role key');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build query for connections to refresh
    let query = supabaseAdmin
      .from('tiktok_connections')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      // Refresh only for specific user
      query = query.eq('user_id', userId);
    } else if (isCronJob) {
      // For cron job, refresh tokens expiring within 2 hours
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      query = query.lt('token_expires_at', twoHoursFromNow.toISOString());
    }

    const { data: connections, error: fetchError } = await query;

    if (fetchError) {
      console.error('[TikTok Refresh] Failed to fetch connections:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    if (!connections || connections.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No tokens to refresh',
        refreshed: 0,
      });
    }

    let refreshed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Refresh each connection
    for (const connection of connections) {
      try {
        console.log('[TikTok Refresh] Refreshing token for user:', connection.user_id.slice(0, 8));

        const refreshResponse = await fetch(TIKTOK_REFRESH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_key: TIKTOK_APP_KEY,
            app_secret: TIKTOK_APP_SECRET,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error(`HTTP ${refreshResponse.status}`);
        }

        const refreshData: TikTokRefreshResponse = await refreshResponse.json();

        if (refreshData.code !== 0 || !refreshData.data) {
          throw new Error(refreshData.message || 'Token refresh failed');
        }

        const {
          access_token,
          refresh_token,
          access_token_expire_in,
          open_id,
          seller_name,
          granted_scopes,
        } = refreshData.data;

        // Update the connection with new tokens
        const newExpiresAt = new Date(Date.now() + access_token_expire_in * 1000);

        const { error: updateError } = await supabaseAdmin
          .from('tiktok_connections')
          .update({
            access_token,
            refresh_token,
            token_expires_at: newExpiresAt.toISOString(),
            tiktok_username: seller_name || connection.tiktok_username,
            scopes: granted_scopes || connection.scopes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        refreshed++;
        console.log('[TikTok Refresh] Successfully refreshed token for:', open_id);

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`User ${connection.user_id.slice(0, 8)}: ${errorMsg}`);
        console.error('[TikTok Refresh] Failed to refresh for user:', connection.user_id.slice(0, 8), errorMsg);

        // If refresh token is invalid, mark connection as needing reauth
        if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
          await supabaseAdmin
            .from('tiktok_connections')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
        }
      }
    }

    return res.status(200).json({
      success: failed === 0,
      message: `Refreshed ${refreshed}/${connections.length} tokens`,
      refreshed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[TikTok Refresh] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to refresh tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
