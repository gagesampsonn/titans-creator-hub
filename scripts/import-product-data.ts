/**
 * Script to import product metrics from TikTok Partner Center Excel export
 * 
 * Usage: npx tsx scripts/import-product-data.ts <excel-file-path>
 * 
 * Example: npx tsx scripts/import-product-data.ts "C:\Users\gages\Downloads\CustomReport_Creator_Product_Shop_Product Category 2025-12-01_2025-12-14.xlsx"
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

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

// Extract date range from filename
function extractDateRange(filename: string): { start: string; end: string } {
  // Try to match pattern like 2025-12-01_2025-12-14
  const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  // Default to current import date range
  return { start: '2024-12-01', end: '2024-12-14' };
}

async function importProductData(filePath: string) {
  console.log('📊 TikTok Product Metrics Import Tool\n');
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  console.log(`📁 Reading: ${filename}`);

  // Extract date range from filename
  const dateRange = extractDateRange(filename);
  console.log(`📅 Date range: ${dateRange.start} to ${dateRange.end}`);

  // Read Excel file
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`\n📋 Found ${rows.length} rows in sheet "${sheetName}"\n`);

  if (rows.length === 0) {
    console.error('❌ No data found in spreadsheet');
    process.exit(1);
  }

  // Show sample of first row to understand structure
  console.log('📝 Sample row structure:');
  console.log(JSON.stringify(rows[0], null, 2));
  console.log('\n');

  // Initialize Supabase client
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Process each row
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const handleStats: Record<string, { products: number; gmv: number }> = {};

  for (const row of rows as Record<string, any>[]) {
    // Map columns - these match TikTok Partner Center Custom Report format
    const creatorName = row['Creator name'] || row['Creator'] || row['creator_name'] || row['tiktok_handle'] || row['Handle'];
    const productName = row['Product name'] || row['Product'] || row['product_name'];
    const shopName = row['Shop name'] || row['Shop'] || row['shop_name'];
    const productCategory = row['Product category'] || row['Category'] || row['product_category'];
    const gmv = parseCurrency(row['GMV'] || row['Affiliate GMV'] || row['gmv'] || row['affiliate_gmv']);
    const itemsSold = parseInteger(row['Items sold'] || row['items_sold'] || row['Quantity']);
    const estCommission = parseCurrency(row['Est. commission'] || row['Commission'] || row['est_commission']);
    const orders = parseInteger(row['Orders'] || row['orders'] || 0);
    
    // Skip rows without creator or product name
    if (!creatorName || !productName) {
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
        p_import_source: filename
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
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Imported: ${imported} product records`);
  console.log(`⏭️  Skipped:  ${skipped} rows (0 GMV/items or missing data)`);
  console.log(`📅 Date range: ${dateRange.start} to ${dateRange.end}`);
  console.log(`👤 Unique creators: ${Object.keys(handleStats).length}\n`);

  // Show top creators by GMV
  const sortedCreators = Object.entries(handleStats)
    .sort((a, b) => b[1].gmv - a[1].gmv)
    .slice(0, 10);

  console.log('🏆 Top 10 Creators by GMV:');
  console.log('───────────────────────────────────────────────────────────');
  sortedCreators.forEach(([handle, stats], i) => {
    console.log(`${(i + 1).toString().padStart(2)}. @${handle.padEnd(25)} $${stats.gmv.toFixed(2).padStart(10)} (${stats.products} products)`);
  });

  if (errors.length > 0) {
    console.log('\n⚠️ Errors (first 10):');
    errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✨ Import complete!\n');
}

// Run the import
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx tsx scripts/import-product-data.ts <excel-file-path>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/import-product-data.ts "C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop_Product Category 2025-12-01_2025-12-14.xlsx"');
  process.exit(1);
}

importProductData(args[0]).catch(console.error);
