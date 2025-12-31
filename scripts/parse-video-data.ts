import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync('C:\\Users\\gages\\Downloads\\Titans YTD - CAP VIDEOS.csv', 'utf-8');
const rows = parse(csv, { columns: true, skip_empty_lines: true });

// Skip summary row, parse data
const data = rows.slice(1).map((r: any) => ({
  gmv: parseFloat(String(r['Affiliate video GMV'] || '0').replace(/[$,]/g, '')) || 0,
  items: parseInt(String(r['Items sold'] || '0').replace(/,/g, ''), 10) || 0
})).filter((d: any) => d.gmv > 0);

// Sort by GMV descending
data.sort((a: any, b: any) => b.gmv - a.gmv);

console.log('Total videos:', data.length);
console.log('Total GMV:', data.reduce((sum: number, d: any) => sum + d.gmv, 0));
console.log('Total Items:', data.reduce((sum: number, d: any) => sum + d.items, 0));

console.log('\nTop 30:');
data.slice(0, 30).forEach((d: any, i: number) => console.log(`${i+1}. $${d.gmv.toFixed(2)} - ${d.items} items`));

// Output as JSON array for the component
console.log('\n\n// Copy this array into the component:');
console.log('const videoData: VideoData[] = [');
data.forEach((d: any) => console.log(`  { gmv: ${d.gmv}, items: ${d.items} },`));
console.log('];');

