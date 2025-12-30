import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDollar(val: any): number {
  if (typeof val === 'number') return val;
  if (!val || val === '-' || val === '--') return 0;
  return parseFloat(String(val).replace(/[$,]/g, '')) || 0;
}

// Load linked creators
const csvContent = fs.readFileSync(path.join(__dirname, '..', 'data', 'linked_creators.csv'), 'utf-8');
const linkedCreators: any[] = parse(csvContent, { columns: true, skip_empty_lines: true });

const creatorMap = new Map<string, string>();
linkedCreators.forEach((c: any) => {
  const handle = c.tiktok_handle.toLowerCase().replace('@', '');
  creatorMap.set(handle, c.user_id);
});

// Load Excel
const buffer = fs.readFileSync('C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-29_2025-12-29.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

console.log('Processing rows...\n');

let matched = 0;
let noSales = 0;
let notLinked = 0;
let summarySkip = 0;

for (let i = 0; i < Math.min(rows.length, 20); i++) {
  const row = rows[i];
  
  // Skip summary row
  if (row['Date'] === 'Summary' || row['Creator username'] === '-') {
    console.log(`Row ${i}: SKIP (summary)`);
    summarySkip++;
    continue;
  }
  
  const creatorName = (row['Creator username'] || '').toLowerCase().replace('@', '');
  const userId = creatorMap.get(creatorName);
  
  if (!userId) {
    console.log(`Row ${i}: NOT LINKED - "${creatorName}"`);
    notLinked++;
    continue;
  }
  
  const gmv = parseDollar(row['Affiliate GMV']);
  const units = Number(row['Items sold']) || 0;
  
  if (gmv === 0 && units === 0) {
    console.log(`Row ${i}: NO SALES - "${creatorName}" GMV=$${gmv} units=${units}`);
    noSales++;
    continue;
  }
  
  console.log(`Row ${i}: ✅ MATCH - "${creatorName}" GMV=$${gmv} units=${units}`);
  matched++;
}

console.log('\n--- SUMMARY (first 20 rows) ---');
console.log(`Summary rows skipped: ${summarySkip}`);
console.log(`Not linked: ${notLinked}`);
console.log(`No sales: ${noSales}`);
console.log(`Matched: ${matched}`);

