/**
 * GET /api/profile/top-videos
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 60 requests per minute
  if (applyRateLimit(req, res, 'profile-top-videos')) return;

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }
    const token = authHeader.split(' ')[1];

    // Initialize Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's profile to find their TikTok handle
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tiktok_handle')
      .eq('id', user.id)
      .single();

    if (!profile?.tiktok_handle) {
      return res.json({ hasTopVideos: false, userVideos: [], allTopVideos: [] });
    }

    const handle = profile.tiktok_handle.toLowerCase().replace(/^@/, '');

    // Check if this creator is linked
    const { data: linked } = await supabaseAdmin
      .from('linked_creators')
      .select('id')
      .eq('tiktok_handle', handle)
      .single();

    if (!linked) {
      return res.json({ hasTopVideos: false, userVideos: [], allTopVideos: [] });
    }

    // Get ALL top 20 videos (agency-wide ranking)
    const { data: allVideos, error: videosError } = await supabaseAdmin
      .from('creator_top_videos')
      .select('*')
      .order('rank', { ascending: true })
      .limit(20);

    if (videosError) {
      console.error('Top videos fetch error:', videosError);
      return res.json({ hasTopVideos: false, userVideos: [], allTopVideos: [] });
    }

    if (!allVideos || allVideos.length === 0) {
      return res.json({ hasTopVideos: false, userVideos: [], allTopVideos: [] });
    }

    // Filter to get user's videos from the top 20
    const userVideos = allVideos.filter(v => v.tiktok_handle === handle);

    // Get date range
    const dateRange = allVideos[0] ? {
      start: allVideos[0].date_start,
      end: allVideos[0].date_end
    } : null;

    return res.json({
      hasTopVideos: true,
      dateRange,
      userVideos: userVideos.map(v => ({
        id: v.id,
        videoId: v.video_id,
        videoName: v.video_name,
        revenue: Number(v.revenue),
        comparePct: Number(v.compare_pct),
        contributionPct: Number(v.contribution_pct),
        rank: v.rank
      })),
      allTopVideos: allVideos.map(v => ({
        id: v.id,
        handle: v.tiktok_handle,
        videoId: v.video_id,
        videoName: v.video_name,
        revenue: Number(v.revenue),
        comparePct: Number(v.compare_pct),
        contributionPct: Number(v.contribution_pct),
        rank: v.rank
      }))
    });

  } catch (err: any) {
    console.error('Top videos API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
