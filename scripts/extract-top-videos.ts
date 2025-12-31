import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync('C:\\Users\\gages\\Downloads\\Titans YTD - CAP VIDEOS.csv', 'utf-8');
const rows = parse(csv, { columns: true, skip_empty_lines: true });

// Skip summary row, parse data
const videos = rows
  .filter((r: any) => r['Video ID'] && r['Video ID'] !== '-')
  .map((r: any) => ({
    gmv: parseFloat((r['Affiliate video GMV'] || '0').replace(/[$,]/g, '')) || 0,
    items: parseInt((r['Items sold'] || '0').replace(/,/g, ''), 10) || 0
  }))
  .filter((v: any) => v.gmv > 0)
  .sort((a: any, b: any) => b.gmv - a.gmv);

console.log('Total videos with GMV:', videos.length);
console.log('\n// Top videos data for component:');
console.log('const videoData = [');
videos.forEach((v: any) => {
  console.log(`  { gmv: ${v.gmv}, items: ${v.items} },`);
});
console.log('];');

// Stats
const totalGmv = videos.reduce((sum: number, v: any) => sum + v.gmv, 0);
const totalItems = videos.reduce((sum: number, v: any) => sum + v.items, 0);
const avgGmv = totalGmv / videos.length;
console.log('\n// Stats:');
console.log('// Total GMV:', totalGmv.toFixed(2));
console.log('// Total Items:', totalItems);
console.log('// Avg GMV:', avgGmv.toFixed(2));
console.log('// Video count:', videos.length);

