# Titans Creator Hub - Data Import Context

Use this document to help AI assistants understand how to import creator data properly.

---

## Project Overview

**Titans Creator Hub** is a dashboard for TikTok Shop affiliate creators linked to the Titans agency. Creators log in to see their performance metrics (GMV, items sold, commission, top products).

- **Tech Stack:** React + Vite, Vercel serverless functions, Supabase (PostgreSQL)
- **Repo:** `C:\Users\gages\titans-creator-hub`
- **Live URL:** Hosted on Vercel

---

## Data Source

Data comes from **TikTok Partner Center** as Excel exports:
- Export type: `CustomReport_Creator_Product_Shop`
- File naming: `CustomReport_Creator_Product_Shop YYYY-MM-DD_YYYY-MM-DD.xlsx`

### Excel File Structure

| Column | Description |
|--------|-------------|
| `Date` | Date range string like `2025-12-01-2025-12-17` or `Summary` |
| `Creator username` | TikTok handle (the creator) |
| `Product ID` | TikTok product ID |
| `Product info` | Product name/title |
| `Shop name` | The shop selling the product |
| `Affiliate GMV` | Gross Merchandise Value (sales amount) |
| `Items sold` | Number of items sold |
| `Affiliate orders` | Number of orders |

**Important:** 
- Skip rows where `Date` = `Summary` (these are totals)
- Skip rows with 0 GMV and 0 items sold
- Normalize handles: lowercase, remove `@` prefix

---

## Linked Creators

Only import data for creators linked to the agency.

**File:** `data/linked_creators.csv`
```csv
tiktok_handle
missxkenshin
shopaholicismyname
britty.finds
...
```

**Database Table:** `linked_creators`
```sql
- id (UUID)
- tiktok_handle (TEXT, unique, lowercase)
- added_at (TIMESTAMP)
```

### Adding New Creators

1. Add to `data/linked_creators.csv`
2. Add to Supabase `linked_creators` table:
```typescript
await supabase.from('linked_creators').insert({ tiktok_handle: 'newcreator' });
```

---

## Database Schema

### `creator_product_metrics` Table

Stores product-level performance data.

```sql
- id (UUID)
- tiktok_handle (TEXT) -- normalized, lowercase
- date_start (DATE) -- e.g., 2025-12-01
- date_end (DATE) -- e.g., 2025-12-17
- product_id (TEXT)
- product_name (TEXT)
- product_category (TEXT)
- shop_name (TEXT)
- gmv (NUMERIC)
- items_sold (INTEGER)
- est_commission (NUMERIC)
- orders (INTEGER)
- import_source (TEXT)
- UNIQUE(tiktok_handle, product_name, date_start, date_end)
```

### Upsert Function

Use the RPC function to insert/update:
```typescript
await supabase.rpc('upsert_creator_product_metrics', {
  p_tiktok_handle: 'creator',
  p_date_start: '2025-12-01',
  p_date_end: '2025-12-17',
  p_product_id: null,
  p_product_name: 'Product Name',
  p_product_category: 'Uncategorized',
  p_shop_name: 'Shop Name',
  p_gmv: 123.45,
  p_items_sold: 10,
  p_est_commission: 12.34,
  p_orders: 5,
  p_import_source: 'filename.xlsx'
});
```

---

## Import Process

### For Full Period Imports (Recommended)

When you have a complete date range (e.g., Dec 1-17):

1. **Clear existing data** for linked creators first
2. **Import all rows** with a single date range
3. Use the unified date range from the filename

```typescript
// Clear old data
for (const handle of linkedHandles) {
  await supabase.from('creator_product_metrics').delete().eq('tiktok_handle', handle);
}

// Import with consistent date range
const DATE_START = '2025-12-01';
const DATE_END = '2025-12-17';
```

### For Incremental Imports

When adding just new days:
- Use the per-row `Date` column to extract date ranges
- The upsert will update existing records if same (handle + product + dates)

---

## Import Script Location

**Main script:** `scripts/import-full-dec-data.ts`

**Run with:**
```bash
npx tsx scripts/import-full-dec-data.ts
```

**Key constants to update:**
```typescript
const EXCEL_FILE = 'C:\\Users\\gages\\Downloads\\CustomReport_Creator_Product_Shop 2025-12-01_2025-12-17.xlsx';
const DATE_START = '2025-12-01';
const DATE_END = '2025-12-17';
```

---

## Typical Workflow

### When I send a new Excel file:

1. **Check the date range** in the filename
2. **Ask me:** "Do you want a full refresh or just add new days?"
3. **Full refresh (recommended):**
   - Update `EXCEL_FILE`, `DATE_START`, `DATE_END` in import script
   - Clear existing data for linked creators
   - Import all data with unified date range
4. **Run the import**
5. **Show me the summary** (top creators, total records, any errors)

### When adding a new creator:

1. Add handle to `data/linked_creators.csv`
2. Insert into Supabase `linked_creators` table
3. Re-run import if they have data in the current file

---

## Supabase Connection

```typescript
const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';
```

---

## Discord Webhook

Link requests send notifications to Discord:
```
https://discord.com/api/webhooks/1451248447825907884/lkgaAdry3GJPLA1cLxByqzCcWCh_Nb9d4ybmIeolq-qQ0JkvDn3hGHOdn7RPWORe5aK1
```

---

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Run import | `npx tsx scripts/import-full-dec-data.ts` |
| Add linked creator | Add to CSV + insert into `linked_creators` table |
| Deploy changes | `git add -A && git commit -m "message" && git push` |
| Test Discord webhook | Send POST to webhook URL with embed payload |

---

## Sample Import Output

```
📊 Full December Data Import (Dec 1-17, 2025)

✅ Imported: 510 product records
⏭️  Skipped: 8204 rows (no sales or missing data)
📅 Date range: 2025-12-01 to 2025-12-17
👤 Creators with data: 30

📊 Creator Performance:
 1. @missxkenshin    $41,486.54 | 2,635 items
 2. @shopaholicismyname $25,755.51 | 923 items
 ...
```

---

## Notes

- Always normalize handles: `handle.toLowerCase().trim().replace(/^@/, '')`
- Skip rows with `Date = 'Summary'` or `Date = '-'`
- Skip rows where both `GMV = 0` AND `Items sold = 0`
- The dashboard shows "Top 5 Products" for each creator based on GMV
- Date range in dashboard UI may need manual update in `Dashboard.tsx`
