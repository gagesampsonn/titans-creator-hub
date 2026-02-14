/**
 * GET /api/top-videos/public
 * 
 * Public endpoint to fetch top 20 videos for the billboard
 * No authentication required - accessible to everyone
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
  const maxRequests = 120; // Higher limit for public endpoint
  
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 120 requests per minute (public endpoint)
  if (applyRateLimit(req, res, 'top-videos-public')) return;

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get the most recent top 20 videos (by date_end DESC, then rank ASC)
    const { data: videos, error: videosError } = await client
      .from('creator_top_videos')
      .select('*')
      .order('date_end', { ascending: false })
      .order('rank', { ascending: true })
      .limit(20);

    if (videosError) {
      console.error('Top videos fetch error:', videosError);
      return res.status(500).json({ error: 'Failed to fetch top videos' });
    }

    if (!videos || videos.length === 0) {
      return res.json({ 
        hasVideos: false, 
        videos: [],
        dateRange: null
      });
    }

    // Get date range from the first video (they should all have the same range)
    const dateRange = videos[0] ? {
      start: videos[0].date_start,
      end: videos[0].date_end
    } : null;

    // Format response
    const formattedVideos = videos.map(v => ({
      id: v.id,
      rank: v.rank,
      handle: v.tiktok_handle,
      videoId: v.video_id,
      videoName: v.video_name,
      revenue: Number(v.revenue),
      comparePct: Number(v.compare_pct),
      contributionPct: Number(v.contribution_pct)
    }));

    return res.json({
      hasVideos: true,
      dateRange,
      videos: formattedVideos
    });

  } catch (err: any) {
    console.error('Public top videos API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

