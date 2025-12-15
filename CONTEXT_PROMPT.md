# Titans Creator Hub - Context Prompt for New Chat

Copy and paste this entire document into a new chat to provide full context.

---

## Project Overview

**Titans Creator Hub** is a React + Vite web app for TikTok Shop affiliate creators. It helps creators:
- Track their earnings and performance metrics
- Find high-commission products to promote
- Access exclusive "boosted commission" offers
- Manage their TikTok Shop affiliate business

The app is deployed on **Vercel** with **Supabase** as the backend (auth + database).

---

## Business Model

Titans operates as a **TikTok Shop Partner** with three partner types:

| Partner Type | Purpose |
|--------------|---------|
| **TSP** (TikTok Shop Partner) | Seller-level services |
| **CAP** (Creator Agency Partner) | Links creators to our agency for detailed data access |
| **TAP** (TikTok Affiliate Partner) | Creates "boosted commission" campaigns with higher commission rates |

**How we make money:**
1. Creators link to Titans (CAP binding)
2. We give them access to TAP offers (boosted commission products)
3. They promote these products and drive sales
4. Titans takes a revenue share from commissions

---

## Tech Stack

- **Frontend**: React 19, React Router, Vite, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions (api/ folder)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth
- **Styling**: Custom Tailwind config with `titan-*` and `accent-*` color tokens

---

## File Structure

```
titans-creator-hub/
├── api/tiktok/           # Vercel API routes
│   ├── auth-url.ts       # Generate TikTok OAuth URL
│   ├── callback.ts       # OAuth callback handler
│   ├── status.ts         # Check connection status
│   ├── disconnect.ts     # Disconnect TikTok
│   ├── cap-bind.ts       # CAP binding (link creator to agency)
│   ├── tap-offers.ts     # TAP offers (boosted commission)
│   ├── sync-metrics.ts   # Sync performance data
│   └── metrics.ts        # Legacy metrics endpoint
├── lib/
│   ├── AuthContext.tsx   # Supabase auth context
│   ├── supabase.ts       # Supabase client
│   ├── tiktokService.ts  # Frontend API client
│   ├── tiktokPartnerTypes.ts  # TypeScript types
│   └── mockData.ts       # Mock product data
├── pages/
│   ├── Dashboard.tsx     # Creator dashboard (main focus)
│   ├── Home.tsx          # Landing page
│   ├── ProductLibrary.tsx
│   ├── ProductDetail.tsx
│   ├── TrendPulse.tsx
│   ├── VideoAudit.tsx
│   ├── BrandPortal.tsx
│   └── Auth.tsx
├── supabase/
│   └── schema.sql        # Full database schema
├── docs/
│   └── TIKTOK_PARTNER_INTEGRATION.md
├── App.tsx               # Router + layout
└── .env.example          # Environment variables
```

---

## Database Schema (Supabase)

### Core Tables
- `profiles` - User accounts
- `tiktok_connections` - OAuth tokens and connection info

### Partner Center Tables (NEW)
- `cap_bindings` - Creator-to-agency linking status
- `tap_offers` - Boosted commission campaigns (seeded with 6 offers)
- `creator_tap_assignments` - Links creators to specific offers
- `creator_performance_metrics` - Daily performance snapshots

### Key RPC Functions
- `upsert_tiktok_connection()` - Store OAuth tokens
- `upsert_cap_binding()` - Update CAP binding status
- `upsert_creator_performance()` - Insert daily metrics

---

## API Routes

### `/api/tiktok/cap-bind`
| Method | Action |
|--------|--------|
| GET | Check CAP binding status |
| POST | Initiate binding (send invitation) |
| PUT | Confirm binding (after creator accepts) |
| DELETE | Unlink from agency |

### `/api/tiktok/tap-offers`
| Method | Action |
|--------|--------|
| GET | List available offers + user's assignments |
| POST | Add offer to creator (generate link) |
| DELETE | Remove assignment |

### `/api/tiktok/sync-metrics`
| Method | Action |
|--------|--------|
| GET | Get cached metrics |
| POST | Sync from TikTok API (with rate limiting) |

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# TikTok App (from Partner Center)
TIKTOK_APP_KEY=
TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URL=

# Partner IDs
TIKTOK_CAP_AGENCY_ID=
TIKTOK_TAP_PARTNER_ID=
TIKTOK_TSP_PARTNER_ID=

# App
FRONTEND_URL=
```

---

## Dashboard Features (Creator-Focused)

The Dashboard (`pages/Dashboard.tsx`) is the main screen and includes:

1. **TikTok Connection** - Connect/disconnect OAuth flow
2. **Premium Unlock Banner** - Prompts creator to link for benefits:
   - Exclusive boosted commission offers (up to 35%)
   - Detailed analytics
   - Priority support
3. **Earnings Cards** - Your Sales, Your Earnings, Items Sold, Orders
4. **Boosted Commission Products** - TAP offers with "Get Link" buttons
5. **Earnings Chart** - Line chart of GMV and commission over time
6. **Best-Selling Products** - Table of top performers

---

## Current State

### ✅ Implemented
- Full Supabase schema with RLS
- TikTok OAuth flow (auth-url, callback, status, disconnect)
- CAP binding API (invite, confirm, unlink)
- TAP offers API (list, assign, remove)
- Metrics sync API (with rate limiting)
- TypeScript types for all entities
- Creator-focused Dashboard UI
- Seed data for 6 TAP offers

### 🔲 TODO (Needs TikTok API Credentials)
- Replace mock data in `sync-metrics.ts` with real TikTok API calls
- Implement `fetchFromTikTokAPI()` with proper request signing
- Wire up real CAP invitation flow
- Sync TAP offers from TikTok Partner Center
- Set up Vercel Cron for daily metric sync

---

## Key Design Decisions

1. **Creator-focused language** - Everything framed as benefits to creator, not agency management
2. **RLS on all tables** - Users can only see their own data
3. **Service role for writes** - Token storage and metrics sync done server-side
4. **Rate limiting** - Metrics sync limited to once per 15 minutes unless forced
5. **Mock data fallback** - Shows placeholder data when not connected

---

## How to Continue Development

1. **Run the schema** in Supabase SQL Editor (includes seed data)
2. **Set environment variables** in Vercel or `.env.local`
3. **Search for `TODO:`** in API files to see where real TikTok API calls go
4. **TikTok Partner Center docs**: https://partner.tiktokshop.com/docv2/page/about-partner-center-console

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
```

---

## Questions? Here's What I Know

- Full codebase structure and how files connect
- Database schema and relationships
- How CAP/TAP/TSP work from TikTok's perspective
- All API routes and their request/response shapes
- Frontend state management in Dashboard
- OAuth flow implementation

Just ask about any specific file or feature!
