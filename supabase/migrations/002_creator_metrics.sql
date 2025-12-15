-- ============================================
-- MANUAL METRICS IMPORT SYSTEM
-- This migration adds:
-- 1. tiktok_handle column to profiles
-- 2. creator_daily_metrics table for imported data
-- ============================================

-- ============================================
-- 1. ADD tiktok_handle TO PROFILES
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT UNIQUE;

-- Add display_name if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Index for handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok_handle ON profiles(tiktok_handle);

-- ============================================
-- 2. CREATOR DAILY METRICS TABLE
-- Stores metrics imported from TikTok Partner Center CSV/XLSX exports
-- ============================================
CREATE TABLE IF NOT EXISTS creator_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Handle is the primary identifier (normalized lowercase, no @)
  tiktok_handle TEXT NOT NULL,
  
  -- Date of the metrics
  date DATE NOT NULL,
  
  -- Core metrics from TikTok Partner Center export
  affiliate_gmv NUMERIC DEFAULT 0,           -- "Affiliate GMV"
  items_sold INTEGER DEFAULT 0,              -- "Items sold"
  est_commission NUMERIC DEFAULT 0,          -- "Est. commission"
  commission_base NUMERIC DEFAULT 0,         -- "Commission base"
  
  -- Video performance metrics
  video_ctr NUMERIC DEFAULT 0,               -- "Video CTR"
  video_ctor NUMERIC DEFAULT 0,              -- "Video CTOR"
  video_rpm NUMERIC DEFAULT 0,               -- "Video RPM"
  
  -- Live performance metrics
  live_ctr NUMERIC DEFAULT 0,                -- "LIVE CTR"
  live_rpm NUMERIC DEFAULT 0,                -- "LIVE RPM"
  
  -- Additional metrics (optional in export)
  orders INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  
  -- Import metadata
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,                         -- filename or source identifier
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries per handle/date
  UNIQUE(tiktok_handle, date)
);

-- Enable RLS
ALTER TABLE creator_daily_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can view their own metrics (match handle from their profile)
CREATE POLICY "Users can view own metrics via handle" 
  ON creator_daily_metrics FOR SELECT 
  USING (
    tiktok_handle = (
      SELECT tiktok_handle FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin policy: Allow admins to view all metrics
-- Note: Service role bypasses RLS, but this is for admin users
CREATE POLICY "Admins can view all metrics"
  ON creator_daily_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND email IN ('gagesampson2016@gmail.com')
    )
  );

-- Only service role can insert (enforced by using service_role key in API)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_creator_metrics_handle ON creator_daily_metrics(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_date ON creator_daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_handle_date ON creator_daily_metrics(tiktok_handle, date DESC);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE TRIGGER update_creator_daily_metrics_updated_at
  BEFORE UPDATE ON creator_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Normalize TikTok handle
-- Removes @ prefix, converts to lowercase
-- ============================================
CREATE OR REPLACE FUNCTION normalize_tiktok_handle(handle TEXT)
RETURNS TEXT AS $$
BEGIN
  IF handle IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove @ prefix if present, lowercase, trim whitespace
  RETURN LOWER(TRIM(REGEXP_REPLACE(handle, '^@', '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Upsert daily metrics (for import API)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_creator_daily_metrics(
  p_tiktok_handle TEXT,
  p_date DATE,
  p_affiliate_gmv NUMERIC DEFAULT 0,
  p_items_sold INTEGER DEFAULT 0,
  p_est_commission NUMERIC DEFAULT 0,
  p_commission_base NUMERIC DEFAULT 0,
  p_video_ctr NUMERIC DEFAULT 0,
  p_video_ctor NUMERIC DEFAULT 0,
  p_video_rpm NUMERIC DEFAULT 0,
  p_live_ctr NUMERIC DEFAULT 0,
  p_live_rpm NUMERIC DEFAULT 0,
  p_orders INTEGER DEFAULT 0,
  p_video_views INTEGER DEFAULT 0,
  p_import_source TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_normalized_handle TEXT;
  v_metric_id UUID;
BEGIN
  -- Normalize the handle
  v_normalized_handle := normalize_tiktok_handle(p_tiktok_handle);
  
  IF v_normalized_handle IS NULL OR v_normalized_handle = '' THEN
    RAISE EXCEPTION 'Invalid tiktok_handle';
  END IF;
  
  INSERT INTO creator_daily_metrics (
    tiktok_handle, date,
    affiliate_gmv, items_sold, est_commission, commission_base,
    video_ctr, video_ctor, video_rpm,
    live_ctr, live_rpm,
    orders, video_views,
    import_source
  )
  VALUES (
    v_normalized_handle, p_date,
    COALESCE(p_affiliate_gmv, 0), COALESCE(p_items_sold, 0), 
    COALESCE(p_est_commission, 0), COALESCE(p_commission_base, 0),
    COALESCE(p_video_ctr, 0), COALESCE(p_video_ctor, 0), COALESCE(p_video_rpm, 0),
    COALESCE(p_live_ctr, 0), COALESCE(p_live_rpm, 0),
    COALESCE(p_orders, 0), COALESCE(p_video_views, 0),
    p_import_source
  )
  ON CONFLICT (tiktok_handle, date)
  DO UPDATE SET
    affiliate_gmv = EXCLUDED.affiliate_gmv,
    items_sold = EXCLUDED.items_sold,
    est_commission = EXCLUDED.est_commission,
    commission_base = EXCLUDED.commission_base,
    video_ctr = EXCLUDED.video_ctr,
    video_ctor = EXCLUDED.video_ctor,
    video_rpm = EXCLUDED.video_rpm,
    live_ctr = EXCLUDED.live_ctr,
    live_rpm = EXCLUDED.live_rpm,
    orders = EXCLUDED.orders,
    video_views = EXCLUDED.video_views,
    import_source = EXCLUDED.import_source,
    updated_at = NOW()
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES
-- ============================================
-- The import workflow:
-- 1. Admin uploads CSV/XLSX from TikTok Partner Center
-- 2. API parses file, maps columns to metrics
-- 3. Each row is upserted via upsert_creator_daily_metrics()
-- 4. Dashboard queries creator_daily_metrics for logged-in user's handle
--
-- Handle normalization:
-- - Always stored lowercase without @
-- - @levivideosdeals → levivideosdeals
-- - LEVIVIDEOSDEALS → levivideosdeals
-- ============================================
