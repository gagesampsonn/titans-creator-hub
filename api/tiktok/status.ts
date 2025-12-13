/**
 * GET /api/tiktok/status
 * 
 * Checks if the user has a connected TikTok account.
 * Returns connection status without exposing sensitive tokens.
 * 
 * SECURITY:
 * - Validates user authentication via Supabase JWT
 * - Never exposes access/refresh tokens
 * - Only returns safe metadata
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Get connection status - RLS ensures user can only see their own
    const { data: connection, error: connectionError } = await supabase
      .from('tiktok_connections')
      .select('id, tiktok_username, tiktok_open_id, seller_type, shop_id, is_active, created_at, token_expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return res.status(200).json({ 
        connected: false,
        message: 'No TikTok account connected'
      });
    }

    // Check token expiration
    const tokenExpired = new Date(connection.token_expires_at) < new Date();

    return res.status(200).json({
      connected: true,
      needsReauth: tokenExpired,
      username: connection.tiktok_username,
      sellerType: connection.seller_type,
      hasShop: !!connection.shop_id,
      connectedAt: connection.created_at,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
}
