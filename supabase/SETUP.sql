-- ============================================
-- TITANS CREATOR HUB - ONE-TIME DATABASE SETUP
-- ============================================
-- 
-- Run this ENTIRE script in Supabase SQL Editor:
-- 1. Go to: supabase.com → Your Project → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- This creates all tables needed for the creator dashboard.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================

-- ============================================
-- HELPER FUNCTION: updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 1. PROFILES TABLE (User accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('creator', 'brand')) DEFAULT 'creator',
  avatar_url TEXT,
  tiktok_handle TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tiktok_handle if table already exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_handle TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE 
  USING (auth.uid() = id);

-- ============================================
-- 2. LINKED CREATORS TABLE
-- Stores TikTok handles confirmed linked to agency
-- ============================================
CREATE TABLE IF NOT EXISTS linked_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE linked_creators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view linked creators" ON linked_creators;

CREATE POLICY "Authenticated users can view linked creators"
  ON linked_creators FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. CREATOR DAILY METRICS TABLE
-- Stores metrics imported from TikTok Partner Center
-- ============================================
CREATE TABLE IF NOT EXISTS creator_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  date DATE NOT NULL,
  affiliate_gmv NUMERIC DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  est_commission NUMERIC DEFAULT 0,
  commission_base NUMERIC DEFAULT 0,
  video_ctr NUMERIC DEFAULT 0,
  video_ctor NUMERIC DEFAULT 0,
  video_rpm NUMERIC DEFAULT 0,
  live_ctr NUMERIC DEFAULT 0,
  live_rpm NUMERIC DEFAULT 0,
  orders INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tiktok_handle, date)
);

-- Enable RLS
ALTER TABLE creator_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own metrics via handle" ON creator_daily_metrics;
DROP POLICY IF EXISTS "Admins can view all metrics" ON creator_daily_metrics;

CREATE POLICY "Users can view own metrics via handle" 
  ON creator_daily_metrics FOR SELECT 
  USING (
    tiktok_handle = (
      SELECT tiktok_handle FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin policy (add your email here!)
CREATE POLICY "Admins can view all metrics"
  ON creator_daily_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND email IN ('gagesampson2016@gmail.com')
    )
  );

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok_handle ON profiles(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_linked_creators_handle ON linked_creators(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_linked_creators_status ON linked_creators(status);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_handle ON creator_daily_metrics(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_date ON creator_daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_handle_date ON creator_daily_metrics(tiktok_handle, date DESC);

-- ============================================
-- 5. TRIGGERS FOR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_linked_creators_updated_at ON linked_creators;
CREATE TRIGGER update_linked_creators_updated_at
  BEFORE UPDATE ON linked_creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creator_daily_metrics_updated_at ON creator_daily_metrics;
CREATE TRIGGER update_creator_daily_metrics_updated_at
  BEFORE UPDATE ON creator_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. HELPER FUNCTION: Normalize TikTok handle
-- ============================================
CREATE OR REPLACE FUNCTION normalize_tiktok_handle(handle TEXT)
RETURNS TEXT AS $$
BEGIN
  IF handle IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN LOWER(TRIM(REGEXP_REPLACE(handle, '^@', '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- DONE! 
-- ============================================
-- Your database is now set up.
--
-- Next steps:
-- 1. Add your linked creators via Admin UI or SQL:
--    INSERT INTO linked_creators (tiktok_handle, display_name) VALUES
--      ('creator1', 'Creator One'),
--      ('creator2', 'Creator Two');
--
-- 2. Deploy to Vercel with environment variables:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
-- ============================================
