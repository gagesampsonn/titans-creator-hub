/**
 * Livestream Data Import Script
 * 
 * Imports top livestream sessions from TikTok Shop export
 * Only imports data for linked creators
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

// Date range for this import (from filename)
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

async function importLivestreams() {
  console.log('🎥 Livestream Data Import\n');
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}\n`);
  
  // Load linked creators
  console.log('📁 Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);

  // Read Excel file
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ File not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  const filename = path.basename(EXCEL_FILE);
  console.log(`📁 Reading: ${filename}`);

  const buffer = fs.readFileSync(EXCEL_FILE);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📋 Found ${rows.length} livestream records\n`);

  // Initialize Supabase
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // First, run the migration if table doesn't exist
  console.log('🔧 Ensuring table exists...');
  const { error: migrationError } = await admin.rpc('exec_sql', {
    sql: `
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
    `
  }).catch(() => ({ error: null })); // Ignore if rpc doesn't exist

  // Try direct table creation via upsert test
  const testResult = await admin.from('creator_livestreams').select('id').limit(1);
  if (testResult.error && testResult.error.code === '42P01') {
    console.log('⚠️  Table does not exist. Please run the migration first:');
    console.log('   npx ts-node scripts/run-sql-migration.ts supabase/migrations/008_creator_livestreams.sql');
    process.exit(1);
  }
  console.log('✅ Table ready\n');

  // Clear existing data for this date range
  console.log('🗑️  Clearing existing livestream data for this period...');
  await admin
    .from('creator_livestreams')
    .delete()
    .eq('date_start', DATE_START)
    .eq('date_end', DATE_END);
  console.log('✅ Cleared existing data\n');

  // Import new data
  console.log('📥 Importing livestream data...\n');
  
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
    
    // Only import for linked creators
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

    try {
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
        console.log(`   ⚠️ Error: ${error.message}`);
        skipped++;
      } else {
        imported++;
      }
    } catch (err: any) {
      console.log(`   ⚠️ Error: ${err.message}`);
      skipped++;
    }
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                 LIVESTREAM IMPORT SUMMARY                   ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} livestream records`);
  console.log(`⏭️  Skipped:  ${skipped} rows`);
  console.log(`🚫 Not linked: ${notLinked} rows`);
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}`);
  console.log(`👤 Creators with lives: ${Object.keys(creatorStats).length}\n`);

  // Show creator breakdown
  console.log('📊 Creator Livestream Summary:');
  console.log('───────────────────────────────────────────────────────────');
  
  const sortedCreators = Object.entries(creatorStats)
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

  for (const [handle, stats] of sortedCreators) {
    const avgDuration = formatDuration(Math.round(stats.totalDuration / stats.streams));
    console.log(`   @${handle.padEnd(22)} ${stats.streams} streams | $${stats.totalRevenue.toFixed(2).padStart(10)} revenue | avg ${avgDuration}`);
  }

  console.log('\n✨ Livestream import complete!\n');
}

importLivestreams().catch(console.error);
