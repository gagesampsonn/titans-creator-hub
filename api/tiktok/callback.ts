/**
 * GET /api/tiktok/callback
 * 
 * TikTok OAuth callback handler.
 * This endpoint receives the authorization code from TikTok
 * and exchanges it for access/refresh tokens.
 * 
 * SECURITY: This is where the App Secret is used - SERVER SIDE ONLY.
 * Tokens are stored securely in Supabase, never sent to the client.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// TikTok token endpoint
const TIKTOK_TOKEN_URL = 'https://auth.tiktok-shops.com/api/v2/token/get';

// Initialize Supabase with SERVICE ROLE key (bypasses RLS for secure writes)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TikTokTokenResponse {
  code: number;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    access_token_expire_in: number;
    refresh_token_expire_in: number;
    open_id: string;
    seller_name?: string;
    seller_base_region?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;

  // Validate required parameters
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'State parameter required' });
  }

  // Parse state - should contain user_id and CSRF token
  let stateData: { userId: string; csrf: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  } catch {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  const { userId } = stateData;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found in state' });
  }

  // Get secrets from environment (NEVER exposed to client)
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!appKey || !appSecret) {
    console.error('Missing TikTok credentials');
    return res.status(500).json({ error: 'TikTok integration not configured' });
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        auth_code: code,
        grant_type: 'authorized_code',
      }),
    });

    const tokenData: TikTokTokenResponse = await tokenResponse.json();

    if (tokenData.code !== 0 || !tokenData.data) {
      console.error('TikTok token error:', tokenData.message);
      return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?error=tiktok_auth_failed`);
    }

    const {
      access_token,
      refresh_token,
      access_token_expire_in,
      open_id,
      seller_name,
    } = tokenData.data;

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + access_token_expire_in * 1000);

    // Store tokens securely in Supabase using service role (bypasses RLS)
    const { error: dbError } = await supabaseAdmin.rpc('upsert_tiktok_connection', {
      p_user_id: userId,
      p_tiktok_open_id: open_id,
      p_tiktok_username: seller_name || null,
      p_access_token: access_token,
      p_refresh_token: refresh_token,
      p_token_expires_at: tokenExpiresAt.toISOString(),
      p_scopes: ['user.info.basic', 'shop.affiliate', 'shop.order', 'shop.product', 'analytics.read'],
      p_shop_id: null,
      p_seller_type: 'creator',
    });

    if (dbError) {
      console.error('Database error storing tokens:', dbError);
      return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?error=db_error`);
    }

    // Redirect back to dashboard with success
    return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?tiktok=connected`);

  } catch (error) {
    console.error('TikTok callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?error=unknown`);
  }
}
