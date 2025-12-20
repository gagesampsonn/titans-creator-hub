import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * TikTok Disconnect
 * 
 * POST /api/tiktok/disconnect
 * 
 * Disconnects the user's TikTok account by marking the connection as inactive.
 * Does not delete the record to preserve historical data.
 * Requires Bearer token authentication.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token to verify identity
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

    // Use service role to update the connection
    // RLS doesn't allow direct updates to tiktok_connections from client
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[TikTok Disconnect] Missing service role key');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Mark all active connections as inactive for this user
    const { data, error: updateError } = await supabaseAdmin
      .from('tiktok_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select('id');

    if (updateError) {
      console.error('[TikTok Disconnect] Failed to disconnect:', updateError);
      return res.status(500).json({ error: 'Failed to disconnect TikTok account' });
    }

    const disconnectedCount = data?.length || 0;
    console.log(`[TikTok Disconnect] Disconnected ${disconnectedCount} connection(s) for user:`, user.id.slice(0, 8));

    return res.status(200).json({
      success: true,
      message: 'TikTok account disconnected successfully',
      disconnectedCount,
    });

  } catch (error) {
    console.error('[TikTok Disconnect] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to disconnect TikTok',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
