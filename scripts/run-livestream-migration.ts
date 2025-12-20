/**
 * Create creator_livestreams table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

async function runMigration() {
  console.log('🔧 Running Livestream Table Migration\n');

  // For Supabase, we'll use the dashboard SQL editor or the Management API
  // But we can test if the table exists by trying to query it
  
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Test if table exists
  const { error } = await admin.from('creator_livestreams').select('id').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('❌ Table does not exist.');
    console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:\n');
    console.log('----------------------------------------');
    console.log(`
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

ALTER TABLE creator_livestreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to livestreams" ON creator_livestreams
  FOR SELECT USING (true);
`);
    console.log('----------------------------------------\n');
    process.exit(1);
  } else if (error) {
    console.log('⚠️ Error checking table:', error.message);
  } else {
    console.log('✅ Table creator_livestreams exists!');
  }
}

runMigration().catch(console.error);
