-- ============================================
-- CREATOR PRODUCT METRICS TABLE
-- Stores product-level performance data imported from TikTok Partner Center
-- Used for Top 5 Products dashboard feature
-- ============================================

-- ============================================
-- 1. CREATOR PRODUCT METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS creator_product_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Creator identifier (normalized lowercase, no @)
  tiktok_handle TEXT NOT NULL,
  
  -- Date range for the metrics
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Product information
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_category TEXT,
  shop_name TEXT,
  
  -- Performance metrics
  gmv NUMERIC DEFAULT 0,              -- Gross Merchandise Value
  items_sold INTEGER DEFAULT 0,       -- Number of items sold
  est_commission NUMERIC DEFAULT 0,   -- Estimated commission
  orders INTEGER DEFAULT 0,           -- Number of orders
  
  -- Import metadata
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,                 -- filename or source identifier
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries per handle/product/date range
  UNIQUE(tiktok_handle, product_name, date_start, date_end)
);

-- Enable RLS
ALTER TABLE creator_product_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users can view their own product metrics (match handle from their profile)
CREATE POLICY "Users can view own product metrics via handle" 
  ON creator_product_metrics FOR SELECT 
  USING (
    tiktok_handle = (
      SELECT tiktok_handle FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin policy: Allow admins to view all product metrics
CREATE POLICY "Admins can view all product metrics"
  ON creator_product_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND email IN ('gagesampson2016@gmail.com')
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_metrics_handle ON creator_product_metrics(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_product_metrics_dates ON creator_product_metrics(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_product_metrics_gmv ON creator_product_metrics(gmv DESC);
CREATE INDEX IF NOT EXISTS idx_product_metrics_handle_gmv ON creator_product_metrics(tiktok_handle, gmv DESC);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE TRIGGER update_creator_product_metrics_updated_at
  BEFORE UPDATE ON creator_product_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Upsert product metrics (for import API)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_creator_product_metrics(
  p_tiktok_handle TEXT,
  p_date_start DATE,
  p_date_end DATE,
  p_product_id TEXT,
  p_product_name TEXT,
  p_product_category TEXT,
  p_shop_name TEXT,
  p_gmv NUMERIC DEFAULT 0,
  p_items_sold INTEGER DEFAULT 0,
  p_est_commission NUMERIC DEFAULT 0,
  p_orders INTEGER DEFAULT 0,
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
  
  INSERT INTO creator_product_metrics (
    tiktok_handle, date_start, date_end,
    product_id, product_name, product_category, shop_name,
    gmv, items_sold, est_commission, orders,
    import_source
  )
  VALUES (
    v_normalized_handle, p_date_start, p_date_end,
    p_product_id, p_product_name, COALESCE(p_product_category, 'Uncategorized'), p_shop_name,
    COALESCE(p_gmv, 0), COALESCE(p_items_sold, 0), 
    COALESCE(p_est_commission, 0), COALESCE(p_orders, 0),
    p_import_source
  )
  ON CONFLICT (tiktok_handle, product_name, date_start, date_end)
  DO UPDATE SET
    product_id = EXCLUDED.product_id,
    product_category = EXCLUDED.product_category,
    shop_name = EXCLUDED.shop_name,
    gmv = EXCLUDED.gmv,
    items_sold = EXCLUDED.items_sold,
    est_commission = EXCLUDED.est_commission,
    orders = EXCLUDED.orders,
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
-- 1. Admin uploads CustomReport_Creator_Product_Shop_Product Category XLSX
-- 2. API parses file, maps columns to product metrics
-- 3. Each row is upserted via upsert_creator_product_metrics()
-- 4. Dashboard queries creator_product_metrics for logged-in user's handle
-- 5. Top 5 products by GMV are displayed (only those with GMV > 0 and items_sold > 0)
--
-- Data validation rules:
-- - Products with 0 GMV or 0 items_sold are never shown
-- - Only data within the specified date range (12/01 - 12/15) is included
-- - Creator only sees their own products (enforced by RLS)
-- ============================================
