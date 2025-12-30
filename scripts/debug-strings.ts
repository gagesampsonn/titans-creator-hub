import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load linked creators
const csvContent = fs.readFileSync(path.join(__dirname, '..', 'data', 'linked_creators.csv'), 'utf-8');
const linkedCreators: any[] = parse(csvContent, { columns: true, skip_empty_lines: true });

const creatorMap = new Map<string, string>();
linkedCreators.forEach((c: any) => {
  const handle = c.tiktok_handle.toLowerCase().replace('@', '');
  creatorMap.set(handle, c.user_id);
});

console.log('CSV handles in map:');
for (const [handle, _] of creatorMap) {
  console.log(`  "${handle}" (length: ${handle.length}, chars: ${[...handle].map(c => c.charCodeAt(0)).join(',')})`);
  if (handle === 'shopaholicismyname') {
    console.log('    ^ FOUND shopaholicismyname in CSV map!');
  }
}

// Load Excel
const buffer = fs.readFileSync('C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-29_2025-12-29.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

console.log('\nExcel username from row 1:');
const excelUsername = (rows[1]['Creator username'] || '').toLowerCase().replace('@', '');
console.log(`  "${excelUsername}" (length: ${excelUsername.length}, chars: ${[...excelUsername].map((c: string) => c.charCodeAt(0)).join(',')})`);

console.log('\nDirect comparison:');
console.log(`  creatorMap.has("shopaholicismyname"): ${creatorMap.has('shopaholicismyname')}`);
console.log(`  creatorMap.get("shopaholicismyname"): ${creatorMap.get('shopaholicismyname')}`);
console.log(`  creatorMap.has(excelUsername): ${creatorMap.has(excelUsername)}`);
console.log(`  excelUsername === "shopaholicismyname": ${excelUsername === 'shopaholicismyname'}`);

