/**
 * Import Video Counts per Product
 * 
 * This script counts unique videos per product per creator
 * and updates the creator_product_metrics table with video_count
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Video_Product_Shop_Product Category 2025-12-01_2026-01-06.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

async function importVideoCounts() {
  console.log('📊 Importing Video Counts per Product\n');
  
  // Initialize Supabase first to add column
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // First, add the video_count column if it doesn't exist
  console.log('📋 Ensuring video_count column exists...');
  try {
    await admin.rpc('exec_sql', { 
      sql: 'ALTER TABLE creator_product_metrics ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0;' 
    });
    console.log('✅ Column ready\n');
  } catch (e: any) {
    // Column might already exist or we don't have exec_sql - try direct update
    console.log('   Note: Column may already exist, continuing...\n');
  }
  
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
  
  console.log(`📋 Found ${rows.length} total rows\n`);

  // Count unique videos per product per creator
  // Key: tiktok_handle:product_name -> Set of video IDs
  const productVideoMap: Map<string, Set<string>> = new Map();
  
  for (const row of rows as Record<string, any>[]) {
    const creatorName = row['Creator username'];
    const productName = row['Product info'];
    const videoId = row['Video ID'];
    
    // Skip summary rows
    if (!creatorName || creatorName === '-' || !productName || productName === '-' || !videoId || videoId === '-') {
      continue;
    }
    
    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle || !linkedHandles.has(normalizedHandle)) {
      continue;
    }
    
    const key = `${normalizedHandle}:${productName}`;
    if (!productVideoMap.has(key)) {
      productVideoMap.set(key, new Set());
    }
    productVideoMap.get(key)!.add(String(videoId));
  }
  
  console.log(`📊 Found ${productVideoMap.size} unique creator-product combinations\n`);
  
  // Update each product with video count
  console.log('📥 Updating video counts in database...\n');
  
  let updated = 0;
  let errors = 0;
  
  for (const [key, videoIds] of productVideoMap) {
    const [handle, productName] = key.split(':');
    const videoCount = videoIds.size;
    
    // Update the product metric
    const { error } = await admin
      .from('creator_product_metrics')
      .update({ video_count: videoCount })
      .eq('tiktok_handle', handle)
      .eq('product_name', productName);
    
    if (error) {
      errors++;
      if (errors <= 5) {
        console.log(`   ⚠️ Error updating ${handle}/${productName.substring(0, 30)}: ${error.message}`);
      }
    } else {
      updated++;
    }
    
    if (updated % 50 === 0 && updated > 0) {
      process.stdout.write(`\r   Updated ${updated} products...`);
    }
  }
  
  console.log(`\r   Updated ${updated} products total\n`);
  
  // Show some examples
  console.log('📊 Sample video counts:');
  console.log('───────────────────────────────────────────────────────────');
  
  const examples = Array.from(productVideoMap.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 15);
  
  examples.forEach(([key, videos], i) => {
    const [handle, productName] = key.split(':');
    console.log(`${(i+1).toString().padStart(2)}. @${handle.padEnd(22)} ${videos.size} videos -> ${productName.substring(0, 40)}...`);
  });
  
  console.log(`\n✅ Video counts imported! ${updated} products updated, ${errors} errors`);
}

importVideoCounts().catch(console.error);

