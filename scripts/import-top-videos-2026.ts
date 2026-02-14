/**
 * Top Videos Data Import Script - 2026 Q1
 * 
 * Imports top 20 videos from TikTok Shop export (Jan 1 - Feb 13, 2026)
 * These are agency-wide rankings for the public billboard
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Video_Shop_Product Category 2026-01-01_2026-02-12.xlsx';

const DATE_START = '2026-01-01';
const DATE_END = '2026-02-13';

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
  console.log('🎬 Top Videos 2026 Data Import\n');
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}\n`);
  
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

  // Try to detect column names (they might vary)
  const firstRow = rows[0] as Record<string, any>;
  const columnMap: Record<string, string> = {};
  
  // Common column name variations
  for (const key of Object.keys(firstRow)) {
    const lower = key.toLowerCase();
    if (lower.includes('creator') || lower.includes('tiktok')) {
      columnMap.creator = key;
    } else if (lower.includes('video id') || lower.includes('video_id')) {
      columnMap.videoId = key;
    } else if (lower.includes('video name') || lower.includes('video_name') || lower.includes('title')) {
      columnMap.videoName = key;
    } else if (lower.includes('revenue') && lower.includes('video')) {
      columnMap.revenue = key;
    } else if (lower.includes('compare') || lower.includes('compare_pct')) {
      columnMap.compare = key;
    } else if (lower.includes('contribution') || lower.includes('contribution_pct')) {
      columnMap.contribution = key;
    }
  }

  console.log('📋 Detected columns:', columnMap);
  console.log('');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, any>;
    const creatorName = row[columnMap.creator] || row['Creator name'] || row['Creator Name'] || row['TikTok Handle'];
    const videoId = row[columnMap.videoId] || row['Video ID'] || row['Video Id'];
    const videoName = row[columnMap.videoName] || row['Video name'] || row['Video Name'] || row['Title'];
    const revenue = parseCurrency(row[columnMap.revenue] || row['Revenue (video)'] || row['Revenue']);
    const compare = parsePercentage(row[columnMap.compare] || row['Compare'] || row['Compare %']);
    const contribution = parsePercentage(row[columnMap.contribution] || row['Contribution'] || row['Contribution %']);
    const rank = i + 1; // Rank based on order in file

    if (!creatorName || !videoId) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    
    // Track stats
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
      if (imported % 5 === 0 || imported === rows.length) {
        process.stdout.write(`   Imported ${imported}/${rows.length}...\r`);
      }
    }
  }

  // Print summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('            TOP VIDEOS 2026 IMPORT COMPLETE                 ');
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

