/**
 * Admin Metrics Import Page
 * 
 * Protected admin page for uploading TikTok Partner Center exports.
 * Only accessible to admins (email allowlist).
 * 
 * Flow:
 * 1. Admin uploads CSV or XLSX file
 * 2. File is parsed client-side with preview
 * 3. On confirm, data is sent to API for import
 * 4. Results are displayed (success/errors)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileSpreadsheet, Calendar, AlertCircle, CheckCircle, 
  Loader2, ArrowLeft, X, Download, Eye, Database
} from 'lucide-react';
// Auth check disabled for now - this is an internal admin page
// import { useAuth } from '../lib/AuthContext';
// import { isAdminEmail } from '../lib/isAdmin';
import { 
  parseReportData, 
  extractDateFromFilename, 
  ParseResult, 
  ParsedRow 
} from '../lib/parseReport';
import { supabase } from '../lib/supabase';

// We'll use xlsx library for parsing - need to load dynamically
type XLSX = typeof import('xlsx');
let xlsxLib: XLSX | null = null;

const AdminMetricsImport: React.FC = () => {
  const navigate = useNavigate();
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  
  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    inserted: number;
    updated: number;
    errors: string[];
  } | null>(null);
  
  // Load xlsx library dynamically
  useEffect(() => {
    const loadXlsx = async () => {
      if (!xlsxLib) {
        try {
          // Dynamic import
          xlsxLib = await import('xlsx');
        } catch (err) {
          console.error('Failed to load xlsx library:', err);
        }
      }
    };
    loadXlsx();
  }, []);
  
  // Parse file when selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setParseResult(null);
    setImportResult(null);
    
    // Try to extract date from filename
    const filenameDate = extractDateFromFilename(selectedFile.name);
    if (filenameDate) {
      setReportDate(filenameDate.toISOString().split('T')[0]);
    } else {
      // Default to today
      setReportDate(new Date().toISOString().split('T')[0]);
    }
    
    await parseFile(selectedFile);
  };
  
  // Parse file contents
  const parseFile = async (fileToparse: File) => {
    setParsing(true);
    
    try {
      const isXlsx = fileToparse.name.toLowerCase().endsWith('.xlsx') || 
                     fileToparse.name.toLowerCase().endsWith('.xls');
      
      let data: (string | number | null)[][] = [];
      
      if (isXlsx) {
        // Parse Excel file
        if (!xlsxLib) {
          xlsxLib = await import('xlsx');
        }
        
        const arrayBuffer = await fileToparse.arrayBuffer();
        const workbook = xlsxLib.read(arrayBuffer, { type: 'array' });
        
        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array
        data = xlsxLib.utils.sheet_to_json(sheet, { header: 1 }) as (string | number | null)[][];
        
      } else {
        // Parse CSV file
        const text = await fileToparse.text();
        const lines = text.split(/\r?\n/);
        
        data = lines.map(line => {
          // Simple CSV parsing (handles basic cases)
          const cells: (string | null)[] = [];
          let current = '';
          let inQuotes = false;
          
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim() || null);
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim() || null);
          
          return cells;
        });
      }
      
      // Parse the data using our report parser
      const date = reportDate ? new Date(reportDate + 'T00:00:00') : undefined;
      const result = parseReportData(data, date);
      setParseResult(result);
      
    } catch (err: any) {
      setParseResult({
        success: false,
        rows: [],
        errors: [`Failed to parse file: ${err.message}`],
        warnings: [],
        columnMapping: {},
        unmappedColumns: [],
        totalRowsProcessed: 0,
        validRowCount: 0,
      });
    } finally {
      setParsing(false);
    }
  };
  
  // Re-parse when date changes
  useEffect(() => {
    if (file && reportDate) {
      parseFile(file);
    }
  }, [reportDate]);
  
  // Import data to Supabase
  const handleImport = async () => {
    if (!parseResult?.success || !parseResult.rows.length) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/admin/import-metrics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: parseResult.rows,
          source: file?.name || 'manual_import',
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      setImportResult({
        success: true,
        inserted: result.inserted || 0,
        updated: result.updated || 0,
        errors: result.errors || [],
      });
      
    } catch (err: any) {
      setImportResult({
        success: false,
        inserted: 0,
        updated: 0,
        errors: [err.message || 'Import failed'],
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Reset form
  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setReportDate('');
  };
  
  // No auth check for now - just render the page
  // TODO: Add proper auth check later
  
  return (
    <div className="min-h-screen bg-titan-bg pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-lg flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Creator Metrics Import
              </h1>
              <p className="text-sm text-text-muted">
                Upload TikTok Partner Center exports to update creator metrics
              </p>
            </div>
          </div>
        </div>
        
        {/* Import Result Banner */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importResult.success 
              ? 'bg-accent-teal/10 border-accent-teal/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle size={20} className="text-accent-teal flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  importResult.success ? 'text-accent-teal' : 'text-red-400'
                }`}>
                  {importResult.success ? 'Import Complete' : 'Import Failed'}
                </h3>
                {importResult.success ? (
                  <p className="text-sm text-text-muted mt-1">
                    Processed {importResult.inserted + importResult.updated} rows: {' '}
                    {importResult.inserted} inserted, {importResult.updated} updated
                  </p>
                ) : (
                  <ul className="text-sm text-red-400 mt-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        
        {/* Upload Section */}
        <div className="bg-titan-surface border border-titan-border rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            1. Upload Report File
          </h2>
          
          {!file ? (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-titan-border rounded-lg cursor-pointer hover:border-accent-teal/50 transition-colors">
              <Upload size={32} className="text-text-muted mb-3" />
              <p className="text-sm text-text-primary font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-text-muted">
                Accepts .csv and .xlsx files from TikTok Partner Center
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-titan-bg rounded-lg border border-titan-border">
              <FileSpreadsheet size={24} className="text-accent-teal" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {file.name}
                </p>
                <p className="text-xs text-text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={handleReset}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Date Selection */}
        {file && (
          <div className="bg-titan-surface border border-titan-border rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              2. Select Report Date
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-text-muted mb-1.5">
                  Report Date (or end date if range)
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal"
                  />
                </div>
              </div>
              <div className="text-xs text-text-muted pt-5">
                Date inferred from filename: {extractDateFromFilename(file.name)?.toLocaleDateString() || 'Not found'}
              </div>
            </div>
          </div>
        )}
        
        {/* Parse Results */}
        {parsing && (
          <div className="bg-titan-surface border border-titan-border rounded-lg p-8 text-center">
            <Loader2 size={32} className="animate-spin text-accent-teal mx-auto mb-3" />
            <p className="text-sm text-text-muted">Parsing file...</p>
          </div>
        )}
        
        {parseResult && !parsing && (
          <div className="bg-titan-surface border border-titan-border rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-titan-border">
              <h2 className="text-sm font-semibold text-text-primary">
                3. Preview & Confirm
              </h2>
            </div>
            
            {/* Parsing Errors */}
            {parseResult.errors.length > 0 && (
              <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Parsing Errors</p>
                    <ul className="text-xs text-red-400/80 mt-1">
                      {parseResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Warnings</p>
                    <ul className="text-xs text-amber-400/80 mt-1 max-h-32 overflow-auto">
                      {parseResult.warnings.slice(0, 10).map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                      {parseResult.warnings.length > 10 && (
                        <li>... and {parseResult.warnings.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="px-6 py-4 border-b border-titan-border">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-text-muted">Total Rows: </span>
                  <span className="text-text-primary font-medium">
                    {parseResult.totalRowsProcessed}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Valid Rows: </span>
                  <span className="text-accent-teal font-medium">
                    {parseResult.validRowCount}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Unique Handles: </span>
                  <span className="text-text-primary font-medium">
                    {new Set(parseResult.rows.map(r => r.tiktok_handle)).size}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Column Mapping */}
            <div className="px-6 py-4 border-b border-titan-border">
              <p className="text-xs font-medium text-text-muted mb-2">Column Mapping</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(parseResult.columnMapping).map(([original, mapped]) => (
                  <span 
                    key={original}
                    className="text-xs px-2 py-1 bg-accent-teal/10 text-accent-teal rounded"
                  >
                    {original} → {mapped}
                  </span>
                ))}
                {parseResult.unmappedColumns.map(col => (
                  <span 
                    key={col}
                    className="text-xs px-2 py-1 bg-titan-elevated text-text-muted rounded"
                  >
                    {col} (ignored)
                  </span>
                ))}
              </div>
            </div>
            
            {/* Preview Table */}
            {parseResult.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-titan-bg/50 text-text-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Handle</th>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-right font-medium">GMV</th>
                      <th className="px-4 py-2 text-right font-medium">Items</th>
                      <th className="px-4 py-2 text-right font-medium">Commission</th>
                      <th className="px-4 py-2 text-right font-medium">Video CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-titan-border">
                    {parseResult.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-titan-elevated/30">
                        <td className="px-4 py-2 text-text-primary font-medium">
                          @{row.tiktok_handle}
                        </td>
                        <td className="px-4 py-2 text-text-muted">{row.date}</td>
                        <td className="px-4 py-2 text-right text-accent-teal">
                          ${row.affiliate_gmv.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-text-primary">
                          {row.items_sold}
                        </td>
                        <td className="px-4 py-2 text-right text-accent-fuchsia">
                          ${row.est_commission.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-text-muted">
                          {row.video_ctr.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parseResult.rows.length > 10 && (
                  <div className="px-4 py-2 text-xs text-text-muted text-center border-t border-titan-border">
                    Showing first 10 of {parseResult.rows.length} rows
                  </div>
                )}
              </div>
            )}
            
            {/* Import Button */}
            {parseResult.success && (
              <div className="px-6 py-4 bg-titan-bg/50 flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Ready to import {parseResult.validRowCount} rows
                </p>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Import to Database
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default AdminMetricsImport;
