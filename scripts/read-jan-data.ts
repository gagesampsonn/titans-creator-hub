import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-01_2026-01-04.xlsx';
console.log('Reading:', filePath);
console.log('File exists:', fs.existsSync(filePath));

const buffer = fs.readFileSync(filePath);
console.log('Buffer size:', buffer.length);

const workbook = XLSX.read(buffer, { type: 'buffer' });
console.log('Sheets:', workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', rows.length);
if (rows.length > 0) {
  const cols = Object.keys(rows[0] as object);
  console.log('\nColumns:', cols.length);
  cols.forEach(c => console.log('  -', c));
  
  console.log('\nFirst row sample:');
  const first = rows[0] as any;
  console.log('  Creator:', first['Creator username']);
  console.log('  GMV:', first['Affiliate GMV']);
  console.log('  Items:', first['Items sold']);
}

