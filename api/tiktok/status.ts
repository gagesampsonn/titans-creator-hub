import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * TikTok Connection Status
 * 
 * GET /api/tiktok/status
 * 
 * Returns the current TikTok connection status for the authenticated user.
 * Requires Bearer token authentication.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's TikTok connection
    const { data: connection, error: dbError } = await supabase
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[TikTok Status] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to check connection status' });
    }

    if (!connection) {
      return res.status(200).json({
        connected: false,
        needsReauth: false,
      } as TikTokStatus);
    }

    // Check if token is expired or about to expire (within 1 hour)
    const tokenExpiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const needsReauth = tokenExpiresAt < oneHourFromNow;

    const status: TikTokStatus = {
      connected: true,
      needsReauth,
      username: connection.tiktok_username || undefined,
      sellerType: connection.seller_type || undefined,
      hasShop: !!connection.shop_id,
      connectedAt: connection.created_at,
      expiresAt: connection.token_expires_at,
      scopes: connection.scopes || [],
    };

    return res.status(200).json(status);

  } catch (error) {
    console.error('[TikTok Status] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to check TikTok status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
