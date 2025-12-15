# Titans Creator Hub

A creator dashboard for TikTok Shop agencies. Creators enter their TikTok handle and see their metrics — if they're linked to the agency.

## How It Works

1. **Admin** exports TikTok Shop reports (CSV/XLSX) from TikTok Partner Center
2. **Admin** uploads the file to the dashboard → data is parsed and stored
3. **Creators** sign up, enter their TikTok handle
4. **If linked** → they see their metrics dashboard
5. **If not linked** → they see "Your account is not linked to the agency yet"

---

## Quick Setup (3 Steps)

### Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → Your Project → **SQL Editor**
2. Copy the entire contents of `supabase/SETUP.sql` and paste it
3. Click **Run** ✅
4. Then copy `supabase/SEED_CREATORS.sql` and run it to add your 43 creators ✅

### Step 2: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Add these **Environment Variables**:

| Variable | Where to find it |
|----------|------------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key (secret!) |

4. Deploy! 🚀

### Step 3: Import Your First Metrics

1. Log in as admin (gagesampson2016@gmail.com)
2. Go to Dashboard → **Import Metrics**
3. Upload your TikTok Partner Center CSV/XLSX
4. Confirm the import

---

## Admin Features

| Page | URL | What it does |
|------|-----|--------------|
| **Import Metrics** | `/admin/metrics-import` | Upload TikTok reports to update creator data |
| **Manage Creators** | `/admin/linked-creators` | Add/remove creators from the agency list |

---

## Creator Experience

1. Creator signs up with email
2. Enters their TikTok handle (e.g., `@missxkenshin`)
3. **If linked to agency** → Sees their dashboard with:
   - 30-day GMV
   - 30-day Commission
   - Items Sold
   - Video CTR
   - Daily breakdown chart
4. **If NOT linked** → Sees message: "Your account is not linked to the agency yet"

---

## Project Structure

```
titans-creator-hub/
├── api/                    # Vercel serverless functions
│   ├── admin/
│   │   ├── import-metrics.ts    # Upload TikTok reports
│   │   └── linked-creators.ts   # Manage linked creators
│   └── profile/
│       ├── metrics.ts           # Get creator's metrics
│       └── update-handle.ts     # Save TikTok handle
├── pages/                  # React pages
│   ├── Dashboard.tsx            # Creator dashboard
│   ├── AdminMetricsImport.tsx   # Admin import page
│   └── AdminLinkedCreators.tsx  # Admin manage creators
├── lib/
│   ├── parseReport.ts           # CSV/XLSX parser
│   ├── supabase.ts              # Supabase client
│   └── AuthContext.tsx          # Auth state
└── supabase/
    ├── SETUP.sql                # Database schema (run once)
    └── SEED_CREATORS.sql        # Your 43 creators
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (with `tiktok_handle`) |
| `linked_creators` | Handles confirmed linked to agency |
| `creator_daily_metrics` | Daily metrics from TikTok imports |

---

## CSV Format Expected

Your TikTok Partner Center export should have these columns (flexible naming):

- `Creator username` → TikTok handle
- `Affiliate GMV` → Sales amount
- `Items sold` → Units sold  
- `Est. commission` → Creator earnings
- `Video CTR` → Click-through rate
- `Views` → Video views

The parser automatically handles:
- Currency symbols ($, commas)
- Percentage values
- **Totals rows are ignored** (rows with handle like `-`, `Total`, etc.)

---

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` with:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Your 43 Linked Creators

Top performers (from your export):
- @missxkenshin - $35K GMV
- @shopaholicismyname - $22K GMV
- @theebomeister - $16K GMV
- @justkeedah - $12K GMV
- @jace_rio - $8K GMV
- ... and 38 more

All 43 handles are in `supabase/SEED_CREATORS.sql` ready to import.

---

## Troubleshooting

**"Profile not found" error**
- Make sure you ran `SETUP.sql` in Supabase SQL Editor

**Creator sees "Not linked to agency"**
- Check that their handle is in `linked_creators` table
- Go to `/admin/linked-creators` to add them

**Import shows 0 rows**
- Check the CSV has a `Creator username` column
- Totals rows (with `-` as username) are correctly ignored

---

Built with React + Vite + Supabase + Vercel
