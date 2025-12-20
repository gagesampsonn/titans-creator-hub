/**
 * Import Creator Commission Data
 * 
 * This script imports commission data from the Creator report
 * and updates the creator_period_summary table with actual commission values.
 * 
 * Usage: npx ts-node scripts/import-creator-commission.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

// File paths
const CREATOR_REPORT = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator 2025-12-01_2025-12-19.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

// Fixed date range
const DATE_START = '2025-12-01';
const DATE_END = '2025-12-19';

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

function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

async function importCreatorCommission() {
  console.log('💰 Importing Creator Commission Data\n');
  console.log(`📁 File: ${path.basename(CREATOR_REPORT)}`);
  console.log(`📅 Period: ${DATE_START} to ${DATE_END}\n`);

  // Load linked creators
  console.log('📁 Loading linked creators...');
  const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>(
    linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
  );
  console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);

  // Read Excel file
  if (!fs.existsSync(CREATOR_REPORT)) {
    console.error(`❌ File not found: ${CREATOR_REPORT}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(CREATOR_REPORT);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`📋 Found ${rows.length} rows in report\n`);

  // Initialize Supabase
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let updated = 0;
  let skipped = 0;
  let notLinked = 0;
  const updates: { handle: string; commission: number; gmv: number }[] = [];

  for (const row of rows as Record<string, any>[]) {
    const dateStr = row['Date'];
    
    // Skip summary row
    if (!dateStr || dateStr === 'Summary' || dateStr === '-') {
      skipped++;
      continue;
    }

    const creatorName = row['Creator username'];
    if (!creatorName || creatorName === '-') {
      skipped++;
      continue;
    }

    const normalizedHandle = normalizeHandle(creatorName);
    if (!normalizedHandle) {
      skipped++;
      continue;
    }

    // Only update linked creators
    if (!linkedHandles.has(normalizedHandle)) {
      notLinked++;
      continue;
    }

    // Parse commission data
    const estCommission = parseCurrency(row['Est. commission']);
    const affiliateGmv = parseCurrency(row['Affiliate GMV']);
    const itemsSold = parseInteger(row['Items sold']);

    if (estCommission === 0 && affiliateGmv === 0) {
      skipped++;
      continue;
    }

    updates.push({
      handle: normalizedHandle,
      commission: estCommission,
      gmv: affiliateGmv
    });
  }

  console.log(`📊 Found ${updates.length} creators with commission data\n`);
  console.log('Updating creator_period_summary with actual commission...\n');

  // Aggregate by handle (in case of multiple rows per creator)
  const aggregated: Record<string, { commission: number; gmv: number }> = {};
  for (const u of updates) {
    if (!aggregated[u.handle]) {
      aggregated[u.handle] = { commission: 0, gmv: 0 };
    }
    aggregated[u.handle].commission += u.commission;
    aggregated[u.handle].gmv += u.gmv;
  }

  // Update each creator's period summary
  for (const [handle, data] of Object.entries(aggregated)) {
    const { error } = await admin
      .from('creator_period_summary')
      .update({ 
        total_commission: data.commission
      })
      .eq('tiktok_handle', handle)
      .eq('date_start', DATE_START)
      .eq('date_end', DATE_END);

    if (error) {
      console.log(`  ❌ ${handle}: ${error.message}`);
    } else {
      console.log(`  ✅ ${handle}: $${data.commission.toFixed(2)} commission (GMV: $${data.gmv.toFixed(2)})`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Updated: ${updated} creators`);
  console.log(`⏭️  Skipped: ${skipped} rows`);
  console.log(`🔗 Not linked: ${notLinked} creators`);
  console.log('='.repeat(50));
}

importCreatorCommission().catch(console.error);
