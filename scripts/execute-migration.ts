/**
 * Execute database migration directly via Supabase
 */

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

async function executeSql(sql: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Try alternative endpoint
    const altResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!altResponse.ok) {
      const text = await response.text();
      console.log(`⚠️  Direct SQL not available: ${text.slice(0, 100)}`);
      return false;
    }
  }
  
  console.log(`✅ ${description} - Done`);
  return true;
}

async function runMigration() {
  console.log('🚀 Running Database Migration\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Create the table
  const createTableSql = `
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
  `;

  // Try direct table creation via Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check if table already exists by trying to query it
  const { data, error } = await admin
    .from('creator_product_metrics')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('📦 Table does not exist yet. Creating via direct connection...\n');
    
    // Table doesn't exist - we need to create it
    // Since we can't run raw SQL, let's output instructions
    console.log('⚠️  Supabase JS client cannot create tables directly.');
    console.log('   Please run the migration SQL in Supabase Dashboard.\n');
    
    console.log('📋 Quick option: I\'ll open the Supabase SQL editor for you.');
    return false;
  } else if (error) {
    console.log(`⚠️  Error: ${error.message}`);
    return false;
  } else {
    console.log('✅ Table creator_product_metrics already exists!');
    console.log(`   Found ${data?.length || 0} existing records.\n`);
    return true;
  }
}

runMigration().then(async (exists) => {
  if (exists) {
    console.log('\n✨ Database is ready! You can now import product data.\n');
  } else {
    console.log('\n📝 Migration SQL has been prepared.');
    console.log('   Please run it in Supabase Dashboard.\n');
  }
}).catch(console.error);
