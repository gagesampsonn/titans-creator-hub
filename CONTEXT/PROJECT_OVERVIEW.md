# Titans Creator Hub - Project Context

## Overview
A SaaS platform for TikTok Shop affiliate creators, run by Titans Agency. Provides analytics, video audits, trend scanning, and performance tracking.

**Live URL:** https://titans-creator-hub.vercel.app  
**Tech Stack:** React + TypeScript, Vite, Vercel, Supabase, Tailwind CSS

---

## Current Features (Deployed)

### 1. Creator Dashboard
- Linked agency creators see their performance metrics
- GMV, Commission, Items Sold, Orders with % change indicators
- Top 5 products display
- Data imported from TikTok Shop Excel exports

### 2. Video Audit Tool
- Users submit TikTok video URLs or upload files
- Gemini 2.0/2.5 Flash analyzes the video
- Returns detailed feedback on hook, engagement, CTAs, etc.
- **API:** `api/audit/url.ts` - server-side Gemini

### 3. Trend Scanner
- Scans for trending products/content
- Uses Gemini API
- **API:** `api/trends/scan.ts`

### 4. Link Request System
- Non-linked creators can request to join agency
- Sends Discord webhook notification
- **Webhook:** https://discord.com/api/webhooks/1451248447825907884/...

---

## Database Schema (Supabase)

### profiles
```sql
id UUID PRIMARY KEY
email TEXT
tiktok_handle TEXT
avatar_url TEXT
created_at TIMESTAMP
```

### linked_creators
```sql
id UUID PRIMARY KEY
tiktok_handle TEXT UNIQUE
added_at TIMESTAMP
```

### creator_product_metrics
```sql
id UUID PRIMARY KEY
tiktok_handle TEXT
date_start DATE
date_end DATE
product_name TEXT
gmv NUMERIC
items_sold INTEGER
est_commission NUMERIC
-- ... more fields
UNIQUE(tiktok_handle, product_name, date_start, date_end)
```

### creator_period_summary
```sql
id UUID PRIMARY KEY
tiktok_handle TEXT
date_start DATE
date_end DATE
total_gmv NUMERIC
total_items INTEGER
total_orders INTEGER
total_commission NUMERIC
-- Comparison data
prev_gmv NUMERIC
prev_items INTEGER
gmv_change_pct NUMERIC
items_change_pct NUMERIC
orders_change_pct NUMERIC
```

### link_requests
```sql
id UUID PRIMARY KEY
tiktok_handle TEXT UNIQUE
user_email TEXT
note TEXT
status TEXT ('pending', 'approved', 'rejected')
created_at TIMESTAMP
```

---

## Business Model

### Access Tiers
| User Type | Access Level | Cost |
|-----------|--------------|------|
| **Agency Members** (linked_creators) | Full access to everything | FREE |
| **Subscribers** | Pay for premium features | $11-59/month |
| **Free Users** | Limited/no access | $0 |

### Planned Subscription Tiers

| Tier | Price | Video Audits | Follow-ups | Trends | Product Boost |
|------|-------|--------------|------------|--------|---------------|
| Starter | $11/mo | 15/mo | 2 per audit | Basic | ❌ |
| Growth | $29/mo | 50/mo | 5 per audit | Full | Limited |
| Pro | $59/mo | 150/mo | Unlimited | Full + Alerts | Full |
| Agency | FREE | Unlimited | Unlimited | Full | Full |

---

## Planned Features (Not Yet Built)

### 1. Square Paywall Integration
- Monthly subscriptions via Square
- Webhook to update subscription status
- Gate features based on tier

**New columns needed:**
```sql
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'none';
-- Values: 'none', 'active', 'cancelled', 'past_due'
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
-- Values: 'free', 'starter', 'growth', 'pro', 'agency'
ALTER TABLE profiles ADD COLUMN subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN square_customer_id TEXT;
```

### 2. Video Audit Storage & Follow-ups
Store all audits for data improvement + allow follow-up questions.

**New tables:**
```sql
CREATE TABLE video_audits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  video_url TEXT,
  video_duration INTEGER,
  initial_analysis JSONB,
  conversation JSONB[], -- [{role, content, timestamp}]
  user_feedback TEXT, -- 'helpful', 'not_helpful', null
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  month DATE, -- First of month
  audits_used INTEGER DEFAULT 0,
  follow_ups_used INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);
```

### 3. Usage Limits by Tier
```typescript
const TIER_LIMITS = {
  free: { audits: 0, followUps: 0 },
  starter: { audits: 15, followUps: 2 }, // 2 per audit
  growth: { audits: 50, followUps: 5 },
  pro: { audits: 150, followUps: Infinity },
  agency: { audits: Infinity, followUps: Infinity }
};
```

### 4. Discord Role Integration (Future)
- Link Discord account to profile
- Bot assigns roles based on subscription tier
- Premium Discord channels for paid subscribers

---

## API Cost Analysis

### Gemini API (Video Audits)
- **Model:** gemini-2.0-flash / gemini-2.5-flash
- **Cost per audit:** ~$0.002 (0.2 cents)
- **Cost with 3 follow-ups:** ~$0.008 (0.8 cents)
- **Break-even at $11/mo:** ~1,375 audits

### Supabase
- Free tier: 500MB storage, 50k monthly active users
- Pro: $25/month for 8GB

---

## File Structure

```
titans-creator-hub/
├── api/
│   ├── audit/
│   │   └── url.ts          # Video audit endpoint
│   ├── trends/
│   │   └── scan.ts         # Trend scanning
│   ├── profile/
│   │   ├── metrics.ts      # Dashboard metrics
│   │   ├── top-products.ts # Top products
│   │   └── update-handle.ts
│   └── link-request.ts     # Link request + Discord webhook
├── pages/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── VideoAudit.tsx      # Video audit tool
│   ├── TrendPulse.tsx      # Trend scanner
│   └── ...
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── AuthContext.tsx     # Auth provider
├── scripts/
│   └── import-full-dec-data.ts  # Data import script
├── data/
│   └── linked_creators.csv # List of agency creators
└── supabase/
    └── migrations/         # SQL migrations
```

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://myylgglbtroabqclzvvn.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Gemini AI
GEMINI_API_KEY=...

# Discord
DISCORD_LINK_REQUEST_WEBHOOK=https://discord.com/api/webhooks/...

# Square (to be added)
SQUARE_ACCESS_TOKEN=...
SQUARE_WEBHOOK_SIGNATURE_KEY=...
SQUARE_LOCATION_ID=...
```

---

## Data Import Process

Excel files from TikTok Shop are imported via `scripts/import-full-dec-data.ts`:
1. Read Excel file with product-level data
2. Filter for linked creators only
3. Upsert to `creator_product_metrics`
4. Calculate period summaries with comparison %
5. Save to `creator_period_summary`

**Latest import:** Dec 1-18, 2025 data

---

## Key Decisions Made

1. **Gemini over OpenAI** - Cheaper for video analysis
2. **Square over Stripe** - User preference
3. **Agency members = free** - Core business model
4. **Tiered pricing** - $11/$29/$59 structure
5. **Store all audits** - Build training data over time

---

## Next Steps (Priority Order)

1. [ ] Add subscription columns to profiles table
2. [ ] Set up Square developer account & subscription plans
3. [ ] Create checkout flow for each tier
4. [ ] Add webhook endpoint for Square payments
5. [ ] Create video_audits table for storage
6. [ ] Add follow-up chat UI to VideoAudit page
7. [ ] Implement usage tracking per tier
8. [ ] Gate features based on subscription status
