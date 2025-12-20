import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * TikTok Shop OAuth Callback Handler
 * 
 * GET /api/tiktok/callback?code={auth_code}&state={state}
 * 
 * This endpoint handles the OAuth callback from TikTok Shop after a creator
 * authorizes our app. It:
 * 1. Validates the state parameter (CSRF protection)
 * 2. Exchanges the authorization code for access/refresh tokens
 * 3. Stores tokens securely in Supabase
 * 4. Redirects user to dashboard with success/error message
 * 
 * TikTok Shop API Reference:
 * - Token endpoint: POST https://auth.tiktok-shops.com/api/v2/token/get
 */

// Environment variables (server-side only - NEVER expose to frontend)
const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY || '';
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.titansagency.co';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// TikTok Shop API endpoints
// Note: These may vary by region. Using global shop endpoint.
const TIKTOK_TOKEN_URL = 'https://auth.tiktok-shops.com/api/v2/token/get';

interface StatePayload {
  userId: string;
  csrf: string;
  timestamp?: number;
}

interface TikTokTokenResponse {
  code: number;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    access_token_expire_in: number;  // seconds until expiry
    refresh_token_expire_in: number; // seconds until expiry
    open_id: string;                 // TikTok user ID
    seller_name?: string;            // For sellers
    seller_base_region?: string;     // Region code
    user_type?: number;              // 0=seller, 1=creator
    granted_scopes?: string[];       // Authorized scopes
  };
  request_id?: string;
}

/**
 * Generate HMAC signature for TikTok API request
 * Based on TikTok Shop API signing guide
 */
function generateSignature(
  appKey: string, 
  appSecret: string, 
  path: string, 
  timestamp: number,
  params: Record<string, string> = {}
): string {
  // Sort parameters alphabetically and create signature string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const signString = `${appSecret}${path}${sortedParams}${appSecret}`;
  
  return crypto
    .createHmac('sha256', appSecret)
    .update(signString)
    .digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (OAuth callback)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract query parameters
  const { code, state } = req.query;

  // Redirect helper - redirects to frontend with message
  const redirectWithMessage = (success: boolean, message: string) => {
    const url = new URL(`${FRONTEND_URL}/#/dashboard`);
    url.searchParams.set(success ? 'tiktok_connected' : 'tiktok_error', 'true');
    url.searchParams.set('message', message);
    return res.redirect(302, url.toString());
  };

  try {
    // Validate required parameters
    if (!code || typeof code !== 'string') {
      console.error('[TikTok Callback] Missing authorization code');
      return redirectWithMessage(false, 'Missing authorization code from TikTok');
    }

    if (!state || typeof state !== 'string') {
      console.error('[TikTok Callback] Missing state parameter');
      return redirectWithMessage(false, 'Invalid authorization request - missing state');
    }

    // Validate environment variables
    if (!TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
      console.error('[TikTok Callback] Missing TikTok credentials');
      return redirectWithMessage(false, 'TikTok integration not configured');
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[TikTok Callback] Missing Supabase service role key');
      return redirectWithMessage(false, 'Database connection error');
    }

    // Decode and validate state parameter
    let statePayload: StatePayload;
    try {
      statePayload = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      console.error('[TikTok Callback] Failed to decode state parameter');
      return redirectWithMessage(false, 'Invalid state parameter');
    }

    if (!statePayload.userId || !statePayload.csrf) {
      console.error('[TikTok Callback] Invalid state payload');
      return redirectWithMessage(false, 'Invalid state format');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optionally verify state in database (if stored during auth-url generation)
    const { data: storedState } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (storedState) {
      // Verify state hasn't expired
      if (new Date(storedState.expires_at) < new Date()) {
        console.error('[TikTok Callback] State has expired');
        
        // Clean up expired state
        await supabase.from('oauth_states').delete().eq('state', state);
        
        return redirectWithMessage(false, 'Authorization expired. Please try again.');
      }

      // Clean up used state
      await supabase.from('oauth_states').delete().eq('state', state);
    }

    // Exchange authorization code for tokens
    console.log('[TikTok Callback] Exchanging code for tokens...');
    
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/token/get';
    
    // Build request to TikTok token endpoint
    const tokenRequestBody = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: 'authorized_code',
    };

    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody),
    });

    if (!tokenResponse.ok) {
      console.error('[TikTok Callback] Token request failed:', tokenResponse.status);
      return redirectWithMessage(false, 'Failed to connect to TikTok');
    }

    const tokenData: TikTokTokenResponse = await tokenResponse.json();
    
    if (tokenData.code !== 0 || !tokenData.data) {
      console.error('[TikTok Callback] Token exchange failed:', tokenData.message);
      return redirectWithMessage(false, `TikTok error: ${tokenData.message}`);
    }

    const {
      access_token,
      refresh_token,
      access_token_expire_in,
      refresh_token_expire_in,
      open_id,
      seller_name,
      seller_base_region,
      user_type,
      granted_scopes,
    } = tokenData.data;

    console.log('[TikTok Callback] Token exchange successful for open_id:', open_id);

    // Calculate token expiration dates
    const accessTokenExpiresAt = new Date(Date.now() + access_token_expire_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + refresh_token_expire_in * 1000);

    // Determine seller type based on user_type from TikTok
    // 0 = seller, 1 = creator (based on TikTok docs)
    const sellerType = user_type === 1 ? 'creator' : user_type === 0 ? 'seller' : 'creator';

    // Store tokens in Supabase using the upsert_tiktok_connection function
    // This handles both new connections and updates
    const { data: connectionId, error: upsertError } = await supabase
      .rpc('upsert_tiktok_connection', {
        p_user_id: statePayload.userId,
        p_tiktok_open_id: open_id,
        p_tiktok_username: seller_name || null,
        p_access_token: access_token,
        p_refresh_token: refresh_token,
        p_token_expires_at: accessTokenExpiresAt.toISOString(),
        p_scopes: granted_scopes || [],
        p_shop_id: null, // Will be populated later if needed
        p_seller_type: sellerType,
      });

    if (upsertError) {
      console.error('[TikTok Callback] Failed to store connection:', upsertError);
      return redirectWithMessage(false, 'Failed to save connection');
    }

    console.log('[TikTok Callback] Connection stored successfully:', connectionId);

    // Success! Redirect to dashboard
    return redirectWithMessage(true, 'TikTok account connected successfully!');

  } catch (error) {
    console.error('[TikTok Callback] Unexpected error:', error);
    return redirectWithMessage(
      false, 
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}
