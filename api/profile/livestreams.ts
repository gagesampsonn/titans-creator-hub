/**
 * GET /api/profile/livestreams
 * SECURITY: Rate limited to 60 requests/min (read-only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Inline rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function applyRateLimit(req: VercelRequest, res: VercelResponse, prefix: string): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;
  
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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 60 requests per minute
  if (applyRateLimit(req, res, 'profile-livestreams')) return;

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }
    const token = authHeader.split(' ')[1];

    // Initialize Supabase clients
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user's profile to find their TikTok handle
    const { data: profile } = await admin
      .from('profiles')
      .select('tiktok_handle')
      .eq('id', user.id)
      .single();

    if (!profile?.tiktok_handle) {
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    const handle = profile.tiktok_handle.toLowerCase().replace(/^@/, '');

    // Check if this creator is linked
    const { data: linked } = await admin
      .from('linked_creators')
      .select('id')
      .eq('tiktok_handle', handle)
      .single();

    if (!linked) {
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    // Get their livestream data (top 10 by revenue)
    const { data: livestreams, error: livestreamError } = await admin
      .from('creator_livestreams')
      .select('*')
      .eq('tiktok_handle', handle)
      .order('revenue', { ascending: false })
      .limit(10);

    if (livestreamError) {
      console.error('Livestream fetch error:', livestreamError);
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    if (!livestreams || livestreams.length === 0) {
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    // Calculate summary stats
    const totalRevenue = livestreams.reduce((sum, l) => sum + Number(l.revenue), 0);
    const totalDuration = livestreams.reduce((sum, l) => sum + l.duration_seconds, 0);
    const avgDuration = Math.round(totalDuration / livestreams.length);

    return res.json({
      hasLivestreams: true,
      summary: {
        totalStreams: livestreams.length,
        totalRevenue,
        totalDuration,
        avgDuration
      },
      dateRange: {
        start: livestreams[0]?.date_start,
        end: livestreams[0]?.date_end
      },
      livestreams: livestreams.map(l => ({
        id: l.id,
        roomId: l.livestream_room_id,
        name: l.livestream_name,
        durationSeconds: l.duration_seconds,
        revenue: Number(l.revenue)
      }))
    });

  } catch (err: any) {
    console.error('Livestreams API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
