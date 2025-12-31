import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const content = fs.readFileSync('C:\\Users\\gages\\Downloads\\Titans YTD - CAP VIDEOS.csv', 'utf-8');
const records = parse(content, { columns: true, skip_empty_lines: true });

interface VideoData {
  gmv: number;
  items: number;
}

const videos: VideoData[] = [];

for (const record of records) {
  // Skip summary row
  if (record['Video ID'] === '-') continue;
  
  const gmvStr = record['Affiliate video GMV'] || '';
  const itemsStr = record['Items sold'] || '';
  
  const gmv = parseFloat(gmvStr.replace(/[$,]/g, '')) || 0;
  const items = parseInt(itemsStr.replace(/,/g, '')) || 0;
  
  if (gmv > 0) {
    videos.push({ gmv, items });
  }
}

// Sort by GMV descending
videos.sort((a, b) => b.gmv - a.gmv);

console.log('Total videos:', videos.length);
console.log('Total GMV:', videos.reduce((s, v) => s + v.gmv, 0).toFixed(2));
console.log('Total Items:', videos.reduce((s, v) => s + v.items, 0));

// Output as TypeScript array for the component
console.log('\n// Copy this data to the component:');
console.log('const videoData = [');
for (const v of videos) {
  console.log(`  { gmv: ${v.gmv}, items: ${v.items} },`);
}
console.log('];');

