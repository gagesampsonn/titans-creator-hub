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

console.log('=== LINKED CREATORS (from CSV) ===');
linkedCreators.forEach(c => {
  console.log(`  ${c.tiktok_handle.toLowerCase().replace('@', '')}`);
});

// Load Excel
const buffer = fs.readFileSync('C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-29_2025-12-29.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

// Get unique creator usernames from Excel
const excelCreators = new Set<string>();
rows.forEach((r: any) => {
  if (r['Creator username'] && r['Creator username'] !== '-') {
    excelCreators.add(r['Creator username'].toLowerCase().replace('@', ''));
  }
});

console.log('\n=== CREATORS IN EXCEL ===');
[...excelCreators].sort().forEach(c => console.log(`  ${c}`));

// Find matches
const linkedSet = new Set(linkedCreators.map(c => c.tiktok_handle.toLowerCase().replace('@', '')));
const matches = [...excelCreators].filter(c => linkedSet.has(c));

console.log('\n=== MATCHES ===');
matches.forEach(c => console.log(`  ✅ ${c}`));
console.log(`\nTotal matches: ${matches.length} / ${linkedSet.size} linked creators`);

