# Titans Creator Hub

TikTok Shop affiliate dashboard. Creators see their metrics if linked to the agency.

## How It Works

1. You manage data by committing files to this repo
2. Hit the sync endpoint to load data into Supabase
3. Creators log in, enter their handle, see their metrics

---

## Quick Start

### 1. Database Setup (One Time)

Go to **supabase.com** → Your Project → **SQL Editor**

Paste and run `supabase/SETUP.sql`

### 2. Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `ADMIN_SYNC_KEY` | Any secret string (e.g., `my-sync-key-123`) |

### 3. Deploy

Push to GitHub → Vercel auto-deploys

---

## Daily Workflow

### Add/Remove Creators

Edit `data/linked_creators.csv`:

```csv
tiktok_handle
missxkenshin
shopaholicismyname
newcreator123
```

### Import Metrics

1. Export CSV from TikTok Partner Center
2. Save to `data/imports/metrics_YYYY-MM-DD.csv`
3. Commit and push

### Sync to Database

After pushing, run:

```bash
curl -X POST https://your-site.vercel.app/api/admin/sync-repo-data \
  -H "x-admin-sync-key: your-sync-key"
```

Or use any HTTP client (Postman, etc.)

---

## Files

```
data/
├── linked_creators.csv      # TikTok handles linked to agency
└── imports/
    └── metrics_2024-12-14.csv  # Metrics from TikTok Partner Center
```

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/sync-repo-data` | POST | x-admin-sync-key header | Sync repo data to Supabase |
| `/api/profile/metrics` | GET | Bearer token | Get user's metrics |
| `/api/profile/update-handle` | POST | Bearer token | Save user's TikTok handle |

---

## Creator Flow

1. Creator signs up
2. Enters TikTok handle
3. If handle is in `linked_creators` → sees metrics
4. If not → sees "Not linked to agency"

---

## Your 43 Creators

Already in `data/linked_creators.csv`:
- missxkenshin ($35K GMV)
- shopaholicismyname ($22K GMV)
- theebomeister ($16K GMV)
- ... and 40 more
