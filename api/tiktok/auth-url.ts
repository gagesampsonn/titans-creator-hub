/**
 * GET /api/tiktok/auth-url
 * 
 * Generates the TikTok OAuth authorization URL.
 * This endpoint is safe to call from the frontend - it only uses the public App Key.
 * The App Secret is NEVER exposed here.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// TikTok OAuth configuration
const TIKTOK_AUTH_URL = 'https://auth.tiktok-shops.com/oauth/authorize';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appKey = process.env.TIKTOK_APP_KEY;
  const redirectUrl = process.env.TIKTOK_REDIRECT_URL;

  if (!appKey || !redirectUrl) {
    console.error('Missing TikTok configuration');
    return res.status(500).json({ error: 'TikTok integration not configured' });
  }

  // Get the user's state token from query (for CSRF protection)
  const { state } = req.query;

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'State parameter required for security' });
  }

  // Build the authorization URL
  // Scopes for TikTok Shop Partner Center
  const scopes = [
    'user.info.basic',           // Basic user info
    'shop.affiliate',            // Affiliate data
    'shop.order',                // Order data
    'shop.product',              // Product data
    'analytics.read',            // Analytics data
  ].join(',');

  const authUrl = new URL(TIKTOK_AUTH_URL);
  authUrl.searchParams.set('app_key', appKey);
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scopes);

  return res.status(200).json({
    authUrl: authUrl.toString(),
  });
}
