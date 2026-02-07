import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Discord OAuth2 - Step 1: Redirect to Discord authorization
 * 
 * Discord Server ID: 1201451443031375942
 * Titans Member Role ID: 1241839380935610398
 */

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/discord/callback`
  : 'http://localhost:3000/api/auth/discord/callback';

// Production redirect
const PROD_REDIRECT_URI = 'https://titans-creator-hub.vercel.app/api/auth/discord/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DISCORD_CLIENT_ID) {
    console.error('[Discord Auth] Missing DISCORD_CLIENT_ID');
    return res.status(500).json({ error: 'Discord OAuth not configured' });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  
  // Store state in cookie for validation (expires in 10 minutes)
  res.setHeader('Set-Cookie', `discord_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  // Discord OAuth scopes needed:
  // - identify: Get basic user info
  // - email: Get user email
  // - guilds.members.read: Check role membership in the Titans server
  const scopes = ['identify', 'email', 'guilds.members.read'];
  
  // Use production redirect in production
  const redirectUri = process.env.VERCEL_ENV === 'production' 
    ? PROD_REDIRECT_URI 
    : REDIRECT_URI;

  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);
  // Add guild_id to prompt user to join if not already in server
  authUrl.searchParams.set('guild_id', '1201451443031375942');

  console.log('[Discord Auth] Redirecting to Discord OAuth');
  return res.redirect(302, authUrl.toString());
}

