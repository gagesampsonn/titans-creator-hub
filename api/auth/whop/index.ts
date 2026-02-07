import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Whop OAuth2 - Step 1: Redirect to Whop authorization
 */

const WHOP_CLIENT_ID = process.env.WHOP_CLIENT_ID || '';
const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/whop/callback`
  : 'http://localhost:3000/api/auth/whop/callback';

// Production redirect
const PROD_REDIRECT_URI = 'https://titans-creator-hub.vercel.app/api/auth/whop/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!WHOP_CLIENT_ID) {
    console.error('[Whop Auth] Missing WHOP_CLIENT_ID');
    return res.status(500).json({ error: 'Whop OAuth not configured' });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  
  // Store state in cookie for validation (expires in 10 minutes)
  res.setHeader('Set-Cookie', `whop_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  // Use production redirect in production
  const redirectUri = process.env.VERCEL_ENV === 'production' 
    ? PROD_REDIRECT_URI 
    : REDIRECT_URI;

  // Whop OAuth URL
  const authUrl = new URL('https://whop.com/oauth');
  authUrl.searchParams.set('client_id', WHOP_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);

  console.log('[Whop Auth] Redirecting to Whop OAuth');
  return res.redirect(302, authUrl.toString());
}

