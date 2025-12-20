/**
 * POST /api/admin/import-product-metrics
 * 
 * Imports product metrics data from TikTok Partner Center Custom Report.
 * Admin only endpoint - parses uploaded XLSX and upserts product metrics.
 * 
 * Expected file: CustomReport_Creator_Product_Shop_Product Category XLSX
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const ADMIN_EMAILS = ['gagesampson2016@gmail.com'];

// Normalize TikTok handle (lowercase, no @)
function normalizeHandle(handle: string | undefined | null): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// Parse currency string to number
function parseCurrency(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Parse integer
function parseInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return 0;
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check admin
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get request body - expect base64 encoded file and date range
  const { fileData, fileName, dateStart, dateEnd } = req.body;
  
  if (!fileData) {
    return res.status(400).json({ error: 'Missing fileData (base64 encoded XLSX)' });
  }

  if (!dateStart || !dateEnd) {
    return res.status(400).json({ error: 'Missing dateStart or dateEnd' });
  }

  try {
    // Parse the Excel file
    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in spreadsheet' });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Process each row
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows as Record<string, any>[]) {
      // Map columns - these match TikTok Partner Center Custom Report format
      // Columns: Creator name, Product name, Shop name, Product category, GMV, Items sold, Est. commission, etc.
      const creatorName = row['Creator name'] || row['Creator'] || row['creator_name'] || row['tiktok_handle'];
      const productName = row['Product name'] || row['Product'] || row['product_name'];
      const shopName = row['Shop name'] || row['Shop'] || row['shop_name'];
      const productCategory = row['Product category'] || row['Category'] || row['product_category'];
      const gmv = parseCurrency(row['GMV'] || row['Affiliate GMV'] || row['gmv'] || row['affiliate_gmv']);
      const itemsSold = parseInteger(row['Items sold'] || row['items_sold'] || row['Quantity']);
      const estCommission = parseCurrency(row['Est. commission'] || row['Commission'] || row['est_commission']);
      const orders = parseInteger(row['Orders'] || row['orders'] || 0);
      
      // Skip rows without creator or product name
      if (!creatorName || !productName) {
        skipped++;
        continue;
      }

      // Skip rows with 0 GMV and 0 items sold
      if (gmv === 0 && itemsSold === 0) {
        skipped++;
        continue;
      }

      const normalizedHandle = normalizeHandle(creatorName);
      if (!normalizedHandle) {
        skipped++;
        continue;
      }

      try {
        // Upsert the product metrics using the stored function
        const { error } = await admin.rpc('upsert_creator_product_metrics', {
          p_tiktok_handle: normalizedHandle,
          p_date_start: dateStart,
          p_date_end: dateEnd,
          p_product_id: null,
          p_product_name: productName,
          p_product_category: productCategory || 'Uncategorized',
          p_shop_name: shopName || null,
          p_gmv: gmv,
          p_items_sold: itemsSold,
          p_est_commission: estCommission,
          p_orders: orders,
          p_import_source: fileName || 'manual_import'
        });

        if (error) {
          errors.push(`Row ${imported + skipped + 1}: ${error.message}`);
          skipped++;
        } else {
          imported++;
        }
      } catch (err: any) {
        errors.push(`Row ${imported + skipped + 1}: ${err.message}`);
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      dateRange: { start: dateStart, end: dateEnd },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    });

  } catch (err: any) {
    console.error('Import error:', err);
    return res.status(500).json({ 
      error: 'Failed to parse spreadsheet',
      details: err.message 
    });
  }
}
