/**
 * January 16 - February 6 Data Import Script
 * 
 * This script:
 * 1. Reads the linked creators list first
 * 2. Imports main product data for linked creators
 * 3. Imports extra data from 2 additional creators
 * 4. Updates period summaries
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

// File paths
const MAIN_DATA_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Video_Product 2026-01-16_2026-02-06.xlsx';
const EXTRA_DATA_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Video_Product 2026-01-16_2026-02-06 (1).xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator 2026-02-05_2026-02-06.xlsx';

// Date ranges
const DATE_START = '2026-01-16';
const DATE_END = '2026-02-06';
const COMPARISON_START = '2025-12-22';
const COMPARISON_END = '2026-01-15';

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

function calculatePrevious(current: number, changePercent: number): number {
  if (changePercent === 100 || changePercent === -100) return 0;
  const multiplier = 1 + (changePercent / 100);
  if (multiplier === 0) return 0;
  return current / multiplier;
}

async function importData() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       📊 January 16 - February 6 Data Import              ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Step 1: Load linked creators from Excel file
  console.log('📁 Step 1: Loading linked creators...');
  
  if (!fs.existsSync(LINKED_CREATORS_FILE)) {
    console.error(`❌ Linked creators file not found: ${LINKED_CREATORS_FILE}`);
    process.exit(1);
  }

  const linkedBuffer = fs.readFileSync(LINKED_CREATORS_FILE);
  const linkedWorkbook = XLSX.read(linkedBuffer, { type: 'buffer' });
  const linkedSheet = linkedWorkbook.Sheets[linkedWorkbook.SheetNames[0]];
  const linkedRows = XLSX.utils.sheet_to_json(linkedSheet);
  
  console.log(`   Found ${linkedRows.length} rows in linked creators file`);
  
  // Show column names
  if (linkedRows.length > 0) {
    console.log(`   Columns: ${Object.keys(linkedRows[0] as object).join(', ')}`);
  }

  // Extract handles from linked creators
  const linkedHandles = new Set<string>();
  for (const row of linkedRows as Record<string, any>[]) {
    // Try different column name variations
    const handle = row['Creator username'] || row['Creator Username'] || row['Username'] || row['username'] || row['Creator name'] || row['Handle'];
    if (handle && handle !== '-') {
      linkedHandles.add(normalizeHandle(handle));
    }
  }
  
  console.log(`✅ Found ${linkedHandles.size} linked creators\n`);
  
  // Update linked_creators table in database
  console.log('📥 Updating linked_creators table...');
  for (const handle of linkedHandles) {
    const { error } = await admin
      .from('linked_creators')
      .upsert({
        tiktok_handle: handle,
        linked_at: new Date().toISOString(),
      }, { onConflict: 'tiktok_handle' });
    
    if (error && !error.message.includes('duplicate')) {
      console.log(`   ⚠️ Error adding ${handle}: ${error.message}`);
    }
  }
  console.log(`✅ Synced ${linkedHandles.size} linked creators to database\n`);

  // Step 2: Clear old period data (to replace with fresh import)
  console.log('🗑️ Step 2: Clearing old period summaries...');
  await admin.from('creator_period_summary').delete().neq('tiktok_handle', '');
  console.log('✅ Old summaries cleared\n');

  // Step 3: Import main data file
  console.log('📁 Step 3: Importing main data file...');
  const mainStats = await importExcelFile(admin, MAIN_DATA_FILE, linkedHandles, 'main');
  
  // Step 4: Import extra data file (2 additional creators)
  console.log('\n📁 Step 4: Importing extra creators data...');
  const extraStats = await importExcelFile(admin, EXTRA_DATA_FILE, linkedHandles, 'extra');

  // Step 5: Combine stats and create period summaries
  console.log('\n📊 Step 5: Creating period summaries...');
  
  // Merge stats from both files
  const allStats: Record<string, typeof mainStats[string]> = { ...mainStats };
  for (const [handle, stats] of Object.entries(extraStats)) {
    if (allStats[handle]) {
      allStats[handle].products += stats.products;
      allStats[handle].gmv += stats.gmv;
      allStats[handle].items += stats.items;
      allStats[handle].orders += stats.orders;
      allStats[handle].commission += stats.commission;
      allStats[handle].prevGmv += stats.prevGmv;
      allStats[handle].prevItems += stats.prevItems;
      allStats[handle].prevOrders += stats.prevOrders;
      for (const [cat, amount] of Object.entries(stats.categoryBreakdown)) {
        allStats[handle].categoryBreakdown[cat] = (allStats[handle].categoryBreakdown[cat] || 0) + amount;
      }
    } else {
      allStats[handle] = stats;
    }
  }

  let summariesCreated = 0;
  for (const [handle, stats] of Object.entries(allStats)) {
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
    
    // Find top niche
    let topNiche = 'Uncategorized';
    let topNicheGmv = 0;
    for (const [category, amount] of Object.entries(stats.categoryBreakdown)) {
      if (amount > topNicheGmv) {
        topNiche = category;
        topNicheGmv = amount;
      }
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
        import_source: `Jan16-Feb06 import`
      });

    if (error) {
      console.log(`   ⚠️ Error saving summary for ${handle}: ${error.message}`);
    } else {
      summariesCreated++;
    }
  }
  console.log(`✅ Created ${summariesCreated} period summaries\n`);

  // Print final summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT COMPLETE                         ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sortedCreators = Object.entries(allStats).sort((a, b) => b[1].gmv - a[1].gmv);
  
  console.log('📊 Top 20 Creators by GMV:');
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.slice(0, 20).forEach(([handle, stats], i) => {
    const changeSymbol = stats.gmv >= stats.prevGmv ? '📈' : '📉';
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(22)} $${stats.gmv.toFixed(2).padStart(10)} | ${stats.items} items ${changeSymbol}`);
  });
  
  const totalGMV = sortedCreators.reduce((sum, [, s]) => sum + s.gmv, 0);
  const totalItems = sortedCreators.reduce((sum, [, s]) => sum + s.items, 0);
  const totalOrders = sortedCreators.reduce((sum, [, s]) => sum + s.orders, 0);
  
  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`💰 Total GMV: $${totalGMV.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`📦 Total Items: ${totalItems.toLocaleString('en-US')}`);
  console.log(`🛒 Total Orders: ${totalOrders.toLocaleString('en-US')}`);
  console.log(`👤 Creators: ${sortedCreators.length}`);
  console.log(`📅 Period: ${DATE_START} to ${DATE_END}`);
  console.log('───────────────────────────────────────────────────────────');
  
  console.log('\n✨ Import completed successfully!\n');
}

async function importExcelFile(
  admin: any,
  filePath: string,
  linkedHandles: Set<string>,
  label: string
): Promise<Record<string, {
  products: number;
  gmv: number;
  items: number;
  orders: number;
  commission: number;
  prevGmv: number;
  prevItems: number;
  prevOrders: number;
  categoryBreakdown: Record<string, number>;
}>> {
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return {};
  }

  const filename = path.basename(filePath);
  console.log(`   Reading: ${filename}`);

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`   Found ${rows.length} rows`);
  
  // Show columns
  if (rows.length > 0) {
    console.log(`   Columns: ${Object.keys(rows[0] as object).slice(0, 8).join(', ')}...`);
  }

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

  let imported = 0;
  let skipped = 0;
  let notLinked = 0;

  for (const row of rows as Record<string, any>[]) {
    const creatorName = row['Creator username'] || row['Creator Username'];
    const productName = row['Product info'] || row['Product name'] || row['Product'];
    
    // Skip invalid rows
    if (!creatorName || creatorName === '-' || !productName || productName === '-') {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle) {
      skipped++;
      continue;
    }

    // For extra file, add these creators to linked set even if not in original list
    if (label === 'extra' && !linkedHandles.has(normalizedHandle)) {
      linkedHandles.add(normalizedHandle);
      // Also add to database
      await admin.from('linked_creators').upsert({
        tiktok_handle: normalizedHandle,
        linked_at: new Date().toISOString(),
      }, { onConflict: 'tiktok_handle' });
      console.log(`   ➕ Added extra creator: @${normalizedHandle}`);
    }

    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    const gmv = parseCurrency(row['Affiliate GMV'] || row['GMV']);
    const itemsSold = parseInteger(row['Items sold'] || row['Items Sold']);
    const orders = parseInteger(row['Affiliate orders'] || row['Orders']);
    
    if (gmv === 0 && itemsSold === 0) {
      skipped++;
      continue;
    }

    let commission = parseCurrency(
      row['Est. commission'] || row['Est.commission'] || row['Commission'] || 0
    );
    if (commission === 0 && gmv > 0) {
      commission = Math.round(gmv * 0.10 * 100) / 100;
    }

    // Get comparison rates for calculating previous values
    const gmvChangeRate = parsePercentage(row['Affiliate GMV Comparison rate'] || row['GMV Change']);
    const itemsChangeRate = parsePercentage(row['Items sold Comparison rate'] || row['Items Change']);
    const ordersChangeRate = parsePercentage(row['Affiliate orders Comparison rate'] || row['Orders Change']);
    
    const prevGmv = calculatePrevious(gmv, gmvChangeRate);
    const prevItems = Math.round(calculatePrevious(itemsSold, itemsChangeRate));
    const prevOrders = Math.round(calculatePrevious(orders, ordersChangeRate));

    const productCategory = row['Level 1 category'] || row['Category'] || 'Uncategorized';
    const shopName = row['Shop name'] || null;
    const productId = row['Product ID'] && row['Product ID'] !== '-' ? String(row['Product ID']) : null;

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
        prevOrders: 0,
        categoryBreakdown: {}
      };
    }
    
    handleStats[normalizedHandle].products++;
    handleStats[normalizedHandle].gmv += gmv;
    handleStats[normalizedHandle].items += itemsSold;
    handleStats[normalizedHandle].orders += orders;
    handleStats[normalizedHandle].commission += commission;
    handleStats[normalizedHandle].prevGmv += prevGmv;
    handleStats[normalizedHandle].prevItems += prevItems;
    handleStats[normalizedHandle].prevOrders += prevOrders;
    
    if (productCategory && productCategory !== '-' && productCategory !== 'Uncategorized') {
      handleStats[normalizedHandle].categoryBreakdown[productCategory] = 
        (handleStats[normalizedHandle].categoryBreakdown[productCategory] || 0) + gmv;
    }

    // Insert product metric
    try {
      const { error } = await admin.rpc('upsert_creator_product_metrics', {
        p_tiktok_handle: normalizedHandle,
        p_date_start: DATE_START,
        p_date_end: DATE_END,
        p_product_id: productId,
        p_product_name: productName,
        p_product_category: productCategory !== '-' ? productCategory : 'Uncategorized',
        p_shop_name: shopName,
        p_gmv: gmv,
        p_items_sold: itemsSold,
        p_est_commission: commission,
        p_orders: orders,
        p_import_source: `${filename}`
      });

      if (error) {
        // Try direct insert if RPC fails
        await admin.from('creator_product_metrics').upsert({
          tiktok_handle: normalizedHandle,
          date_start: DATE_START,
          date_end: DATE_END,
          product_id: productId,
          product_name: productName,
          product_category: productCategory !== '-' ? productCategory : 'Uncategorized',
          shop_name: shopName,
          gmv: gmv,
          items_sold: itemsSold,
          est_commission: commission,
          orders: orders,
          import_source: filename
        }, { onConflict: 'tiktok_handle,date_start,date_end,product_name' });
      }
      imported++;
    } catch (err) {
      skipped++;
    }

    if (imported % 100 === 0 && imported > 0) {
      process.stdout.write(`\r   Imported ${imported} records...`);
    }
  }

  console.log(`\r   ✅ Imported ${imported} records, skipped ${skipped}, not linked: ${notLinked}`);
  console.log(`   👤 Creators found: ${Object.keys(handleStats).length}`);
  
  return handleStats;
}

importData().catch(console.error);

