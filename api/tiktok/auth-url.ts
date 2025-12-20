import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * TikTok Shop OAuth - Generate Authorization URL
 * 
 * GET /api/tiktok/auth-url?state={state}
 * 
 * Returns the TikTok Shop authorization URL for seller OAuth flow.
 * The client must generate a state parameter for CSRF protection.
 * 
 * Based on TikTok Shop Partner Center documentation:
 * https://partner.tiktokshop.com/docv2/page/650512b42f024f02be19755f
 */

// Environment variables (server-side only)
const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY || '';
const TIKTOK_SERVICE_ID = process.env.TIKTOK_SERVICE_ID || '7583435348195739447';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.titansagency.co';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// TikTok Shop OAuth endpoints
// Seller authorization URL (for local sellers in US)
const TIKTOK_AUTH_BASE_URL = 'https://services.tiktokshops.us/open/authorize';

interface StatePayload {
  userId: string;
  csrf: string;
  timestamp: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { state } = req.query;

    // Validate state parameter
    if (!state || typeof state !== 'string') {
      return res.status(400).json({ 
        error: 'State parameter is required',
        details: 'The state parameter must be provided for CSRF protection'
      });
    }

    // Validate required environment variables
    if (!TIKTOK_APP_KEY) {
      console.error('[TikTok Auth] Missing TIKTOK_APP_KEY environment variable');
      return res.status(500).json({ 
        error: 'TikTok integration not configured',
        details: 'Please contact support'
      });
    }

    // Decode and validate the state parameter
    let statePayload: StatePayload;
    try {
      statePayload = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      return res.status(400).json({ 
        error: 'Invalid state parameter',
        details: 'State must be a base64-encoded JSON object'
      });
    }

    // Validate state has required fields
    if (!statePayload.userId || !statePayload.csrf) {
      return res.status(400).json({ 
        error: 'Invalid state format',
        details: 'State must contain userId and csrf fields'
      });
    }

    // Store the state in Supabase for later verification
    // This prevents CSRF attacks by ensuring the callback state matches
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Store state with 10-minute expiration
      const { error: storeError } = await supabase
        .from('oauth_states')
        .upsert({
          state: state,
          user_id: statePayload.userId,
          csrf: statePayload.csrf,
          provider: 'tiktok_shop',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        }, {
          onConflict: 'state'
        });

      if (storeError) {
        console.warn('[TikTok Auth] Failed to store OAuth state:', storeError.message);
        // Continue anyway - we'll validate using the encoded state
      }
    }

    // Build the TikTok authorization URL
    // Format: https://services.tiktokshops.us/open/authorize?service_id={service_id}&state={state}
    const authUrl = new URL(TIKTOK_AUTH_BASE_URL);
    authUrl.searchParams.set('service_id', TIKTOK_SERVICE_ID);
    authUrl.searchParams.set('state', state);

    // Log for debugging (without sensitive data)
    console.log('[TikTok Auth] Generated auth URL for user:', statePayload.userId.slice(0, 8) + '...');

    return res.status(200).json({
      authUrl: authUrl.toString(),
      expiresIn: 600, // State valid for 10 minutes
    });

  } catch (error) {
    console.error('[TikTok Auth] Error generating auth URL:', error);
    return res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
