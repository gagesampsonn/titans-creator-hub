/**
 * Top Videos Data Import Script
 * 
 * Imports top 20 videos from TikTok Shop export
 * These are agency-wide rankings, not per-creator
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\TopRanking_Creator-Video_2025-12-01_2025-12-20.xlsx';
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

function parsePercentage(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function importTopVideos() {
  console.log('🎬 Top Videos Data Import\n');
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}\n`);
  
  // Load linked creators
  console.log('📁 Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`   ✅ Loaded ${linkedHandles.size} linked creators\n`);

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
  
  console.log(`   ✅ Found ${rows.length} video records\n`);

  // Initialize Supabase
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Clear existing data for this period
  console.log('🗑️  Clearing existing data for this period...');
  const { error: deleteError } = await admin
    .from('creator_top_videos')
    .delete()
    .eq('date_start', DATE_START)
    .eq('date_end', DATE_END);
  
  if (deleteError) {
    console.log(`   ⚠️ Delete error: ${deleteError.message}`);
  } else {
    console.log('   ✅ Cleared existing data\n');
  }

  // Import data
  console.log('📥 Importing top video data...\n');
  
  let imported = 0;
  let skipped = 0;
  const creatorStats: Record<string, { videos: number; totalRevenue: number }> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, any>;
    const creatorName = row['Creator name'];
    const videoId = row['Video ID'];
    const videoName = row['Video name'];
    const revenue = parseCurrency(row['Revenue (video)']);
    const compare = parsePercentage(row['Compare']);
    const contribution = parsePercentage(row['Contribution']);
    const rank = i + 1; // Rank based on order in file

    if (!creatorName || !videoId) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    
    // Track stats for all creators in the file (they should all be linked)
    if (!creatorStats[normalizedHandle]) {
      creatorStats[normalizedHandle] = { videos: 0, totalRevenue: 0 };
    }
    creatorStats[normalizedHandle].videos++;
    creatorStats[normalizedHandle].totalRevenue += revenue;

    const { error } = await admin
      .from('creator_top_videos')
      .upsert({
        tiktok_handle: normalizedHandle,
        video_id: String(videoId),
        video_name: videoName?.trim() || null,
        revenue: revenue,
        compare_pct: compare,
        contribution_pct: contribution,
        rank: rank,
        date_start: DATE_START,
        date_end: DATE_END,
        import_source: filename
      }, { onConflict: 'video_id,date_start,date_end' });

    if (error) {
      console.log(`   ⚠️ Error inserting rank ${rank}: ${error.message}`);
      skipped++;
    } else {
      imported++;
      process.stdout.write(`   Imported ${imported}/${rows.length}...\r`);
    }
  }

  // Print summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                 TOP VIDEOS IMPORT COMPLETE                  ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} video records`);
  console.log(`⏭️  Skipped:  ${skipped} rows`);
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}`);
  console.log(`👤 Creators in top 20: ${Object.keys(creatorStats).length}\n`);

  console.log('🏆 Top Videos by Creator:');
  console.log('───────────────────────────────────────────────────────────');
  
  const sortedCreators = Object.entries(creatorStats)
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

  for (const [handle, stats] of sortedCreators) {
    console.log(`   @${handle.padEnd(22)} ${stats.videos.toString().padStart(2)} videos | $${stats.totalRevenue.toFixed(2).padStart(12)} revenue`);
  }

  console.log('\n✨ Top videos import complete!\n');
}

importTopVideos().catch(console.error);
