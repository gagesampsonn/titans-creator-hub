/**
 * Setup Livestreams Table and Import Data
 * All-in-one script
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\TopRanking_Creator-Live_2025-12-01_2025-12-20.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

const DATE_START = '2025-12-01';
const DATE_END = '2025-12-20';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

async function createTableViaRest() {
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

  // Try using the postgres REST endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  return response.ok;
}

async function main() {
  console.log('🎥 Livestream Setup & Import Script\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Step 1: Check if table exists, if not try to create it
  console.log('🔧 Step 1: Checking/Creating table...');
  
  let tableExists = false;
  const { error: checkError } = await admin.from('creator_livestreams').select('id').limit(1);
  
  if (checkError && checkError.message.includes('does not exist')) {
    console.log('   Table does not exist, attempting to create...');
    
    // Try RPC method
    const created = await createTableViaRest();
    if (created) {
      console.log('   ✅ Table created via REST API');
      tableExists = true;
    } else {
      console.log('   ⚠️ Could not create table via REST API');
      console.log('   Trying direct insert method...');
      
      // Try inserting a dummy record to trigger table creation (won't work, but worth trying)
      // For Supabase, we need to use the Dashboard or migrations
      
      console.log('\n❌ Cannot create table programmatically.');
      console.log('\n📋 Please run this SQL in Supabase Dashboard (https://supabase.com/dashboard/project/myylgglbtroabqclzvvn/sql/new):\n');
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
`);
      console.log('\nThen run this script again.');
      process.exit(1);
    }
  } else {
    console.log('   ✅ Table already exists');
    tableExists = true;
  }

  if (!tableExists) {
    process.exit(1);
  }

  // Step 2: Load linked creators
  console.log('\n📁 Step 2: Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`   ✅ Loaded ${linkedHandles.size} linked creators`);

  // Step 3: Read Excel file
  console.log('\n📁 Step 3: Reading Excel file...');
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`   ❌ File not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  const filename = path.basename(EXCEL_FILE);
  const buffer = fs.readFileSync(EXCEL_FILE);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`   ✅ Found ${rows.length} livestream records`);

  // Step 4: Clear existing data for this period
  console.log('\n🗑️  Step 4: Clearing existing data for this period...');
  const { error: deleteError } = await admin
    .from('creator_livestreams')
    .delete()
    .eq('date_start', DATE_START)
    .eq('date_end', DATE_END);
  
  if (deleteError) {
    console.log(`   ⚠️ Delete error: ${deleteError.message}`);
  } else {
    console.log('   ✅ Cleared existing data');
  }

  // Step 5: Import data
  console.log('\n📥 Step 5: Importing livestream data...\n');
  
  let imported = 0;
  let skipped = 0;
  let notLinked = 0;
  const creatorStats: Record<string, { streams: number; totalRevenue: number; totalDuration: number }> = {};

  for (const row of rows as Record<string, any>[]) {
    const creatorName = row['Creator name'];
    const roomId = row['Livestream room ID'];
    const duration = parseInteger(row['Duration']);
    const livestreamName = row['Livestream name'];
    const revenue = parseCurrency(row['Revenue (LIVE)']);

    if (!creatorName || !roomId) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    
    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    // Track stats
    if (!creatorStats[normalizedHandle]) {
      creatorStats[normalizedHandle] = { streams: 0, totalRevenue: 0, totalDuration: 0 };
    }
    creatorStats[normalizedHandle].streams++;
    creatorStats[normalizedHandle].totalRevenue += revenue;
    creatorStats[normalizedHandle].totalDuration += duration;

    const { error } = await admin
      .from('creator_livestreams')
      .upsert({
        tiktok_handle: normalizedHandle,
        livestream_room_id: String(roomId),
        duration_seconds: duration,
        livestream_name: livestreamName || null,
        revenue: revenue,
        date_start: DATE_START,
        date_end: DATE_END,
        import_source: filename
      }, { onConflict: 'tiktok_handle,livestream_room_id,date_start,date_end' });

    if (error) {
      console.log(`   ⚠️ Error inserting ${normalizedHandle}: ${error.message}`);
      skipped++;
    } else {
      imported++;
      process.stdout.write(`   Imported ${imported}/${rows.length}...\r`);
    }
  }

  // Print summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                 LIVESTREAM IMPORT COMPLETE                  ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} livestream records`);
  console.log(`⏭️  Skipped:  ${skipped} rows`);
  console.log(`🚫 Not linked: ${notLinked} rows`);
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}`);
  console.log(`👤 Creators with lives: ${Object.keys(creatorStats).length}\n`);

  console.log('📊 Creator Livestream Summary:');
  console.log('───────────────────────────────────────────────────────────');
  
  const sortedCreators = Object.entries(creatorStats)
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

  for (const [handle, stats] of sortedCreators) {
    const avgDuration = formatDuration(Math.round(stats.totalDuration / stats.streams));
    console.log(`   @${handle.padEnd(22)} ${stats.streams.toString().padStart(2)} streams | $${stats.totalRevenue.toFixed(2).padStart(10)} revenue | avg ${avgDuration}`);
  }

  console.log('\n✨ Done! Livestream data is now available in the dashboard.\n');
}

main().catch(console.error);
