/**
 * December 29 Data Import Script
 * 
 * ADDS to existing data (does NOT replace previous data)
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-29_2025-12-29.xlsx';
const LINKED_CREATORS_FILE = path.join(__dirname, '..', 'data', 'linked_creators.csv');

// Date range for this import
const DATE_START = '2025-12-29';
const DATE_END = '2025-12-29';

// Combined period (previous was Nov 30 - Dec 28, now Nov 30 - Dec 29)
const COMBINED_DATE_START = '2025-11-30';
const COMBINED_DATE_END = '2025-12-29';
const COMPARISON_START = '2025-11-07';
const COMPARISON_END = '2025-11-29';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value || value === '-' || value === '--') return 0;
  const str = String(value).replace(/[$,]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value || value === '-') return 0;
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🚀 December 29 Data Import (ADDING to existing data)\n');
  
  // 1. Load linked creators
  console.log('📁 Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);
  
  // 2. Read Excel file
  console.log('📊 Reading Excel file...');
  const buffer = fs.readFileSync(EXCEL_FILE);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`📋 Found ${rows.length} total rows\n`);
  
  // 3. Get existing period summaries
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
  
  // 4. Process rows
  console.log('🔄 Processing rows...\n');
  
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
    categoryBreakdown: Record<string, number>;
  }> = {};
  
  for (const row of rows) {
    const dateStr = row['Date'];
    
    // Skip summary row
    if (!dateStr || dateStr === 'Summary' || dateStr === '-') {
      skipped++;
      continue;
    }
    
    const creatorName = row['Creator username'];
    const productName = row['Product info'];
    const shopName = row['Shop name'];
    const productId = row['Product ID'] && row['Product ID'] !== '-' ? String(row['Product ID']) : null;
    
    // Parse values (new format uses "Affiliate GMV" with $ formatting)
    const gmv = parseCurrency(row['Affiliate GMV']);
    const itemsSold = parseInteger(row['Items sold']);
    const orders = parseInteger(row['Affiliate orders']);
    
    // Estimate commission at 10% if not provided
    let estCommission = gmv > 0 ? Math.round(gmv * 0.10 * 100) / 100 : 0;
    
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
    
    // Track stats
    if (!handleStats[normalizedHandle]) {
      handleStats[normalizedHandle] = { 
        products: 0, 
        gmv: 0, 
        items: 0, 
        orders: 0,
        commission: 0,
        categoryBreakdown: {}
      };
    }
    handleStats[normalizedHandle].products++;
    handleStats[normalizedHandle].gmv += gmv;
    handleStats[normalizedHandle].items += itemsSold;
    handleStats[normalizedHandle].orders += orders;
    handleStats[normalizedHandle].commission += estCommission;
    
    try {
      // Insert using the stored procedure
      const { error } = await admin.rpc('upsert_creator_product_metrics', {
        p_tiktok_handle: normalizedHandle,
        p_date_start: DATE_START,
        p_date_end: DATE_END,
        p_product_id: productId,
        p_product_name: productName,
        p_product_category: 'Uncategorized',
        p_shop_name: shopName || null,
        p_gmv: gmv,
        p_items_sold: itemsSold,
        p_est_commission: estCommission,
        p_orders: orders,
        p_import_source: `Dec29 import`
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
  
  console.log(`\n\n✅ Imported: ${imported} new product records`);
  console.log(`⏭️  Skipped:  ${skipped} rows`);
  console.log(`🚫 Not linked: ${notLinked} rows\n`);
  
  // 5. Update period summaries
  console.log('📊 Updating creator period summaries...\n');
  
  for (const [handle, newStats] of Object.entries(handleStats)) {
    const existing = existingByHandle[handle];
    
    // Combine existing + new
    const combinedGmv = (existing?.total_gmv || 0) + newStats.gmv;
    const combinedItems = (existing?.total_items || 0) + newStats.items;
    const combinedOrders = (existing?.total_orders || 0) + newStats.orders;
    const combinedCommission = (existing?.total_commission || 0) + newStats.commission;
    const combinedProducts = (existing?.product_count || 0) + newStats.products;
    
    // Keep previous comparison values
    const prevGmv = existing?.prev_gmv || 0;
    const prevItems = existing?.prev_items || 0;
    const prevOrders = existing?.prev_orders || 0;
    
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
    
    // Delete old and insert new combined
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
        top_niche: existing?.top_niche || 'Uncategorized',
        top_niche_gmv: existing?.top_niche_gmv || 0,
        import_source: `Combined Nov30-Dec29 (added Dec29)`
      });
    
    if (error) {
      console.log(`   ⚠️ Error saving summary for ${handle}: ${error.message}`);
    }
  }
  
  // 6. Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} new product records (Dec 29)`);
  console.log(`📅 New data range: ${DATE_START} to ${DATE_END}`);
  console.log(`📅 Combined range: ${COMBINED_DATE_START} to ${COMBINED_DATE_END}`);
  console.log(`👤 Creators updated: ${Object.keys(handleStats).length}\n`);
  
  // Show top creators
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv);
  
  console.log(`📊 New Sales Added (Dec 29 only):`);
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.slice(0, 15).forEach(([handle, stats], i) => {
    const existing = existingByHandle[handle];
    const prevGmv = existing?.total_gmv || 0;
    const combinedGmv = prevGmv + stats.gmv;
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(22)} +$${stats.gmv.toFixed(2).padStart(9)} | Total: $${combinedGmv.toFixed(2).padStart(10)} | +${stats.items} items`);
  });
  
  if (errors.length > 0) {
    console.log(`\n⚠️ Errors (${errors.length} total, showing first 5):`);
    errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
  }
  
  console.log('\n✨ December 29 data added successfully!\n');
}

main().catch(console.error);
