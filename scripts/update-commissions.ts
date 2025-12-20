/**
 * Update Commission Data from Creator Summary File
 * 
 * This reads the Creator summary Excel (which has Est. commission column)
 * and updates the creator_period_summary table with actual commission values.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const COMMISSION_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator 2025-12-01_2025-12-19.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function main() {
  console.log('💰 Updating Commission Data\n');

  // Load linked creators
  console.log('📁 Loading linked creators...');
  const csvContent = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
  const csvRecords = parse(csvContent, { columns: true, skip_empty_lines: true });
  const linkedHandles = new Set<string>();
  for (const record of csvRecords) {
    const handle = normalizeHandle(record.tiktok_handle || record.handle);
    if (handle) linkedHandles.add(handle);
  }
  console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);

  // Read commission file
  console.log(`📁 Reading: ${path.basename(COMMISSION_FILE)}`);
  const workbook = XLSX.readFile(COMMISSION_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as any[];
  console.log(`📋 Found ${rows.length} rows\n`);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let updated = 0;
  let skipped = 0;

  console.log('📥 Updating commissions...\n');

  for (const row of rows) {
    const username = row['Creator username'];
    if (!username || username === '-') continue;

    const normalizedHandle = normalizeHandle(username);
    if (!linkedHandles.has(normalizedHandle)) {
      skipped++;
      continue;
    }

    const commission = parseCurrency(row['Est. commission']);
    if (commission <= 0) continue;

    // Update the period summary with actual commission
    const { error } = await admin
      .from('creator_period_summary')
      .update({ total_commission: commission })
      .eq('tiktok_handle', normalizedHandle)
      .eq('date_start', '2025-12-01')
      .eq('date_end', '2025-12-19');

    if (error) {
      console.error(`  ❌ ${normalizedHandle}: ${error.message}`);
    } else {
      console.log(`  ✅ @${normalizedHandle}: $${commission.toLocaleString()}`);
      updated++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    UPDATE COMPLETE                         ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n✅ Updated: ${updated} creators with actual commission data`);
  console.log(`⏭️  Skipped: ${skipped} (not linked)\n`);
}

main().catch(console.error);
