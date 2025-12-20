/**
 * Full December 1-17 Data Import Script
 * 
 * This script:
 * 1. Clears existing product metrics for linked creators
 * 2. Imports fresh data from the Dec 1-17 export
 * 3. Uses a consistent date range for all entries
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-01_2025-12-19.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

// Fixed date range for this import
const DATE_START = '2025-12-01';
const DATE_END = '2025-12-19';
const COMPARISON_START = '2025-11-10';
const COMPARISON_END = '2025-11-30';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// Parse percentage string like "16.93%" or "-12.39%" to number
function parsePercentage(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Calculate previous value from current value and percentage change
// If current = 100 and change = 20%, then prev = 100 / 1.2 = 83.33
function calculatePrevious(current: number, changePercent: number): number {
  if (changePercent === 100 || changePercent === -100) return 0; // New or gone
  const multiplier = 1 + (changePercent / 100);
  if (multiplier === 0) return 0;
  return current / multiplier;
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

async function importFullDecData() {
  console.log('📊 Full December Data Import (Dec 1-17, 2025)\n');
  
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

  // Initialize Supabase
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Step 1: Delete existing data for linked creators
  console.log('🗑️  Clearing existing product metrics for linked creators...');
  for (const handle of linkedHandles) {
    if (handle) {
      await admin
        .from('creator_product_metrics')
        .delete()
        .eq('tiktok_handle', handle);
    }
  }
  console.log('✅ Cleared existing data\n');

  // Step 2: Import new data
  console.log('📥 Importing fresh data...\n');
  
  let imported = 0;
  let skipped = 0;
  let notLinked = 0;
  const errors: string[] = [];
  const handleStats: Record<string, { 
    products: number; 
    gmv: number; 
    items: number;
    orders: number;
    commission: number;
    prevGmv: number;
    prevItems: number;
    prevOrders: number;
  }> = {};

  for (const row of rows as Record<string, any>[]) {
    const dateStr = row['Date'];
    
    // Skip summary row
    if (!dateStr || dateStr === 'Summary' || dateStr === '-') {
      skipped++;
      continue;
    }

    const creatorName = row['Creator username'];
    const productName = row['Product info'];
    const shopName = row['Shop name'];
    const gmv = parseCurrency(row['Affiliate GMV']);
    const itemsSold = parseInteger(row['Items sold']);
    // Try multiple column name variations for commission
    // If not found, estimate at 10% of GMV (standard affiliate rate)
    let estCommission = parseCurrency(
      row['Est. commission'] || 
      row['Est.commission'] || 
      row['Est Commission'] || 
      row['Commission'] ||
      row['Estimated commission'] ||
      row['commission'] ||
      0
    );
    // If no commission column exists, calculate at 10%
    if (estCommission === 0 && gmv > 0) {
      estCommission = Math.round(gmv * 0.10 * 100) / 100; // Round to 2 decimals
    }
    const orders = parseInteger(row['Affiliate orders']);
    
    // Get comparison rates
    const gmvChangeRate = parsePercentage(row['Affiliate GMV Comparison rate']);
    const itemsChangeRate = parsePercentage(row['Items sold Comparison rate']);
    const ordersChangeRate = parsePercentage(row['Affiliate orders Comparison rate']);
    
    // Calculate previous period values
    const prevGmv = calculatePrevious(gmv, gmvChangeRate);
    const prevItems = Math.round(calculatePrevious(itemsSold, itemsChangeRate));
    const prevOrders = Math.round(calculatePrevious(orders, ordersChangeRate));
    
    // Skip rows without creator or product
    if (!creatorName || creatorName === '-' || !productName || productName === '-') {
      skipped++;
      continue;
    }

    // Skip rows with no sales
    if (gmv === 0 && itemsSold === 0) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle) {
      skipped++;
      continue;
    }

    // Only import linked creators
    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    // Track stats
    if (!handleStats[normalizedHandle]) {
      handleStats[normalizedHandle] = { 
        products: 0, 
        gmv: 0, 
        items: 0, 
        orders: 0,
        commission: 0,
        prevGmv: 0,
        prevItems: 0,
        prevOrders: 0
      };
    }
    handleStats[normalizedHandle].products++;
    handleStats[normalizedHandle].gmv += gmv;
    handleStats[normalizedHandle].items += itemsSold;
    handleStats[normalizedHandle].orders += orders;
    handleStats[normalizedHandle].commission += estCommission;
    handleStats[normalizedHandle].prevGmv += prevGmv;
    handleStats[normalizedHandle].prevItems += prevItems;
    handleStats[normalizedHandle].prevOrders += prevOrders;

    try {
      const { error } = await admin.rpc('upsert_creator_product_metrics', {
        p_tiktok_handle: normalizedHandle,
        p_date_start: DATE_START,
        p_date_end: DATE_END,
        p_product_id: row['Product ID'] || null,
        p_product_name: productName,
        p_product_category: 'Uncategorized',
        p_shop_name: shopName || null,
        p_gmv: gmv,
        p_items_sold: itemsSold,
        p_est_commission: estCommission,
        p_orders: orders,
        p_import_source: `${filename} (Dec 1-17 full import)`
      });

      if (error) {
        errors.push(`${normalizedHandle} - ${productName.substring(0, 30)}: ${error.message}`);
        skipped++;
      } else {
        imported++;
      }
    } catch (err: any) {
      errors.push(`${normalizedHandle}: ${err.message}`);
      skipped++;
    }

    // Progress indicator
    if (imported % 100 === 0 && imported > 0) {
      process.stdout.write(`\r   Imported ${imported} records...`);
    }
  }

  console.log('\n');

  // Step 3: Save creator period summaries
  console.log('📊 Saving creator period summaries...\n');
  
  for (const [handle, stats] of Object.entries(handleStats)) {
    // Calculate percentage changes
    const gmvChange = stats.prevGmv > 0 
      ? ((stats.gmv - stats.prevGmv) / stats.prevGmv) * 100 
      : (stats.gmv > 0 ? 100 : 0);
    const itemsChange = stats.prevItems > 0 
      ? ((stats.items - stats.prevItems) / stats.prevItems) * 100 
      : (stats.items > 0 ? 100 : 0);
    const ordersChange = stats.prevOrders > 0 
      ? ((stats.orders - stats.prevOrders) / stats.prevOrders) * 100 
      : (stats.orders > 0 ? 100 : 0);
    
    const { error } = await admin
      .from('creator_period_summary')
      .upsert({
        tiktok_handle: handle,
        date_start: DATE_START,
        date_end: DATE_END,
        total_gmv: stats.gmv,
        total_items: stats.items,
        total_orders: stats.orders,
        total_commission: stats.commission, // Use actual tracked commission from import
        product_count: stats.products,
        comparison_start: COMPARISON_START,
        comparison_end: COMPARISON_END,
        prev_gmv: stats.prevGmv,
        prev_items: stats.prevItems,
        prev_orders: stats.prevOrders,
        gmv_change_pct: gmvChange,
        items_change_pct: itemsChange,
        orders_change_pct: ordersChange,
        import_source: filename
      }, { onConflict: 'tiktok_handle,date_start,date_end' });
    
    if (error) {
      console.log(`   ⚠️ Error saving summary for ${handle}: ${error.message}`);
    }
  }
  console.log('✅ Saved creator summaries\n');

  // Print summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} product records`);
  console.log(`⏭️  Skipped:  ${skipped} rows (no sales or missing data)`);
  console.log(`🚫 Not linked: ${notLinked} rows`);
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}`);
  console.log(`👤 Creators with data: ${Object.keys(handleStats).length}\n`);

  // Show all creators with stats and comparison
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv);

  console.log(`📊 Creator Performance (${DATE_START} to ${DATE_END}):`);
  console.log(`   Compared to: ${COMPARISON_START} to ${COMPARISON_END}`);
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.forEach(([handle, stats], i) => {
    const gmvChange = stats.prevGmv > 0 
      ? ((stats.gmv - stats.prevGmv) / stats.prevGmv) * 100 
      : (stats.gmv > 0 ? 100 : 0);
    const changeStr = gmvChange >= 0 ? `+${gmvChange.toFixed(1)}%` : `${gmvChange.toFixed(1)}%`;
    const changeIndicator = gmvChange >= 0 ? '▲' : '▼';
    
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(22)} $${stats.gmv.toFixed(2).padStart(10)} ${changeIndicator} ${changeStr.padStart(8)} | ${stats.items.toString().padStart(5)} items`);
  });

  if (errors.length > 0) {
    console.log(`\n⚠️ Errors (${errors.length} total, showing first 5):`);
    errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✨ December 1-17 data import complete!\n');
}

importFullDecData().catch(console.error);
