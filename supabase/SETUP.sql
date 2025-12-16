-- ============================================
-- TITANS CREATOR HUB - DATABASE SETUP
-- Run this in Supabase SQL Editor (once)
-- ============================================

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  tiktok_handle TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok_handle TEXT UNIQUE;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- LINKED CREATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS linked_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT UNIQUE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE linked_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view linked creators" ON linked_creators;
CREATE POLICY "Anyone can view linked creators" ON linked_creators FOR SELECT USING (true);

-- ============================================
-- CREATOR DAILY METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS creator_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  date DATE NOT NULL,
  affiliate_gmv NUMERIC DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  est_commission NUMERIC DEFAULT 0,
  video_ctr NUMERIC DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tiktok_handle, date)
);

ALTER TABLE creator_daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metrics" ON creator_daily_metrics;
CREATE POLICY "Users can view own metrics" ON creator_daily_metrics FOR SELECT 
USING (tiktok_handle = (SELECT tiktok_handle FROM profiles WHERE id = auth.uid()));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_linked_handle ON linked_creators(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_metrics_handle ON creator_daily_metrics(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON creator_daily_metrics(date DESC);

-- ============================================
-- DONE!
-- ============================================
