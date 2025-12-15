/**
 * TikTok Partner Center Report Parser
 * 
 * Parses CSV and XLSX files from TikTok Partner Center's "Custom Report_Creator" export.
 * Handles variations in column names with fuzzy matching.
 * 
 * Designed to be replaced with API sync later without changing the data model.
 */

// Column name mappings: TikTok export variations → our normalized field names
// IMPORTANT: Order matters - more specific matches first, use exact matching
const COLUMN_MAPPINGS: Record<string, string[]> = {
  // Handle/Creator identifier - MUST be exact match
  tiktok_handle: [
    'creator username', 'creator_username', 'creator name', 'creator_name', 
    'tiktok handle', 'tiktok_handle', 'handle', 'username'
  ],
  
  // Date
  date: ['date', 'report date', 'report_date', 'day', 'period'],
  
  // Core metrics - be specific to avoid conflicts
  affiliate_gmv: [
    'affiliate gmv', 'affiliate_gmv', 'total gmv', 'gmv',
    'video direct gmv', 'live direct gmv', 'direct gmv',
    'affiliate video gmv', 'affiliate live gmv'
  ],
  items_sold: [
    'products sold', 'items sold', 'items_sold', 'units sold', 'units', 'quantity'
  ],
  est_commission: [
    'est. commission', 'est commission', 'estimated commission',
    'est_commission', 'commission earned', 'earnings', 'commission'
  ],
  commission_base: [
    'commission base', 'commission_base', 'base commission'
  ],
  
  // Video metrics
  video_ctr: ['video ctr', 'video_ctr'],
  video_ctor: ['video ctor', 'video_ctor'],
  video_rpm: ['video rpm', 'video_rpm'],
  
  // Live metrics
  live_ctr: ['live ctr', 'live_ctr'],
  live_rpm: ['live rpm', 'live_rpm'],
  
  // Additional metrics
  orders: ['direct orders', 'affiliate orders', 'affiliate video orders', 
           'affiliate live orders', 'orders', 'order count', 'total orders'],
  video_views: ['video views', 'video_views', 'views', 'impressions'],
};

// Normalize a column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[_\-\.]/g, ' ');
}

// Find our field name for a given column header
// Uses EXACT matching only to avoid false positives
function mapColumnToField(columnHeader: string): string | null {
  const normalized = normalizeColumnName(columnHeader);
  
  // First pass: exact match only
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.some(v => normalizeColumnName(v) === normalized)) {
      return fieldName;
    }
  }
  
  // Second pass: check if header STARTS WITH any variation (more controlled)
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (const v of variations) {
      const normalizedVariation = normalizeColumnName(v);
      if (normalized.startsWith(normalizedVariation) && normalizedVariation.length >= 4) {
        return fieldName;
      }
    }
  }
  
  return null;
}

// Normalize a TikTok handle (remove @, lowercase, trim)
export function normalizeTikTokHandle(handle: string | null | undefined): string {
  if (!handle) return '';
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// Parse a numeric value (handles currency symbols, commas, percentages)
function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, whitespace
  const cleaned = String(value)
    .replace(/[$€£¥,\s]/g, '')
    .replace(/%$/, ''); // Remove trailing %
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse a date value (handles various formats)
function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  // Handle Excel serial date number
  if (typeof value === 'number') {
    // Excel dates are days since 1900-01-01 (with a bug for 1900 leap year)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Try various date formats
  const dateStr = String(value).trim();
  
  // ISO format: 2025-12-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  
  // US format: 12/01/2025 or 12-01-2025
  const usMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (usMatch) {
    return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }
  
  // Generic parse
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Format date as YYYY-MM-DD for database
function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}

export interface ParsedRow {
  tiktok_handle: string;
  date: string; // YYYY-MM-DD
  affiliate_gmv: number;
  items_sold: number;
  est_commission: number;
  commission_base: number;
  video_ctr: number;
  video_ctor: number;
  video_rpm: number;
  live_ctr: number;
  live_rpm: number;
  orders: number;
  video_views: number;
}

export interface ParseResult {
  success: boolean;
  rows: ParsedRow[];
  errors: string[];
  warnings: string[];
  columnMapping: Record<string, string>; // original header → our field
  unmappedColumns: string[];
  totalRowsProcessed: number;
  validRowCount: number;
}

/**
 * Parse a 2D array of data (from CSV or XLSX)
 * First row should be headers
 */
export function parseReportData(
  data: (string | number | null | undefined)[][],
  reportDate?: Date // Optional: use this date if not in data
): ParseResult {
  const result: ParseResult = {
    success: false,
    rows: [],
    errors: [],
    warnings: [],
    columnMapping: {},
    unmappedColumns: [],
    totalRowsProcessed: 0,
    validRowCount: 0,
  };
  
  if (!data || data.length < 2) {
    result.errors.push('No data rows found in file');
    return result;
  }
  
  // Parse headers (first row)
  const headers = data[0].map(h => String(h || '').trim());
  const columnIndices: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const field = mapColumnToField(header);
    if (field) {
      columnIndices[field] = index;
      result.columnMapping[header] = field;
    } else if (header) {
      result.unmappedColumns.push(header);
    }
  });
  
  // Check for required columns
  const hasHandle = 'tiktok_handle' in columnIndices;
  const hasDate = 'date' in columnIndices || reportDate;
  
  if (!hasHandle) {
    result.errors.push('Missing required column: TikTok handle/creator. Expected columns: ' + 
      COLUMN_MAPPINGS.tiktok_handle.join(', '));
    return result;
  }
  
  if (!hasDate) {
    result.errors.push('Missing required: date column or report date. Expected columns: ' + 
      COLUMN_MAPPINGS.date.join(', '));
    return result;
  }
  
  // Parse data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    result.totalRowsProcessed++;
    
    if (!row || row.every(cell => !cell)) {
      continue; // Skip empty rows
    }
    
    try {
      // Get handle (required)
      const handleValue = row[columnIndices.tiktok_handle];
      const handle = normalizeTikTokHandle(String(handleValue || ''));
      
      if (!handle) {
        result.warnings.push(`Row ${i + 1}: Skipped - empty TikTok handle`);
        continue;
      }
      
      // Skip totals/summary rows (handles like "-", "total", "all", etc.)
      if (handle === '-' || handle === 'total' || handle === 'all' || handle.length < 2) {
        result.warnings.push(`Row ${i + 1}: Skipped - totals/summary row`);
        continue;
      }
      
      // Get date
      let dateValue: Date | null = null;
      if ('date' in columnIndices) {
        dateValue = parseDate(row[columnIndices.date]);
      }
      dateValue = dateValue || reportDate || null;
      
      if (!dateValue) {
        result.warnings.push(`Row ${i + 1}: Skipped - could not parse date`);
        continue;
      }
      
      // Build the parsed row
      const parsedRow: ParsedRow = {
        tiktok_handle: handle,
        date: formatDateForDB(dateValue),
        affiliate_gmv: 'affiliate_gmv' in columnIndices 
          ? parseNumeric(row[columnIndices.affiliate_gmv]) : 0,
        items_sold: 'items_sold' in columnIndices 
          ? Math.round(parseNumeric(row[columnIndices.items_sold])) : 0,
        est_commission: 'est_commission' in columnIndices 
          ? parseNumeric(row[columnIndices.est_commission]) : 0,
        commission_base: 'commission_base' in columnIndices 
          ? parseNumeric(row[columnIndices.commission_base]) : 0,
        video_ctr: 'video_ctr' in columnIndices 
          ? parseNumeric(row[columnIndices.video_ctr]) : 0,
        video_ctor: 'video_ctor' in columnIndices 
          ? parseNumeric(row[columnIndices.video_ctor]) : 0,
        video_rpm: 'video_rpm' in columnIndices 
          ? parseNumeric(row[columnIndices.video_rpm]) : 0,
        live_ctr: 'live_ctr' in columnIndices 
          ? parseNumeric(row[columnIndices.live_ctr]) : 0,
        live_rpm: 'live_rpm' in columnIndices 
          ? parseNumeric(row[columnIndices.live_rpm]) : 0,
        orders: 'orders' in columnIndices 
          ? Math.round(parseNumeric(row[columnIndices.orders])) : 0,
        video_views: 'video_views' in columnIndices 
          ? Math.round(parseNumeric(row[columnIndices.video_views])) : 0,
      };
      
      result.rows.push(parsedRow);
      result.validRowCount++;
      
    } catch (err) {
      result.warnings.push(`Row ${i + 1}: Error parsing - ${err}`);
    }
  }
  
  result.success = result.validRowCount > 0;
  
  if (result.unmappedColumns.length > 0) {
    result.warnings.push(`Ignored unknown columns: ${result.unmappedColumns.join(', ')}`);
  }
  
  return result;
}

/**
 * Try to extract a date from a filename like "CustomReport_Creator 2025-12-01_2025-12-14.xlsx"
 * Returns the end date (most recent) if a range is found
 */
export function extractDateFromFilename(filename: string): Date | null {
  if (!filename) return null;
  
  // Match YYYY-MM-DD patterns
  const dateMatches = filename.match(/(\d{4}-\d{2}-\d{2})/g);
  
  if (dateMatches && dateMatches.length > 0) {
    // Take the last date (end of range)
    const dateStr = dateMatches[dateMatches.length - 1];
    const parsed = new Date(dateStr + 'T00:00:00');
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}
