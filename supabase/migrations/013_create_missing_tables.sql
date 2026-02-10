-- ============================================
-- Create tables that are missing from the database
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. link_requests table (for sample/link request tracking)
CREATE TABLE IF NOT EXISTS link_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT UNIQUE NOT NULL,
  user_email TEXT,
  note TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can create link requests"
  ON link_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can view own requests"
  ON link_requests FOR SELECT
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_link_requests_handle ON link_requests(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);
CREATE INDEX IF NOT EXISTS idx_link_requests_created ON link_requests(created_at DESC);

-- 2. creator_top_videos table (for agency-wide top video rankings)
CREATE TABLE IF NOT EXISTS creator_top_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_name TEXT,
  revenue NUMERIC(12, 2) DEFAULT 0,
  compare_pct NUMERIC(8, 2) DEFAULT 0,
  contribution_pct NUMERIC(8, 2) DEFAULT 0,
  rank INTEGER,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  UNIQUE(video_id, date_start, date_end)
);

ALTER TABLE creator_top_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to top videos" ON creator_top_videos
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Service role can manage top videos" ON creator_top_videos
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_top_videos_handle ON creator_top_videos(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_top_videos_rank ON creator_top_videos(rank);

-- 3. creator_livestreams table (for livestream tracking)
CREATE TABLE IF NOT EXISTS creator_livestreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  livestream_room_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  livestream_name TEXT,
  revenue NUMERIC(12, 2) DEFAULT 0,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  UNIQUE(tiktok_handle, livestream_room_id, date_start, date_end)
);

ALTER TABLE creator_livestreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to livestreams" ON creator_livestreams
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Service role can manage livestreams" ON creator_livestreams
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_livestreams_handle ON creator_livestreams(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_livestreams_revenue ON creator_livestreams(revenue DESC);

