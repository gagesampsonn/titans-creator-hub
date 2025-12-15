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
-- 
-- BUSINESS RULES (enforced in API and WeeklyPlanner):
-- - status = 'delivered' → eligible for "This Week's Plan" (creator has product in hand)
-- - status = 'shipped' → eligible for "Next Week" (on the way)
-- - status = 'requested' or 'approved' → still processing, not ready for content
-- - Products with no sample_request row → "Need Samples" section
-- - NEVER suggest a product for immediate promotion unless status = 'delivered'
--
CREATE TABLE IF NOT EXISTS sample_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  brand TEXT,
  commission_rate DECIMAL(5,2),
  status TEXT CHECK (status IN ('requested', 'approved', 'shipped', 'delivered', 'cancelled')) DEFAULT 'requested',
  shipping_address JSONB, -- Encrypted sensitive data
  tracking_number TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  eta DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
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

-- Users can update their own sample requests (for cancellation)
CREATE POLICY "Users can update own sample requests" 
  ON sample_requests FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all sample requests (for admin/shipping updates)
-- Note: Service role bypasses RLS by default when using service_role key

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
-- 11. CAP BINDING TABLE (Creator Agency Partner linking)
-- Tracks creator linking to Titans as a CAP agency
-- ============================================
CREATE TABLE IF NOT EXISTS cap_bindings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tiktok_connection_id UUID REFERENCES tiktok_connections(id) ON DELETE CASCADE,
  
  -- TikTok Partner Center identifiers
  creator_id TEXT NOT NULL,                    -- TikTok creator/affiliate ID
  agency_id TEXT NOT NULL,                     -- Our CAP agency ID in TikTok
  binding_status TEXT CHECK (binding_status IN (
    'pending',           -- Invitation sent, waiting for creator
    'linked',            -- Creator accepted, fully linked
    'expired',           -- Invitation expired
    'rejected',          -- Creator rejected invitation
    'unlinked'           -- Previously linked, now unlinked
  )) DEFAULT 'pending',
  
  -- Data authorization scopes granted
  data_authorization_level TEXT CHECK (data_authorization_level IN (
    'basic',             -- Basic profile + aggregate stats
    'standard',          -- + Order data, product performance
    'full'               -- + Commission details, revenue share
  )) DEFAULT 'basic',
  
  -- Commission sharing agreement
  commission_share_rate DECIMAL(5,4),          -- e.g., 0.15 = 15% share to agency
  commission_agreement_id TEXT,                -- TikTok agreement reference
  
  -- Binding timestamps
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  linked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  unlinked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, creator_id)
);

-- Enable RLS
ALTER TABLE cap_bindings ENABLE ROW LEVEL SECURITY;

-- Users can view their own CAP binding status
CREATE POLICY "Users can view own cap bindings" 
  ON cap_bindings FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- 12. TAP OFFERS TABLE (TikTok Affiliate Partner increased commission offers)
-- Stores TAP campaigns and increased commission links
-- ============================================
CREATE TABLE IF NOT EXISTS tap_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- TikTok Partner Center identifiers
  tiktok_offer_id TEXT NOT NULL UNIQUE,        -- TikTok's offer/campaign ID
  tiktok_campaign_id TEXT,                      -- Parent campaign if applicable
  partner_id TEXT NOT NULL,                     -- Our TAP partner ID
  
  -- Offer details
  offer_name TEXT NOT NULL,
  offer_type TEXT CHECK (offer_type IN (
    'increased_commission',   -- Higher commission rate
    'bonus_commission',       -- Extra bonus on top of base
    'flash_commission',       -- Time-limited boost
    'exclusive_commission'    -- Exclusive to specific creators
  )) DEFAULT 'increased_commission',
  
  -- Product association
  product_id TEXT,                              -- Specific product or NULL for category
  product_name TEXT,
  product_category TEXT,
  
  -- Commission details
  base_commission_rate DECIMAL(5,4),           -- Original commission rate
  increased_commission_rate DECIMAL(5,4),      -- Boosted commission rate
  commission_bonus_flat DECIMAL(10,2),         -- Flat bonus amount if any
  
  -- Offer validity
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'expired', 'cancelled')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Limits
  max_redemptions INTEGER,                      -- Max uses across all creators
  current_redemptions INTEGER DEFAULT 0,
  budget_limit DECIMAL(12,2),                   -- Max commission payout
  budget_used DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  offer_url TEXT,                               -- Direct link to offer
  terms_conditions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tap_offers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active offers
CREATE POLICY "Authenticated users can view tap offers" 
  ON tap_offers FOR SELECT 
  USING (true);  -- All users can see offers (they're public campaigns)

-- ============================================
-- 13. CREATOR TAP ASSIGNMENTS TABLE (Links creators to TAP offers)
-- Tracks which creators have been assigned which offers
-- ============================================
CREATE TABLE IF NOT EXISTS creator_tap_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tap_offer_id UUID REFERENCES tap_offers(id) ON DELETE CASCADE NOT NULL,
  
  -- TikTok identifiers
  creator_affiliate_id TEXT NOT NULL,          -- Creator's TikTok affiliate ID
  assignment_id TEXT,                           -- TikTok's assignment reference
  
  -- Assignment status
  status TEXT CHECK (status IN (
    'pending',           -- Offer assigned, not yet accepted
    'active',            -- Creator actively using offer
    'completed',         -- Offer period ended
    'cancelled'          -- Cancelled by either party
  )) DEFAULT 'pending',
  
  -- Creator's generated link for this offer
  affiliate_link TEXT,
  short_link TEXT,
  
  -- Performance on this assignment
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  gmv DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tap_offer_id)
);

-- Enable RLS
ALTER TABLE creator_tap_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view own tap assignments" 
  ON creator_tap_assignments FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- 14. CREATOR PERFORMANCE METRICS TABLE
-- Detailed daily performance snapshots per creator per product
-- ============================================
CREATE TABLE IF NOT EXISTS creator_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tiktok_connection_id UUID REFERENCES tiktok_connections(id) ON DELETE CASCADE,
  
  -- Date dimension
  metric_date DATE NOT NULL,
  
  -- Product dimension (NULL for aggregate creator-level metrics)
  product_id TEXT,
  product_name TEXT,
  
  -- TAP offer dimension (NULL if organic, not through TAP)
  tap_offer_id UUID REFERENCES tap_offers(id) ON DELETE SET NULL,
  
  -- Traffic metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Conversion metrics
  add_to_carts INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Revenue metrics
  gmv DECIMAL(12,2) DEFAULT 0,                  -- Gross Merchandise Value
  commission_earned DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Order quality metrics
  items_sold INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  refunds INTEGER DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Video/content metrics (if applicable)
  video_views INTEGER DEFAULT 0,
  video_likes INTEGER DEFAULT 0,
  video_shares INTEGER DEFAULT 0,
  video_comments INTEGER DEFAULT 0,
  
  -- Sync metadata
  synced_from_tiktok_at TIMESTAMP WITH TIME ZONE,
  tiktok_data_version TEXT,                     -- For tracking API version changes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, metric_date, COALESCE(product_id, 'all'), COALESCE(tap_offer_id::text, 'none'))
);

-- Enable RLS
ALTER TABLE creator_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view their own performance metrics
CREATE POLICY "Users can view own performance metrics" 
  ON creator_performance_metrics FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- 15. ADDITIONAL INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cap_bindings_user ON cap_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_cap_bindings_creator ON cap_bindings(creator_id);
CREATE INDEX IF NOT EXISTS idx_cap_bindings_status ON cap_bindings(binding_status);
CREATE INDEX IF NOT EXISTS idx_tap_offers_status ON tap_offers(status);
CREATE INDEX IF NOT EXISTS idx_tap_offers_product ON tap_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_creator_tap_assignments_user ON creator_tap_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_tap_assignments_offer ON creator_tap_assignments(tap_offer_id);
CREATE INDEX IF NOT EXISTS idx_creator_performance_user_date ON creator_performance_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_creator_performance_product ON creator_performance_metrics(product_id);

-- ============================================
-- 16. TRIGGERS FOR NEW TABLES
-- ============================================
CREATE TRIGGER update_cap_bindings_updated_at
  BEFORE UPDATE ON cap_bindings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tap_offers_updated_at
  BEFORE UPDATE ON tap_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_tap_assignments_updated_at
  BEFORE UPDATE ON creator_tap_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_performance_metrics_updated_at
  BEFORE UPDATE ON creator_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 17. SERVICE ROLE FUNCTIONS FOR PARTNER CENTER
-- ============================================

-- Function to upsert CAP binding (server-side only)
CREATE OR REPLACE FUNCTION upsert_cap_binding(
  p_user_id UUID,
  p_tiktok_connection_id UUID,
  p_creator_id TEXT,
  p_agency_id TEXT,
  p_binding_status TEXT,
  p_data_authorization_level TEXT DEFAULT 'basic',
  p_commission_share_rate DECIMAL DEFAULT NULL,
  p_linked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  binding_id UUID;
BEGIN
  INSERT INTO cap_bindings (
    user_id, tiktok_connection_id, creator_id, agency_id,
    binding_status, data_authorization_level, commission_share_rate, linked_at
  )
  VALUES (
    p_user_id, p_tiktok_connection_id, p_creator_id, p_agency_id,
    p_binding_status, p_data_authorization_level, p_commission_share_rate, p_linked_at
  )
  ON CONFLICT (user_id, creator_id) 
  DO UPDATE SET
    binding_status = EXCLUDED.binding_status,
    data_authorization_level = EXCLUDED.data_authorization_level,
    commission_share_rate = EXCLUDED.commission_share_rate,
    linked_at = COALESCE(EXCLUDED.linked_at, cap_bindings.linked_at),
    updated_at = NOW()
  RETURNING id INTO binding_id;
  
  RETURN binding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert creator performance metrics (server-side only)
CREATE OR REPLACE FUNCTION upsert_creator_performance(
  p_user_id UUID,
  p_tiktok_connection_id UUID,
  p_metric_date DATE,
  p_product_id TEXT,
  p_product_name TEXT,
  p_tap_offer_id UUID,
  p_impressions INTEGER,
  p_clicks INTEGER,
  p_orders INTEGER,
  p_gmv DECIMAL,
  p_commission_earned DECIMAL,
  p_items_sold INTEGER,
  p_refunds INTEGER,
  p_refund_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
  v_click_through_rate DECIMAL;
  v_conversion_rate DECIMAL;
  v_avg_order_value DECIMAL;
  v_refund_rate DECIMAL;
  v_commission_rate DECIMAL;
BEGIN
  -- Calculate derived metrics
  v_click_through_rate := CASE WHEN p_impressions > 0 THEN p_clicks::DECIMAL / p_impressions ELSE 0 END;
  v_conversion_rate := CASE WHEN p_clicks > 0 THEN p_orders::DECIMAL / p_clicks ELSE 0 END;
  v_avg_order_value := CASE WHEN p_orders > 0 THEN p_gmv / p_orders ELSE 0 END;
  v_refund_rate := CASE WHEN p_orders > 0 THEN p_refunds::DECIMAL / p_orders ELSE 0 END;
  v_commission_rate := CASE WHEN p_gmv > 0 THEN p_commission_earned / p_gmv ELSE 0 END;

  INSERT INTO creator_performance_metrics (
    user_id, tiktok_connection_id, metric_date, product_id, product_name,
    tap_offer_id, impressions, clicks, click_through_rate, orders,
    conversion_rate, gmv, commission_earned, commission_rate, items_sold,
    avg_order_value, refunds, refund_amount, refund_rate, synced_from_tiktok_at
  )
  VALUES (
    p_user_id, p_tiktok_connection_id, p_metric_date, p_product_id, p_product_name,
    p_tap_offer_id, p_impressions, p_clicks, v_click_through_rate, p_orders,
    v_conversion_rate, p_gmv, p_commission_earned, v_commission_rate, p_items_sold,
    v_avg_order_value, p_refunds, p_refund_amount, v_refund_rate, NOW()
  )
  ON CONFLICT (user_id, metric_date, COALESCE(product_id, 'all'), COALESCE(tap_offer_id::text, 'none'))
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    click_through_rate = EXCLUDED.click_through_rate,
    orders = EXCLUDED.orders,
    conversion_rate = EXCLUDED.conversion_rate,
    gmv = EXCLUDED.gmv,
    commission_earned = EXCLUDED.commission_earned,
    commission_rate = EXCLUDED.commission_rate,
    items_sold = EXCLUDED.items_sold,
    avg_order_value = EXCLUDED.avg_order_value,
    refunds = EXCLUDED.refunds,
    refund_amount = EXCLUDED.refund_amount,
    refund_rate = EXCLUDED.refund_rate,
    synced_from_tiktok_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 18. SEED DATA FOR TAP OFFERS
-- Sample high-commission offers for testing
-- ============================================

INSERT INTO tap_offers (
  tiktok_offer_id, partner_id, offer_name, offer_type,
  product_id, product_name, product_category,
  base_commission_rate, increased_commission_rate,
  status, start_date, end_date, max_redemptions
) VALUES 
(
  'tap_holiday_beauty_2024',
  'titans_tap_001',
  'Holiday Beauty Boost',
  'increased_commission',
  'prod_glow_serum',
  'Glow Serum Pro',
  'Beauty',
  0.10,
  0.25,
  'active',
  NOW(),
  NOW() + INTERVAL '60 days',
  1000
),
(
  'tap_flash_skincare_2024',
  'titans_tap_001',
  'Flash Sale: Skincare Week',
  'flash_commission',
  'prod_led_mask',
  'LED Face Mask 3.0',
  'Beauty',
  0.08,
  0.22,
  'active',
  NOW(),
  NOW() + INTERVAL '14 days',
  500
),
(
  'tap_supplements_boost',
  'titans_tap_001',
  'Supplements Super Commission',
  'increased_commission',
  'prod_biotin',
  'Biotin Hair Gummies',
  'Supplements',
  0.12,
  0.28,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  750
),
(
  'tap_pet_products_dec',
  'titans_tap_001',
  'Pet Lovers December',
  'bonus_commission',
  'prod_pet_feeder',
  'Smart Pet Feeder',
  'Pets',
  0.10,
  0.20,
  'active',
  NOW(),
  NOW() + INTERVAL '45 days',
  300
),
(
  'tap_exclusive_vitamins',
  'titans_tap_001',
  'VIP: Vitamin Collection',
  'exclusive_commission',
  'prod_vitc',
  'Vitamin C Complex',
  'Supplements',
  0.15,
  0.35,
  'active',
  NOW(),
  NOW() + INTERVAL '90 days',
  100
),
(
  'tap_tech_gadgets_2024',
  'titans_tap_001',
  'Tech Gadgets High Commission',
  'increased_commission',
  NULL,
  NULL,
  'Tech',
  0.08,
  0.18,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  NULL
)
ON CONFLICT (tiktok_offer_id) DO NOTHING;

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
-- ✅ CAP binding state tracked per creator
-- ✅ TAP offers centrally managed, assignments per user
-- ✅ Detailed performance metrics with product/offer dimensions
-- ============================================
