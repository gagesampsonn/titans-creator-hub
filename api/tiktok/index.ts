import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Inline rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function applyRateLimit(req: VercelRequest, res: VercelResponse, prefix: string): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 min for auth
  const maxRequests = 10;
  
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }
  record.count++;
  return false;
}

/**
 * TikTok Shop OAuth Handler (Combined)
 * 
 * GET /api/tiktok?action=auth-url&state={state}&type={creator|seller}
 * GET /api/tiktok?action=status
 * 
 * SECURITY: Rate limited to 10 requests/15min (auth endpoint)
 */

const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY || '6icca7gipvtch';
const TIKTOK_SERVICE_ID = process.env.TIKTOK_SERVICE_ID || '7583435348195739447';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.titansagency.co';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';

const SELLER_AUTH_URL = 'https://services.tiktokshops.us/open/authorize';
const CREATOR_AUTH_URL = 'https://shop.tiktok.com/alliance/creator/auth';

type OAuthType = 'creator' | 'seller';

interface StatePayload {
  userId: string;
  csrf: string;
  timestamp?: number;
  type?: OAuthType;
  returnTo?: string;
}

interface TikTokStatus {
  connected: boolean;
  needsReauth?: boolean;
  username?: string;
  sellerType?: string;
  hasShop?: boolean;
  connectedAt?: string;
  expiresAt?: string;
  scopes?: string[];
}

/**
 * Generate TikTok authorization URL
 */
async function handleAuthUrl(req: VercelRequest, res: VercelResponse) {
  const { state, type = 'creator' } = req.query;
  const oauthType: OAuthType = type === 'seller' ? 'seller' : 'creator';

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ 
      error: 'State parameter is required',
      details: 'The state parameter must be provided for CSRF protection'
    });
  }

  if (!TIKTOK_APP_KEY) {
    console.error('[TikTok Auth] Missing TIKTOK_APP_KEY');
    return res.status(500).json({ error: 'TikTok integration not configured' });
  }

  let statePayload: StatePayload;
  try {
    statePayload = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
  } catch {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  if (!statePayload.userId || !statePayload.csrf) {
    return res.status(400).json({ error: 'Invalid state format' });
  }

  // Store state in Supabase
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('oauth_states').upsert({
      state: state,
      user_id: statePayload.userId,
      csrf: statePayload.csrf,
      provider: oauthType === 'seller' ? 'tiktok_seller' : 'tiktok_creator',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }, { onConflict: 'state' });
  }

  let authUrl: URL;
  if (oauthType === 'seller') {
    authUrl = new URL(SELLER_AUTH_URL);
    authUrl.searchParams.set('service_id', TIKTOK_SERVICE_ID);
    authUrl.searchParams.set('state', state);
  } else {
    authUrl = new URL(CREATOR_AUTH_URL);
    authUrl.searchParams.set('app_key', TIKTOK_APP_KEY);
    authUrl.searchParams.set('state', state);
  }

  console.log(`[TikTok Auth] Generated ${oauthType} auth URL for user:`, statePayload.userId.slice(0, 8) + '...');

  return res.status(200).json({
    authUrl: authUrl.toString(),
    type: oauthType,
    expiresIn: 600,
  });
}

/**
 * Get TikTok connection status
 */
async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { data: connection, error: dbError } = await supabase
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to check connection status' });
  }

  if (!connection) {
    return res.status(200).json({ connected: false, needsReauth: false } as TikTokStatus);
  }

  const tokenExpiresAt = new Date(connection.token_expires_at);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const needsReauth = tokenExpiresAt < oneHourFromNow;

  return res.status(200).json({
    connected: true,
    needsReauth,
    username: connection.tiktok_username || undefined,
    sellerType: connection.seller_type || undefined,
    hasShop: !!connection.shop_id,
    connectedAt: connection.created_at,
    expiresAt: connection.token_expires_at,
    scopes: connection.scopes || [],
  } as TikTokStatus);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 10 requests per 15 min
  if (applyRateLimit(req, res, 'tiktok')) return;

  try {
    const { action } = req.query;

    if (action === 'auth-url') {
      return handleAuthUrl(req, res);
    } else if (action === 'status') {
      return handleStatus(req, res);
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "auth-url" or "status"' });
    }
  } catch (error) {
    console.error('[TikTok] Error:', error);
    return res.status(500).json({ 
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

