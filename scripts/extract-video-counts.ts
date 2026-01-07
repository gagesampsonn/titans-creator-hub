/**
 * Extract video counts per creator+product from the video data
 * Output: JSON file that dashboard can import
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Video_Product_Shop_Product Category 2025-12-01_2026-01-06.xlsx';
const LINKED_CREATORS_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\linked_creators.csv';
const OUTPUT_FILE = 'C:\\Users\\gages\\titans-creator-hub\\data\\video-counts.json';

function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

console.log('📊 Extracting Video Counts per Product\n');

// Load linked creators
console.log('📁 Loading linked creators...');
const linkedCreatorsRaw = fs.readFileSync(LINKED_CREATORS_FILE, 'utf-8');
const linkedCreatorsData = parse(linkedCreatorsRaw, { columns: true, skip_empty_lines: true });
const linkedHandles = new Set<string>(
  linkedCreatorsData.map((row: any) => normalizeHandle(row.tiktok_handle))
);
console.log(`✅ Loaded ${linkedHandles.size} linked creators\n`);

// Read Excel file
console.log(`📁 Reading: ${EXCEL_FILE}`);
const buffer = fs.readFileSync(EXCEL_FILE);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
console.log(`📋 Found ${rows.length} total rows\n`);

// Count unique videos per product per creator
// Key: handle:productName -> Set of video IDs
const productVideoMap: Map<string, Set<string>> = new Map();

for (const row of rows as Record<string, any>[]) {
  const creatorName = row['Creator username'];
  const productName = row['Product info'];
  const videoId = row['Video ID'];
  
  // Skip summary rows
  if (!creatorName || creatorName === '-' || !productName || productName === '-' || !videoId || videoId === '-') {
    continue;
  }
  
  const normalizedHandle = normalizeHandle(creatorName);
  if (!normalizedHandle || !linkedHandles.has(normalizedHandle)) {
    continue;
  }
  
  const key = `${normalizedHandle}:::${productName}`;
  if (!productVideoMap.has(key)) {
    productVideoMap.set(key, new Set());
  }
  productVideoMap.get(key)!.add(String(videoId));
}

console.log(`📊 Found ${productVideoMap.size} unique creator-product combinations\n`);

// Convert to output format: { "handle:::productName": videoCount }
const output: Record<string, number> = {};
for (const [key, videos] of productVideoMap) {
  output[key] = videos.size;
}

// Save to JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`✅ Saved to ${OUTPUT_FILE}\n`);

// Show examples
console.log('📊 Sample video counts (top 20 by count):');
console.log('───────────────────────────────────────────────────────────');

const sorted = Object.entries(output).sort((a, b) => b[1] - a[1]).slice(0, 20);
sorted.forEach(([key, count], i) => {
  const [handle, productName] = key.split(':::');
  console.log(`${(i+1).toString().padStart(2)}. @${handle.padEnd(22)} ${count} videos -> ${productName.substring(0, 40)}...`);
});

console.log(`\n✨ Done! ${Object.keys(output).length} products with video counts`);

