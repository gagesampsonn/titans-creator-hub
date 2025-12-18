-- ============================================
-- LINK REQUESTS TABLE
-- Stores requests from creators who want to join the agency
-- ============================================

CREATE TABLE IF NOT EXISTS link_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The TikTok handle requesting to link (normalized: lowercase, no @)
  tiktok_handle TEXT UNIQUE NOT NULL,
  
  -- Email of the user who submitted the request
  user_email TEXT,
  
  -- Optional note from the creator
  note TEXT,
  
  -- Status of the request
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Admin notes (for internal use)
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE link_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can insert their own requests
CREATE POLICY "Users can create link requests"
  ON link_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON link_requests FOR SELECT
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view/update all requests (via service role)

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_link_requests_handle ON link_requests(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);
CREATE INDEX IF NOT EXISTS idx_link_requests_created ON link_requests(created_at DESC);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_link_requests_updated_at
  BEFORE UPDATE ON link_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
