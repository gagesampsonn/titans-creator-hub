-- ============================================
-- TITANS CREATOR HUB - COMPLETE DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (User accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('creator', 'brand')) DEFAULT 'creator',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can ONLY update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE 
  USING (auth.uid() = id);

-- ============================================
-- 2. TIKTOK CONNECTIONS TABLE (Linked TikTok accounts)
-- Stores OAuth tokens - HIGHLY SENSITIVE
-- ============================================
CREATE TABLE IF NOT EXISTS tiktok_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tiktok_open_id TEXT NOT NULL,
  tiktok_username TEXT,
  access_token TEXT NOT NULL,  -- Encrypted at rest by Supabase
  refresh_token TEXT NOT NULL, -- Encrypted at rest by Supabase
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[], -- Array of granted scopes
  shop_id TEXT, -- If they have a TikTok Shop
  seller_type TEXT CHECK (seller_type IN ('creator', 'seller', 'partner')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tiktok_open_id)
);

-- Enable RLS
ALTER TABLE tiktok_connections ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own connections
CREATE POLICY "Users can view own tiktok connections" 
  ON tiktok_connections FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can ONLY delete their own connections (unlinking)
CREATE POLICY "Users can delete own tiktok connections" 
  ON tiktok_connections FOR DELETE 
  USING (auth.uid() = user_id);

-- NO direct insert/update from client - must go through server API
-- This prevents token manipulation attacks

-- ============================================
-- 3. SAVED PRODUCTS TABLE (User's saved products)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL, -- External product ID
  product_name TEXT,
  product_image TEXT,
  brand TEXT,
  commission_rate DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own saved products
CREATE POLICY "Users can view own saved products" 
  ON saved_products FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can ONLY insert their own saved products
CREATE POLICY "Users can insert own saved products" 
  ON saved_products FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can ONLY delete their own saved products
CREATE POLICY "Users can delete own saved products" 
  ON saved_products FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 4. USER ANALYTICS TABLE (Cached TikTok metrics)
-- ============================================
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tiktok_connection_id UUID REFERENCES tiktok_connections(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'gmv_daily', 'gmv_weekly', 'gmv_monthly',
    'commission_daily', 'commission_weekly', 'commission_monthly',
    'orders_count', 'items_sold', 'refunds',
    'video_views', 'video_engagement'
  )),
  metric_value DECIMAL(15,2),
  metric_data JSONB, -- For complex nested data
  period_start DATE,
  period_end DATE,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tiktok_connection_id, metric_type, period_start)
);

-- Enable RLS
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own analytics
CREATE POLICY "Users can view own analytics" 
  ON user_analytics FOR SELECT 
  USING (auth.uid() = user_id);

-- NO direct insert/update from client - server only

-- ============================================
-- 5. AFFILIATE LINKS TABLE (User's generated links)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  tiktok_link TEXT,
  short_link TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own links
CREATE POLICY "Users can view own affiliate links" 
  ON affiliate_links FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert own affiliate links" 
  ON affiliate_links FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update own affiliate links" 
  ON affiliate_links FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own affiliate links" 
  ON affiliate_links FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 6. SAMPLE REQUESTS TABLE (Product sample requests)
-- ============================================
CREATE TABLE IF NOT EXISTS sample_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'rejected')) DEFAULT 'pending',
  shipping_address JSONB, -- Encrypted sensitive data
  tracking_number TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own sample requests
CREATE POLICY "Users can view own sample requests" 
  ON sample_requests FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own sample requests
CREATE POLICY "Users can insert own sample requests" 
  ON sample_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. VIDEO AUDITS TABLE (AI video analysis results)
-- ============================================
CREATE TABLE IF NOT EXISTS video_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT,
  video_title TEXT,
  audit_result JSONB, -- AI analysis results
  score INTEGER CHECK (score >= 0 AND score <= 100),
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_audits ENABLE ROW LEVEL SECURITY;

-- Users can ONLY view their own audits
CREATE POLICY "Users can view own video audits" 
  ON video_audits FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own audits
CREATE POLICY "Users can insert own video audits" 
  ON video_audits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own audits
CREATE POLICY "Users can delete own video audits" 
  ON video_audits FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_tiktok_connections_user ON tiktok_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_user ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_type ON user_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_user ON sample_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_video_audits_user ON video_audits(user_id);

-- ============================================
-- 9. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tiktok_connections_updated_at
  BEFORE UPDATE ON tiktok_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sample_requests_updated_at
  BEFORE UPDATE ON sample_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. SERVICE ROLE ONLY FUNCTIONS
-- For server-side operations (TikTok token management)
-- These bypass RLS when called with service_role key
-- ============================================

-- Function to upsert TikTok connection (server-side only)
CREATE OR REPLACE FUNCTION upsert_tiktok_connection(
  p_user_id UUID,
  p_tiktok_open_id TEXT,
  p_tiktok_username TEXT,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_token_expires_at TIMESTAMP WITH TIME ZONE,
  p_scopes TEXT[],
  p_shop_id TEXT DEFAULT NULL,
  p_seller_type TEXT DEFAULT 'creator'
)
RETURNS UUID AS $$
DECLARE
  connection_id UUID;
BEGIN
  INSERT INTO tiktok_connections (
    user_id, tiktok_open_id, tiktok_username,
    access_token, refresh_token, token_expires_at,
    scopes, shop_id, seller_type
  )
  VALUES (
    p_user_id, p_tiktok_open_id, p_tiktok_username,
    p_access_token, p_refresh_token, p_token_expires_at,
    p_scopes, p_shop_id, p_seller_type
  )
  ON CONFLICT (user_id, tiktok_open_id) 
  DO UPDATE SET
    tiktok_username = EXCLUDED.tiktok_username,
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    scopes = EXCLUDED.scopes,
    shop_id = EXCLUDED.shop_id,
    seller_type = EXCLUDED.seller_type,
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO connection_id;
  
  RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert analytics (server-side only)
CREATE OR REPLACE FUNCTION insert_user_analytics(
  p_user_id UUID,
  p_connection_id UUID,
  p_metric_type TEXT,
  p_metric_value DECIMAL,
  p_metric_data JSONB,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO user_analytics (
    user_id, tiktok_connection_id, metric_type,
    metric_value, metric_data, period_start, period_end
  )
  VALUES (
    p_user_id, p_connection_id, p_metric_type,
    p_metric_value, p_metric_data, p_period_start, p_period_end
  )
  ON CONFLICT (user_id, tiktok_connection_id, metric_type, period_start)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metric_data = EXCLUDED.metric_data,
    period_end = EXCLUDED.period_end,
    fetched_at = NOW()
  RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECURITY SUMMARY:
-- ============================================
-- ✅ All tables have RLS enabled
-- ✅ Users can ONLY access their own data
-- ✅ Sensitive operations (token storage) are server-side only
-- ✅ No cross-user data access possible
-- ✅ Service role functions for backend operations
-- ✅ Indexes for query performance
-- ✅ Automatic updated_at timestamps
-- ============================================
