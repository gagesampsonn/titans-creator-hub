-- ============================================
-- CREATOR PERIOD SUMMARY TABLE
-- Stores aggregated metrics per creator with comparison to previous period
-- ============================================

CREATE TABLE IF NOT EXISTS creator_period_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Creator identifier
  tiktok_handle TEXT NOT NULL,
  
  -- Current period
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Current period metrics
  total_gmv NUMERIC DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  
  -- Comparison period
  comparison_start DATE,
  comparison_end DATE,
  
  -- Previous period metrics (for comparison)
  prev_gmv NUMERIC DEFAULT 0,
  prev_items INTEGER DEFAULT 0,
  prev_orders INTEGER DEFAULT 0,
  
  -- Pre-calculated comparison rates (percentage change)
  gmv_change_pct NUMERIC DEFAULT 0,
  items_change_pct NUMERIC DEFAULT 0,
  orders_change_pct NUMERIC DEFAULT 0,
  
  -- Metadata
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  
  -- One summary per creator per period
  UNIQUE(tiktok_handle, date_start, date_end)
);

-- Enable RLS
ALTER TABLE creator_period_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summary
CREATE POLICY "Users can view own period summary" 
  ON creator_period_summary FOR SELECT 
  USING (
    tiktok_handle = (
      SELECT tiktok_handle FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all period summaries"
  ON creator_period_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND email IN ('gagesampson2016@gmail.com')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_period_summary_handle ON creator_period_summary(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_period_summary_dates ON creator_period_summary(date_start, date_end);
