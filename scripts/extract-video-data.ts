import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync('C:\\Users\\gages\\Downloads\\Titans YTD - CAP VIDEOS.csv', 'utf-8');
const rows = parse(csv, { columns: true, skip_empty_lines: true });

const videos = rows
  .filter((r: any) => r['Video ID'] && r['Video ID'] !== '-' && r['Affiliate video GMV'])
  .map((r: any) => {
    const gmvStr = r['Affiliate video GMV'] || '0';
    const gmv = parseFloat(gmvStr.replace(/[$,]/g, '')) || 0;
    const items = parseInt(r['Items sold']?.replace(/,/g, '') || '0') || 0;
    return { gmv, items };
  })
  .filter((v: any) => v.gmv > 0)
  .sort((a: any, b: any) => b.gmv - a.gmv);

console.log('Total videos:', videos.length);
console.log('\nTop 15:');
videos.slice(0, 15).forEach((v: any, i: number) => {
  console.log(`${i + 1}. GMV: $${v.gmv.toFixed(2)}, Items: ${v.items}`);
});

// Stats
const totalGMV = videos.reduce((s: number, v: any) => s + v.gmv, 0);
const totalItems = videos.reduce((s: number, v: any) => s + v.items, 0);
const avgGMV = totalGMV / videos.length;
const sortedGMV = videos.map((v: any) => v.gmv).sort((a: number, b: number) => a - b);
const medianGMV = sortedGMV[Math.floor(sortedGMV.length / 2)];
const highestGMV = videos[0].gmv;

console.log('\n--- STATS ---');
console.log('Total Videos:', videos.length);
console.log('Total GMV: $' + totalGMV.toFixed(2));
console.log('Total Items:', totalItems);
console.log('Avg GMV: $' + avgGMV.toFixed(2));
console.log('Median GMV: $' + medianGMV.toFixed(2));
console.log('Highest GMV: $' + highestGMV.toFixed(2));

// Output JSON array for component
console.log('\n--- JSON DATA ---');
const jsonData = videos.map((v: any) => ({ gmv: Math.round(v.gmv * 100) / 100, items: v.items }));
fs.writeFileSync('C:\\Users\\gages\\titans-creator-hub\\data\\top-videos-2025.json', JSON.stringify(jsonData, null, 2));
console.log('Saved to data/top-videos-2025.json');

