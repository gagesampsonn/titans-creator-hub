/**
 * Script to import 12/16 product metrics from TikTok Partner Center Excel export
 * 
 * This script:
 * 1. Reads the Excel file
 * 2. Filters for rows that include 12/16 data
 * 3. Only imports data for linked creators (from linked_creators.csv)
 * 4. Uses the per-row Date column to determine date_start and date_end
 * 
 * Usage: npx tsx scripts/import-dec16-data.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product 2025-12-15_2025-12-16.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

// Normalize TikTok handle (lowercase, no @)
function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// Parse currency string to number
function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Parse integer
function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

// Parse date range from row's Date column (e.g., "2025-12-16-2025-12-16")
function parseDateRange(dateStr: string): { start: string; end: string } | null {
  if (!dateStr || dateStr === 'Summary' || dateStr === '-') return null;
  
  // Match pattern like "2025-12-15-2025-12-16"
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  return null;
}

// Check if date range includes 12/16
function includes1216(dateStr: string): boolean {
  const range = parseDateRange(dateStr);
  if (!range) return false;
  
  // Check if 2025-12-16 falls within the range
  const targetDate = new Date('2025-12-16');
  const startDate = new Date(range.start);
  const endDate = new Date(range.end);
  
  return targetDate >= startDate && targetDate <= endDate;
}

async function importDec16Data() {
  console.log('📊 TikTok Product Metrics Import Tool - December 16, 2025 Data\n');
  
  // Load linked creators
  console.log('📁 Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);

  // Check Excel file exists
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ File not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  const filename = path.basename(EXCEL_FILE);
  console.log(`📁 Reading: ${filename}`);

  // Read Excel file
  const buffer = fs.readFileSync(EXCEL_FILE);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📋 Found ${rows.length} total rows in spreadsheet\n`);

  // Filter for rows that include 12/16 data
  const dec16Rows = rows.filter((row: any) => includes1216(row['Date']));
  console.log(`📅 Rows with 12/16 data: ${dec16Rows.length}`);

  // Initialize Supabase client
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Process each row
  let imported = 0;
  let skipped = 0;
  let notLinked = 0;
  const errors: string[] = [];
  const handleStats: Record<string, { products: number; gmv: number }> = {};

  for (const row of dec16Rows as Record<string, any>[]) {
    // Map columns
    const creatorName = row['Creator username'] || row['Creator name'] || row['Creator'];
    const productName = row['Product info'] || row['Product name'] || row['Product'];
    const shopName = row['Shop name'] || row['Shop'];
    const productCategory = row['Level 1 category'] || row['Level 2 category'] || row['Product category'];
    const gmv = parseCurrency(row['Affiliate GMV'] || row['GMV']);
    const itemsSold = parseInteger(row['Items sold']);
    const estCommission = parseCurrency(row['Est. commission'] || 0);
    const orders = parseInteger(row['Affiliate orders'] || row['Orders'] || 0);
    const dateStr = row['Date'];
    
    // Skip summary rows and rows without creator or product name
    if (!creatorName || creatorName === '-' || !productName || productName === '-') {
      skipped++;
      continue;
    }

    // Skip rows with 0 GMV and 0 items sold
    if (gmv === 0 && itemsSold === 0) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle) {
      skipped++;
      continue;
    }

    // Check if this creator is a linked creator
    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    // Parse date range from row
    const dateRange = parseDateRange(dateStr);
    if (!dateRange) {
      skipped++;
      continue;
    }

    // Track stats per handle
    if (!handleStats[normalizedHandle]) {
      handleStats[normalizedHandle] = { products: 0, gmv: 0 };
    }
    handleStats[normalizedHandle].products++;
    handleStats[normalizedHandle].gmv += gmv;

    try {
      // Upsert the product metrics
      const { error } = await admin.rpc('upsert_creator_product_metrics', {
        p_tiktok_handle: normalizedHandle,
        p_date_start: dateRange.start,
        p_date_end: dateRange.end,
        p_product_id: null,
        p_product_name: productName,
        p_product_category: productCategory || 'Uncategorized',
        p_shop_name: shopName || null,
        p_gmv: gmv,
        p_items_sold: itemsSold,
        p_est_commission: estCommission,
        p_orders: orders,
        p_import_source: `${filename} (12/16 import)`
      });

      if (error) {
        errors.push(`${normalizedHandle} - ${productName}: ${error.message}`);
        skipped++;
      } else {
        imported++;
      }
    } catch (err: any) {
      errors.push(`${normalizedHandle} - ${productName}: ${err.message}`);
      skipped++;
    }
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} product records for linked creators`);
  console.log(`⏭️  Skipped:  ${skipped} rows (0 GMV/items or missing data)`);
  console.log(`🚫 Not linked: ${notLinked} rows (creators not in agency)`);
  console.log(`👤 Unique linked creators with data: ${Object.keys(handleStats).length}\n`);

  // Show all linked creators with their stats
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv);

  console.log('📊 Linked Creators with 12/16 Data:');
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.forEach(([handle, stats], i) => {
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(25)} $${stats.gmv.toFixed(2).padStart(10)} (${stats.products} products)`);
  });

  if (errors.length > 0) {
    console.log('\n⚠️ Errors (first 10):');
    errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✨ December 16, 2025 data import complete!\n');
}

// Run the import
importDec16Data().catch(console.error);
