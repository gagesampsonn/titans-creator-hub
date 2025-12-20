import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    const handle = profile.tiktok_handle.toLowerCase().replace(/^@/, '');

    // Check if this creator is linked
    const { data: linked } = await supabaseAdmin
      .from('linked_creators')
      .select('id')
      .eq('tiktok_handle', handle)
      .single();

    if (!linked) {
      return res.json({ hasLivestreams: false, livestreams: [] });
    }

    // Get their livestream data (top 10 by revenue)
    const { data: livestreams, error: livestreamError } = await supabaseAdmin
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
