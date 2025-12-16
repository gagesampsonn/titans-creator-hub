/**
 * Execute SQL migration using Supabase Management API
 */

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_REF = 'myylgglbtroabqclzvvn';

async function runSqlQuery(sql: string) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Running Database Migration via Supabase Management API\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Migration SQL
  const migrationSql = `
-- Create creator_product_metrics table
CREATE TABLE IF NOT EXISTS creator_product_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_category TEXT,
  shop_name TEXT,
  gmv NUMERIC DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  est_commission NUMERIC DEFAULT 0,
  orders INTEGER DEFAULT 0,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tiktok_handle, product_name, date_start, date_end)
);

-- Enable RLS
ALTER TABLE creator_product_metrics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_metrics_handle ON creator_product_metrics(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_product_metrics_dates ON creator_product_metrics(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_product_metrics_gmv ON creator_product_metrics(gmv DESC);
CREATE INDEX IF NOT EXISTS idx_product_metrics_handle_gmv ON creator_product_metrics(tiktok_handle, gmv DESC);
`;

  try {
    console.log('📦 Creating creator_product_metrics table...');
    await runSqlQuery(migrationSql);
    console.log('✅ Table created successfully!\n');
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      console.log('✅ Table already exists!\n');
    } else {
      console.error('❌ Error:', err.message);
      return;
    }
  }

  // Create RLS policies
  const policiesSql = `
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own product metrics via handle" ON creator_product_metrics;
DROP POLICY IF EXISTS "Admins can view all product metrics" ON creator_product_metrics;

-- Users can view their own product metrics
CREATE POLICY "Users can view own product metrics via handle" 
  ON creator_product_metrics FOR SELECT 
  USING (
    tiktok_handle = (
      SELECT tiktok_handle FROM profiles WHERE id = auth.uid()
    )
  );

-- Admin policy
CREATE POLICY "Admins can view all product metrics"
  ON creator_product_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND email IN ('gagesampson2016@gmail.com')
    )
  );
`;

  try {
    console.log('🔒 Setting up RLS policies...');
    await runSqlQuery(policiesSql);
    console.log('✅ RLS policies created!\n');
  } catch (err: any) {
    console.log('⚠️  Policy setup:', err.message.slice(0, 100));
  }

  // Create the upsert function
  const functionSql = `
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
  v_normalized_handle := LOWER(TRIM(REGEXP_REPLACE(COALESCE(p_tiktok_handle, ''), '^@', '')));
  
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
`;

  try {
    console.log('⚙️  Creating upsert function...');
    await runSqlQuery(functionSql);
    console.log('✅ Upsert function created!\n');
  } catch (err: any) {
    console.log('⚠️  Function setup:', err.message.slice(0, 100));
  }

  // Seed linked creators
  const seedSql = `
INSERT INTO linked_creators (tiktok_handle, status) VALUES
  ('missxkenshin', 'active'),
  ('shopaholicismyname', 'active'),
  ('theebomeister', 'active'),
  ('justkeedah', 'active'),
  ('jace_rio', 'active'),
  ('kanariiskitchen', 'active'),
  ('ksdealz', 'active'),
  ('biobalancehacks', 'active'),
  ('sarasgoodfinds', 'active'),
  ('melissa.hs77', 'active'),
  ('amandabeautypanda', 'active'),
  ('mitchhod', 'active'),
  ('levidoesdeals', 'active'),
  ('ttshopl', 'active'),
  ('brittvibing', 'active'),
  ('chloevanscoder', 'active'),
  ('dealswithbrayden', 'active'),
  ('ravenvaldeskenworthy', 'active'),
  ('theshopplug_', 'active'),
  ('clicked_it_bought_it', 'active'),
  ('beachmomshopaholic', 'active'),
  ('jcshopss', 'active'),
  ('jackieboyle13', 'active'),
  ('minashopstoomuch', 'active'),
  ('contentcreatorshop', 'active'),
  ('cloverlane1111', 'active'),
  ('king_thurs', 'active'),
  ('gia00777', 'active'),
  ('faultcod', 'active'),
  ('shopwdayton', 'active'),
  ('toptikokdeals', 'active'),
  ('ravenkenworthy', 'active'),
  ('bestshopfindsz', 'active'),
  ('simplethreadss', 'active'),
  ('eduardosttshop', 'active'),
  ('sophiefleno', 'active'),
  ('tanyarecommends', 'active'),
  ('dreseaj', 'active'),
  ('findsbyzan', 'active'),
  ('justbridget5', 'active'),
  ('lindsey.stone7', 'active'),
  ('gigimonique777', 'active'),
  ('juglifts', 'active')
ON CONFLICT (tiktok_handle) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();
`;

  try {
    console.log('👤 Seeding linked creators...');
    await runSqlQuery(seedSql);
    console.log('✅ Linked creators seeded!\n');
  } catch (err: any) {
    console.log('⚠️  Seed:', err.message.slice(0, 100));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ Migration complete! Database is ready.\n');
}

main().catch(console.error);
