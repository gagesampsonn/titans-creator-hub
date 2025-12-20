-- Creator Livestreams Table
-- Stores top livestream sessions for linked creators

CREATE TABLE IF NOT EXISTS creator_livestreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  livestream_room_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  livestream_name TEXT,
  revenue NUMERIC(12, 2) DEFAULT 0,
  
  -- Date range this data covers
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  
  -- Prevent duplicates
  UNIQUE(tiktok_handle, livestream_room_id, date_start, date_end)
);

-- Index for fast lookups by creator
CREATE INDEX IF NOT EXISTS idx_livestreams_handle ON creator_livestreams(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_livestreams_revenue ON creator_livestreams(revenue DESC);

-- RLS policies
ALTER TABLE creator_livestreams ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (we'll filter by handle in the API)
CREATE POLICY "Allow read access to livestreams" ON creator_livestreams
  FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage livestreams" ON creator_livestreams
  FOR ALL USING (auth.role() = 'service_role');
