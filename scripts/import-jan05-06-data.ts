/**
 * January 5-6 Data Import Script
 * 
 * ADDS to existing data (does NOT replace Dec 1 - Jan 4 data)
 * 
 * This script:
 * 1. Reads the Jan 5-6 export file
 * 2. Imports product metrics for linked creators only
 * 3. Updates period summaries with combined data
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2026-01-05_2026-01-06.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

// NEW date range for this import (Jan 5-6)
const DATE_START = '2026-01-05';
const DATE_END = '2026-01-06';

// For period summary, we'll combine with existing data
// Previous period was Dec 1 - Jan 4, new combined will be Dec 1 - Jan 6
const COMBINED_DATE_START = '2025-12-01';
const COMBINED_DATE_END = '2026-01-06';
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

async function importJan05to06Data() {
  console.log('📊 January 5-6 Data Import (ADDING to existing data)\n');
  
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

  // Step 1: Get existing period summaries to merge with
  console.log('📥 Loading existing period summaries...');
  const { data: existingSummaries } = await admin
    .from('creator_period_summary')
    .select('*')
    .in('tiktok_handle', Array.from(linkedHandles));
  
  const existingByHandle: Record<string, any> = {};
  if (existingSummaries) {
    for (const summary of existingSummaries) {
      existingByHandle[summary.tiktok_handle] = summary;
    }
  }
  console.log(`✅ Found ${Object.keys(existingByHandle).length} existing summaries\n`);

  // Step 2: Import new product data (without deleting existing)
  console.log('📥 Importing Jan 5-6 product data...\n');
  
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
    
    // Determine category
    const level1Category = row['Level 1 category'];
    const level2Category = row['Level 2 category'];
    const productCategory = (level1Category && level1Category !== '-') 
      ? level1Category 
      : ((level2Category && level2Category !== '-') ? level2Category : 'Uncategorized');

    // Track stats for this new period
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
      // Insert with NEW date range (Jan 5-6) - won't conflict with existing Dec 1 - Jan 4
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
        p_import_source: `${filename} (Jan 5-6 add)`
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

    if (imported % 50 === 0 && imported > 0) {
      process.stdout.write(`\r   Imported ${imported} records...`);
    }
  }

  console.log(`\r   Imported ${imported} records total\n`);

  // Step 3: Update period summaries - COMBINE existing + new data
  console.log('📊 Updating creator period summaries (combining with existing)...\n');
  
  for (const [handle, newStats] of Object.entries(handleStats)) {
    const existing = existingByHandle[handle];
    
    // Combine existing + new
    const combinedGmv = (existing?.total_gmv || 0) + newStats.gmv;
    const combinedItems = (existing?.total_items || 0) + newStats.items;
    const combinedOrders = (existing?.total_orders || 0) + newStats.orders;
    const combinedCommission = (existing?.total_commission || 0) + newStats.commission;
    const combinedProducts = (existing?.product_count || 0) + newStats.products;
    
    // For comparison, use the existing prev values (they represent the comparison period)
    const prevGmv = existing?.prev_gmv || newStats.prevGmv;
    const prevItems = existing?.prev_items || newStats.prevItems;
    const prevOrders = existing?.prev_orders || newStats.prevOrders;
    
    // Recalculate percentage changes
    const gmvChange = prevGmv > 0 
      ? ((combinedGmv - prevGmv) / prevGmv) * 100 
      : (combinedGmv > 0 ? 100 : 0);
    const itemsChange = prevItems > 0 
      ? ((combinedItems - prevItems) / prevItems) * 100 
      : (combinedItems > 0 ? 100 : 0);
    const ordersChange = prevOrders > 0 
      ? ((combinedOrders - prevOrders) / prevOrders) * 100 
      : (combinedOrders > 0 ? 100 : 0);
    
    // Determine top niche (keep existing if stronger)
    let topNiche = existing?.top_niche || 'Uncategorized';
    let topNicheGmv = existing?.top_niche_gmv || 0;
    
    const categoryEntries = Object.entries(newStats.categoryBreakdown);
    if (categoryEntries.length > 0) {
      categoryEntries.sort((a, b) => b[1] - a[1]);
      if (categoryEntries[0][1] > topNicheGmv) {
        topNiche = categoryEntries[0][0];
        topNicheGmv = topNicheGmv + categoryEntries[0][1];
      }
    }
    
    // Delete old summary and insert new combined one
    await admin
      .from('creator_period_summary')
      .delete()
      .eq('tiktok_handle', handle);
    
    const { error } = await admin
      .from('creator_period_summary')
      .insert({
        tiktok_handle: handle,
        date_start: COMBINED_DATE_START,
        date_end: COMBINED_DATE_END,
        total_gmv: combinedGmv,
        total_items: combinedItems,
        total_orders: combinedOrders,
        total_commission: combinedCommission,
        product_count: combinedProducts,
        comparison_start: COMPARISON_START,
        comparison_end: COMPARISON_END,
        prev_gmv: prevGmv,
        prev_items: prevItems,
        prev_orders: prevOrders,
        gmv_change_pct: gmvChange,
        items_change_pct: itemsChange,
        orders_change_pct: ordersChange,
        top_niche: topNiche,
        top_niche_gmv: topNicheGmv,
        import_source: `Combined Dec1-Jan6 (added ${filename})`
      });
    
    if (error) {
      console.log(`   ⚠️ Error saving summary for ${handle}: ${error.message}`);
    }
  }
  console.log('✅ Updated creator summaries\n');

  // Print summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} new product records (Jan 5-6)`);
  console.log(`⏭️  Skipped:  ${skipped} rows (no sales or missing data)`);
  console.log(`🚫 Not linked: ${notLinked} rows`);
  console.log(`📅 New data range: ${DATE_START} to ${DATE_END}`);
  console.log(`📅 Combined range: ${COMBINED_DATE_START} to ${COMBINED_DATE_END}`);
  console.log(`👤 Creators updated: ${Object.keys(handleStats).length}\n`);

  // Show creators with new stats
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv);

  console.log(`📊 New Sales Added (Jan 5-6 only):`);
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.slice(0, 20).forEach(([handle, stats], i) => {
    const existing = existingByHandle[handle];
    const prevGmv = existing?.total_gmv || 0;
    const combinedGmv = prevGmv + stats.gmv;
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(22)} +$${stats.gmv.toFixed(2).padStart(9)} | Total: $${combinedGmv.toFixed(2).padStart(10)} | +${stats.items} items`);
  });

  if (sortedCreators.length > 20) {
    console.log(`   ... and ${sortedCreators.length - 20} more creators`);
  }

  if (errors.length > 0) {
    console.log(`\n⚠️ Errors (${errors.length} total, showing first 5):`);
    errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✨ January 5-6 data added successfully!\n');
}

importJan05to06Data().catch(console.error);

