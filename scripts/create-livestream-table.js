// Create the creator_livestreams table via direct SQL

const sql = `
CREATE TABLE IF NOT EXISTS creator_livestreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_handle TEXT NOT NULL,
  livestream_room_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  livestream_name TEXT,
  revenue NUMERIC(12, 2) DEFAULT 0,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_source TEXT,
  UNIQUE(tiktok_handle, livestream_room_id, date_start, date_end)
);

CREATE INDEX IF NOT EXISTS idx_livestreams_handle ON creator_livestreams(tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_livestreams_revenue ON creator_livestreams(revenue DESC);
`;

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

async function createTable() {
  console.log('🔧 Attempting to create creator_livestreams table...\n');

  // Method 1: Try via pg_query RPC if it exists
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (response.ok) {
      console.log('✅ Table created via pg_query RPC');
      return true;
    }
  } catch (e) {
    // Continue to next method
  }

  // Method 2: Try Supabase SQL endpoint (if available)
  try {
    const response = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (response.ok) {
      console.log('✅ Table created via SQL endpoint');
      return true;
    }
  } catch (e) {
    // Continue
  }

  // Method 3: Use the database URL directly with postgres client
  console.log('⚠️ Could not create table via REST API.');
  console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/myylgglbtroabqclzvvn/sql/new\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  
  return false;
}

createTable();
