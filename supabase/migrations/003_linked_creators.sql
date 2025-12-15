-- ============================================
-- LINKED CREATORS TABLE
-- Stores TikTok handles that are confirmed linked to the agency
-- This allows showing "waiting for data" vs "not linked" messages
-- ============================================

-- ============================================
-- 1. LINKED CREATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS linked_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The TikTok handle (normalized: lowercase, no @)
  tiktok_handle TEXT UNIQUE NOT NULL,
  
  -- Optional display name for admin reference
  display_name TEXT,
  
  -- Optional notes (e.g., "Top performer", "New creator Dec 2024")
  notes TEXT,
  
  -- Status of the creator's link
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  
  -- When they were linked to the agency
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE linked_creators ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Anyone authenticated can check if a handle is linked (needed for dashboard)
CREATE POLICY "Authenticated users can view linked creators"
  ON linked_creators FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage linked creators (INSERT/UPDATE/DELETE via service role)
-- Service role bypasses RLS, so no explicit policy needed for admin operations

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_linked_creators_handle ON linked_creators(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_linked_creators_status ON linked_creators(status);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE TRIGGER update_linked_creators_updated_at
  BEFORE UPDATE ON linked_creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Add your 40 linked creators here
-- Replace these examples with your actual creator handles
-- ============================================
-- To add creators, run:
-- INSERT INTO linked_creators (tiktok_handle, display_name) VALUES
--   ('creator1', 'Creator One'),
--   ('creator2', 'Creator Two'),
--   ...
-- ON CONFLICT (tiktok_handle) DO NOTHING;
