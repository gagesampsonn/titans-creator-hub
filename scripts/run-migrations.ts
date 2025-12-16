/**
 * Script to run database migrations directly via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Migration 004: Creator Product Metrics Table
  console.log('📦 Creating creator_product_metrics table...');
  
  const { error: error1 } = await admin.rpc('exec_sql', {
    sql: `
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
    `
  });
  
  // If exec_sql doesn't exist, try direct insert approach
  // For now, let's just verify tables exist by querying them
  
  // Check if table exists
  const { data: tables, error: tablesError } = await admin
    .from('creator_product_metrics')
    .select('id')
    .limit(1);
    
  if (tablesError && tablesError.code === '42P01') {
    console.log('❌ Table creator_product_metrics does not exist.');
    console.log('\n⚠️  Please run the migration manually in Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard/project/myylgglbtroabqclzvvn/sql');
    console.log('   2. Copy and paste the contents of:');
    console.log('      - supabase/migrations/004_creator_product_metrics.sql');
    console.log('      - supabase/migrations/005_seed_linked_creators.sql');
    console.log('   3. Click "Run"\n');
    return false;
  } else if (tablesError) {
    console.log('⚠️  Error checking table:', tablesError.message);
  } else {
    console.log('✅ Table creator_product_metrics exists');
  }
  
  // Check linked_creators
  const { data: creators, error: creatorsError } = await admin
    .from('linked_creators')
    .select('tiktok_handle')
    .limit(5);
    
  if (creatorsError) {
    console.log('⚠️  Error checking linked_creators:', creatorsError.message);
  } else {
    console.log(`✅ linked_creators table has ${creators?.length || 0}+ entries`);
  }
  
  return true;
}

runMigrations().then((success) => {
  if (success) {
    console.log('\n✨ Migration check complete!');
  }
}).catch(console.error);
