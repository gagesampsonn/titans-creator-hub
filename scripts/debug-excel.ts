import * as XLSX from 'xlsx';
import * as fs from 'fs';

const buffer = fs.readFileSync('C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-29_2025-12-29.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
console.log('Sheet names:', workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', rows.length);
console.log('Column names:', Object.keys(rows[0] || {}));
console.log('');
console.log('First 3 rows:');
rows.slice(0, 3).forEach((r: any, i: number) => {
  console.log(`Row ${i}:`, JSON.stringify(r, null, 2));
});

