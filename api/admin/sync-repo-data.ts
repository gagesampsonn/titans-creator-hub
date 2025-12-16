/**
 * POST /api/admin/sync-repo-data
 * 
 * Syncs data from repo files to Supabase:
 * - data/linked_creators.csv → linked_creators table
 * - data/imports/*.csv → creator_daily_metrics table
 * 
 * Protected by x-admin-sync-key header matching ADMIN_SYNC_KEY env var.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SYNC_KEY = process.env.ADMIN_SYNC_KEY || '';

// Normalize handle: lowercase, trim, remove @
function normalizeHandle(handle: string): string {
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// Check if handle should be skipped (summary rows)
function shouldSkipHandle(handle: string): boolean {
  const normalized = normalizeHandle(handle);
  if (!normalized || normalized.length < 2) return true;
  if (['-', 'total', 'all', 'sum', 'average'].includes(normalized)) return true;
  if (normalized.startsWith('-')) return true;
  return false;
}

// Parse currency string to number
function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse percentage string to number  
function parsePercent(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/%/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse integer
function parseInt2(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// Simple CSV parser
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

// Extract date range from filename like metrics_2024-12-01_2024-12-14.csv
function extractDateFromFilename(filename: string): string | null {
  // Look for date patterns YYYY-MM-DD
  const matches = filename.match(/(\d{4}-\d{2}-\d{2})/g);
  if (matches && matches.length > 0) {
    // Return the last date (end of range)
    return matches[matches.length - 1];
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin key
  const syncKey = req.headers['x-admin-sync-key'];
  if (!ADMIN_SYNC_KEY || syncKey !== ADMIN_SYNC_KEY) {
    return res.status(401).json({ error: 'Unauthorized - invalid or missing x-admin-sync-key' });
  }

  // Check Supabase config
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results = {
    linkedCreators: { synced: 0, errors: [] as string[] },
    metrics: { synced: 0, skipped: 0, errors: [] as string[], file: '' },
  };

  try {
    // Find the data directory - in Vercel it's at the project root
    const dataDir = path.join(process.cwd(), 'data');
    
    // 1. Sync linked_creators.csv
    const linkedCreatorsPath = path.join(dataDir, 'linked_creators.csv');
    if (fs.existsSync(linkedCreatorsPath)) {
      const content = fs.readFileSync(linkedCreatorsPath, 'utf-8');
      const rows = parseCSV(content);
      
      // Find header row and tiktok_handle column
      const headers = rows[0]?.map(h => h.toLowerCase().trim()) || [];
      const handleIndex = headers.indexOf('tiktok_handle');
      
      if (handleIndex === -1) {
        results.linkedCreators.errors.push('No tiktok_handle column found');
      } else {
        for (let i = 1; i < rows.length; i++) {
          const handle = normalizeHandle(rows[i][handleIndex] || '');
          if (shouldSkipHandle(handle)) continue;
          
          const { error } = await supabase
            .from('linked_creators')
            .upsert({ tiktok_handle: handle }, { onConflict: 'tiktok_handle' });
          
          if (error) {
            results.linkedCreators.errors.push(`${handle}: ${error.message}`);
          } else {
            results.linkedCreators.synced++;
          }
        }
      }
    } else {
      results.linkedCreators.errors.push('linked_creators.csv not found');
    }

    // 2. Find newest metrics file in data/imports/
    const importsDir = path.join(dataDir, 'imports');
    if (fs.existsSync(importsDir)) {
      const files = fs.readdirSync(importsDir)
        .filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'))
        .sort()
        .reverse(); // Newest first by name
      
      if (files.length > 0) {
        const newestFile = files[0];
        results.metrics.file = newestFile;
        
        const filePath = path.join(importsDir, newestFile);
        const reportDate = extractDateFromFilename(newestFile) || new Date().toISOString().split('T')[0];
        
        // Only support CSV for simplicity
        if (newestFile.endsWith('.csv')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const rows = parseCSV(content);
          
          if (rows.length < 2) {
            results.metrics.errors.push('No data rows in file');
          } else {
            // Parse headers - EXACT matching only
            const headers = rows[0].map(h => h.toLowerCase().trim());
            
            // Find exact column indices
            const colMap: Record<string, number> = {};
            headers.forEach((h, i) => {
              if (h === 'creator username') colMap.handle = i;
              else if (h === 'affiliate gmv') colMap.gmv = i;
              else if (h === 'items sold') colMap.items = i;
              else if (h === 'est. commission') colMap.commission = i;
              else if (h === 'video ctr') colMap.videoCtr = i;
              else if (h === 'views') colMap.views = i;
              else if (h === 'affiliate orders') colMap.orders = i;
            });
            
            if (colMap.handle === undefined) {
              results.metrics.errors.push('No "Creator username" column found');
            } else {
              // Process data rows
              for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const handle = normalizeHandle(row[colMap.handle] || '');
                
                if (shouldSkipHandle(handle)) {
                  results.metrics.skipped++;
                  continue;
                }
                
                const metric = {
                  tiktok_handle: handle,
                  date: reportDate,
                  affiliate_gmv: colMap.gmv !== undefined ? parseCurrency(row[colMap.gmv]) : 0,
                  items_sold: colMap.items !== undefined ? parseInt2(row[colMap.items]) : 0,
                  est_commission: colMap.commission !== undefined ? parseCurrency(row[colMap.commission]) : 0,
                  video_ctr: colMap.videoCtr !== undefined ? parsePercent(row[colMap.videoCtr]) : 0,
                  video_views: colMap.views !== undefined ? parseInt2(row[colMap.views]) : 0,
                  orders: colMap.orders !== undefined ? parseInt2(row[colMap.orders]) : 0,
                };
                
                const { error } = await supabase
                  .from('creator_daily_metrics')
                  .upsert(metric, { onConflict: 'tiktok_handle,date' });
                
                if (error) {
                  results.metrics.errors.push(`${handle}: ${error.message}`);
                } else {
                  results.metrics.synced++;
                }
              }
            }
          }
        } else {
          results.metrics.errors.push('XLSX not supported yet - please convert to CSV');
        }
      } else {
        results.metrics.errors.push('No files in data/imports/');
      }
    } else {
      results.metrics.errors.push('data/imports/ directory not found');
    }

    return res.status(200).json({
      success: true,
      results,
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      results,
    });
  }
}
