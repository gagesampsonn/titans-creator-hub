/**
 * December 1 - January 4 Data Import Script
 * 
 * REPLACES existing data with new full period data (Dec 1 - Jan 4)
 * 
 * This script:
 * 1. Reads the Dec 1 - Jan 4 export file
 * 2. Clears existing product metrics and period summaries
 * 3. Imports fresh data for all linked creators
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-01_2026-01-04.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

// NEW date range for this import (Dec 1 - Jan 4)
const DATE_START = '2025-12-01';
const DATE_END = '2026-01-04';

// Comparison period (previous period for % change calculation)
const COMPARISON_START = '2025-11-07';
const COMPARISON_END = '2025-11-30';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

function parsePercentage(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function calculatePrevious(current: number, changePercent: number): number {
  if (changePercent === 100 || changePercent === -100) return 0;
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

async function importDec01Jan04Data() {
  console.log('📊 December 1 - January 4 Data Import (FULL REPLACE)\n');
  
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

  // Step 1: Clear existing data for linked creators
  console.log('🗑️ Clearing existing data for linked creators...');
  
  // Clear product metrics
  const { error: deleteMetricsError } = await admin
    .from('creator_product_metrics')
    .delete()
    .in('tiktok_handle', Array.from(linkedHandles));
  
  if (deleteMetricsError) {
    console.log(`   ⚠️ Error clearing metrics: ${deleteMetricsError.message}`);
  } else {
    console.log('   ✅ Cleared product metrics');
  }

  // Clear period summaries
  const { error: deleteSummaryError } = await admin
    .from('creator_period_summary')
    .delete()
    .in('tiktok_handle', Array.from(linkedHandles));
  
  if (deleteSummaryError) {
    console.log(`   ⚠️ Error clearing summaries: ${deleteSummaryError.message}`);
  } else {
    console.log('   ✅ Cleared period summaries');
  }
  console.log('');

  // Step 2: Import new product data
  console.log('📥 Importing Dec 1 - Jan 4 product data...\n');
  
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
    categoryBreakdown: Record<string, number>;
  }> = {};

  for (const row of rows as Record<string, any>[]) {
    const creatorName = row['Creator username'];
    const productName = row['Product info'];
    const shopName = row['Shop name'];
    const gmv = parseCurrency(row['Affiliate GMV']);
    const itemsSold = parseInteger(row['Items sold']);
    
    // Skip summary row
    if (!creatorName || creatorName === '-' || !productName || productName === '-') {
      skipped++;
      continue;
    }

    if (gmv === 0 && itemsSold === 0) {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle) {
      skipped++;
      continue;
    }

    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    let estCommission = parseCurrency(
      row['Est. commission'] || 
      row['Est.commission'] || 
      row['Est Commission'] || 
      row['Commission'] ||
      row['Estimated commission'] ||
      0
    );
    if (estCommission === 0 && gmv > 0) {
      estCommission = Math.round(gmv * 0.10 * 100) / 100;
    }
    const orders = parseInteger(row['Affiliate orders']);
    
    // Get comparison rates
    const gmvChangeRate = parsePercentage(row['Affiliate GMV Comparison rate']);
    const itemsChangeRate = parsePercentage(row['Items sold Comparison rate']);
    const ordersChangeRate = parsePercentage(row['Affiliate orders Comparison rate']);
    
    const prevGmv = calculatePrevious(gmv, gmvChangeRate);
    const prevItems = Math.round(calculatePrevious(itemsSold, itemsChangeRate));
    const prevOrders = Math.round(calculatePrevious(orders, ordersChangeRate));

    const productId = row['Product ID'] && row['Product ID'] !== '-' ? String(row['Product ID']) : null;
    
    // Determine category (may not be present in this export)
    const level1Category = row['Level 1 category'];
    const level2Category = row['Level 2 category'];
    const productCategory = (level1Category && level1Category !== '-') 
      ? level1Category 
      : ((level2Category && level2Category !== '-') ? level2Category : 'Uncategorized');

    // Track stats for period summary
    if (!handleStats[normalizedHandle]) {
      handleStats[normalizedHandle] = { 
        products: 0, 
        gmv: 0, 
        items: 0, 
        orders: 0,
        commission: 0,
        prevGmv: 0,
        prevItems: 0,
        prevOrders: 0,
        categoryBreakdown: {}
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
    
    if (productCategory && productCategory !== 'Uncategorized') {
      handleStats[normalizedHandle].categoryBreakdown[productCategory] = 
        (handleStats[normalizedHandle].categoryBreakdown[productCategory] || 0) + gmv;
    }

    try {
      const { error } = await admin.rpc('upsert_creator_product_metrics', {
        p_tiktok_handle: normalizedHandle,
        p_date_start: DATE_START,
        p_date_end: DATE_END,
        p_product_id: productId,
        p_product_name: productName,
        p_product_category: productCategory,
        p_shop_name: shopName || null,
        p_gmv: gmv,
        p_items_sold: itemsSold,
        p_est_commission: estCommission,
        p_orders: orders,
        p_import_source: `${filename} (Dec 1 - Jan 4)`
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

    if (imported % 100 === 0 && imported > 0) {
      process.stdout.write(`\r   Imported ${imported} records...`);
    }
  }

  console.log(`\r   Imported ${imported} records total\n`);

  // Step 3: Create new period summaries
  console.log('📊 Creating creator period summaries...\n');
  
  let summariesCreated = 0;
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
    
    // Determine top niche
    const categoryEntries = Object.entries(stats.categoryBreakdown);
    let topNiche = 'Uncategorized';
    let topNicheGmv = 0;
    if (categoryEntries.length > 0) {
      categoryEntries.sort((a, b) => b[1] - a[1]);
      topNiche = categoryEntries[0][0];
      topNicheGmv = categoryEntries[0][1];
    }
    
    const { error } = await admin
      .from('creator_period_summary')
      .insert({
        tiktok_handle: handle,
        date_start: DATE_START,
        date_end: DATE_END,
        total_gmv: stats.gmv,
        total_items: stats.items,
        total_orders: stats.orders,
        total_commission: stats.commission,
        product_count: stats.products,
        comparison_start: COMPARISON_START,
        comparison_end: COMPARISON_END,
        prev_gmv: stats.prevGmv,
        prev_items: stats.prevItems,
        prev_orders: stats.prevOrders,
        gmv_change_pct: gmvChange,
        items_change_pct: itemsChange,
        orders_change_pct: ordersChange,
        top_niche: topNiche,
        top_niche_gmv: topNicheGmv,
        import_source: `${filename} (Dec 1 - Jan 4)`
      });
    
    if (error) {
      console.log(`   ⚠️ Error saving summary for ${handle}: ${error.message}`);
    } else {
      summariesCreated++;
    }
  }
  console.log(`✅ Created ${summariesCreated} period summaries\n`);

  // Print summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} product records`);
  console.log(`⏭️  Skipped:  ${skipped} rows (no sales or missing data)`);
  console.log(`🚫 Not linked: ${notLinked} rows`);
  console.log(`📅 Date range: ${DATE_START} to ${DATE_END}`);
  console.log(`📅 Comparison: ${COMPARISON_START} to ${COMPARISON_END}`);
  console.log(`👤 Creators updated: ${Object.keys(handleStats).length}\n`);

  // Show top creators by GMV
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv);

  console.log(`📊 Top 20 Creators by GMV (Dec 1 - Jan 4):`);
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.slice(0, 20).forEach(([handle, stats], i) => {
    const change = stats.prevGmv > 0 
      ? ((stats.gmv - stats.prevGmv) / stats.prevGmv * 100).toFixed(0) + '%'
      : 'new';
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(22)} $${stats.gmv.toFixed(2).padStart(10)} | ${stats.items} items | ${change}`);
  });

  if (sortedCreators.length > 20) {
    console.log(`   ... and ${sortedCreators.length - 20} more creators`);
  }

  // Calculate totals
  const totalGMV = sortedCreators.reduce((sum, [, stats]) => sum + stats.gmv, 0);
  const totalItems = sortedCreators.reduce((sum, [, stats]) => sum + stats.items, 0);
  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`📈 Total GMV: $${totalGMV.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`📦 Total Items: ${totalItems.toLocaleString('en-US')}`);
  console.log('───────────────────────────────────────────────────────────');

  if (errors.length > 0) {
    console.log(`\n⚠️ Errors (${errors.length} total, showing first 5):`);
    errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✨ December 1 - January 4 data imported successfully!\n');
}

importDec01Jan04Data().catch(console.error);

