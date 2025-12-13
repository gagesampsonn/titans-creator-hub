/**
 * POST /api/tiktok/disconnect
 * 
 * Disconnects/unlinks a user's TikTok account.
 * Marks the connection as inactive (soft delete for audit trail).
 * 
 * SECURITY:
 * - Validates user authentication via Supabase JWT
 * - Only allows users to disconnect their own accounts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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
    // Soft delete - mark as inactive
    const { error: updateError } = await supabaseAdmin
      .from('tiktok_connections')
      .update({ 
        is_active: false,
        // Clear sensitive tokens
        access_token: '[REVOKED]',
        refresh_token: '[REVOKED]',
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (updateError) {
      console.error('Disconnect error:', updateError);
      return res.status(500).json({ error: 'Failed to disconnect' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'TikTok account disconnected' 
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    return res.status(500).json({ error: 'Failed to disconnect' });
  }
}
