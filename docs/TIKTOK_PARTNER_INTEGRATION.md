# TikTok Shop Partner Center Integration

This document describes how Titans Creator Hub integrates with TikTok Shop Partner Center to manage creators, offers, and performance data.

## Overview

Titans operates as:
- **TSP (TikTok Shop Partner)**: Seller-level partner services
- **CAP (Creator Agency Partner)**: Creator management and data access
- **TAP (TikTok Affiliate Partner)**: Increased commission offers/campaigns

### How We Make Money

```
TAP Offers (increased commission) 
    → Creators add to showcase 
    → Promote products 
    → GMV generated 
    → Titans takes revenue share from commissions
```

### Data Flow

```
TikTok Partner Center
        ↓
   Open API calls
        ↓
  Titans Backend (Vercel API routes)
        ↓
   Supabase (normalized data)
        ↓
  Titans Dashboard (React frontend)
```

---

## Business Concepts

### CAP (Creator Agency Partner)

**Purpose**: Our "data pipe" for detailed creator stats and performance.

**What it enables**:
- Link creators to our agency
- Access detailed performance data (GMV, orders, products, commissions)
- Commission sharing agreements
- Creator management at scale

**Binding Flow**:
1. Creator connects TikTok account to Titans (OAuth)
2. Titans sends CAP binding invitation via TikTok API
3. Creator accepts invitation in TikTok app
4. Creator data becomes accessible to Titans

### TAP (TikTok Affiliate Partner)

**Purpose**: Our monetization lever via increased commission offers.

**What it enables**:
- Create "partner campaigns" with increased commission rates
- Assign offers to specific creators
- Generate tracked affiliate links
- Monitor performance per offer/creator/product

**Offer Types**:
- `increased_commission`: Higher % rate than base
- `bonus_commission`: Flat bonus on top of base
- `flash_commission`: Time-limited boost
- `exclusive_commission`: Only for specific creators

### TSP (TikTok Shop Partner)

**Purpose**: Overall partner access and seller-level tools.

Used primarily for:
- Shop registration services
- Seller management
- Partner tiering/benefits

---

## Database Schema

### New Tables Added

```sql
-- CAP binding state per creator
cap_bindings
├── id, user_id, tiktok_connection_id
├── creator_id, agency_id
├── binding_status (pending/linked/expired/rejected/unlinked)
├── data_authorization_level (basic/standard/full)
├── commission_share_rate
└── invitation_sent_at, linked_at, expires_at

-- TAP offers (centrally managed)
tap_offers
├── id, tiktok_offer_id, partner_id
├── offer_name, offer_type
├── product_id, product_name, product_category
├── base_commission_rate, increased_commission_rate
├── status, start_date, end_date
└── max_redemptions, budget_limit

-- Creator-offer assignments
creator_tap_assignments
├── id, user_id, tap_offer_id
├── creator_affiliate_id
├── status, affiliate_link, short_link
├── clicks, orders, gmv, commission_earned
└── assigned_at, accepted_at, expires_at

-- Detailed performance metrics (daily snapshots)
creator_performance_metrics
├── id, user_id, metric_date
├── product_id, tap_offer_id
├── impressions, clicks, orders
├── gmv, commission_earned, commission_rate
├── items_sold, refunds, refund_rate
└── synced_from_tiktok_at
```

### Relationships

```
profiles (users)
    └── tiktok_connections (1:many)
            ├── cap_bindings (1:1 per creator)
            └── creator_performance_metrics (1:many)

tap_offers (global)
    └── creator_tap_assignments (many:many with users)
            └── creator_performance_metrics (optional FK)
```

---

## API Routes

### `/api/tiktok/cap-bind`

Manages CAP (Creator Agency Partner) binding.

| Method | Action |
|--------|--------|
| GET | Check CAP binding status |
| POST | Initiate CAP binding (send invitation) |
| PUT | Confirm binding (after creator accepts) |
| DELETE | Unlink from CAP agency |

**Example Response (GET)**:
```json
{
  "isLinked": true,
  "binding": {
    "id": "uuid",
    "creatorId": "tiktok_creator_123",
    "agencyId": "titans_cap_id",
    "bindingStatus": "linked",
    "dataAuthorizationLevel": "standard",
    "linkedAt": "2024-12-10T00:00:00Z"
  }
}
```

### `/api/tiktok/tap-offers`

Manages TAP offers and creator assignments.

| Method | Action |
|--------|--------|
| GET | List available offers + user's assignments |
| POST | Assign offer to creator (generate link) |
| DELETE | Remove an assignment |

**Example Response (GET)**:
```json
{
  "offers": [
    {
      "id": "uuid",
      "tiktokOfferId": "tap_offer_123",
      "offerName": "Holiday Boost - Beauty",
      "baseCommissionRate": 0.10,
      "increasedCommissionRate": 0.20,
      "status": "active"
    }
  ],
  "myAssignments": [
    {
      "id": "uuid",
      "tapOfferId": "uuid",
      "status": "active",
      "shortLink": "https://vm.tiktok.com/abc123",
      "gmv": 1250.00,
      "commissionEarned": 250.00
    }
  ]
}
```

### `/api/tiktok/sync-metrics`

Syncs performance data from TikTok Partner Center.

| Method | Action |
|--------|--------|
| GET | Get cached metrics (no sync) |
| POST | Trigger sync from TikTok API |

**Rate Limiting**: Maximum 1 sync per 15 minutes unless `forceRefresh: true`.

**Example Response (POST)**:
```json
{
  "success": true,
  "syncedRecords": 30,
  "lastSyncedAt": "2024-12-13T10:00:00Z",
  "summary": {
    "gmv7Day": 12450.00,
    "gmv30Day": 48230.00,
    "commission7Day": 1867.50,
    "commission30Day": 7234.50,
    "ordersAllTime": 342,
    "gmvTrend7Day": 15.2
  },
  "dailyMetrics": [...],
  "topProducts": [...]
}
```

---

## Frontend Integration

### Dashboard Components

1. **TikTok Connection Banner**
   - Shows connection status
   - Connect/Disconnect buttons
   - Sync button with loading state

2. **CAP Binding Banner**
   - Shows when TikTok connected but not CAP linked
   - "Link to Titans Agency" CTA
   - Status badge when linked

3. **TAP Offers Section**
   - Active offers with copy-link buttons
   - Available offers grid with "Add" buttons
   - Commission rate comparisons

4. **Metrics Cards**
   - GMV (7d/30d)
   - Commission (7d/30d)
   - Items Sold
   - Orders
   - Shows "—" when not connected

5. **Performance Chart**
   - Daily GMV + Commission lines
   - Auto-scales to data range

6. **Top Products Table**
   - Real data when connected
   - Fallback to mock data for demo

### Client Functions (tiktokService.ts)

```typescript
// CAP Binding
getCAPBindingStatus(): Promise<CAPBindingStatus>
initiateCAPBinding(options?): Promise<CAPBindingResponse>
confirmCAPBinding(): Promise<{success, message}>
unlinkCAP(): Promise<{success, message}>

// TAP Offers
getTAPOffers(): Promise<GetTAPOffersResponse>
assignTAPOffer(offerId): Promise<AssignTAPOfferResponse>
removeTAPAssignment(assignmentId): Promise<{success, message}>

// Metrics
getMetrics(): Promise<MetricsResponse>
syncMetrics(options?): Promise<SyncMetricsResponse>
```

---

## Implementation Status

### ✅ Completed

- [x] Database schema for CAP bindings, TAP offers, performance metrics
- [x] CAP binding API routes (GET/POST/PUT/DELETE)
- [x] TAP offers API routes (GET/POST/DELETE)
- [x] Metrics sync API (GET/POST with rate limiting)
- [x] TypeScript types for all Partner Center entities
- [x] Frontend service functions
- [x] Dashboard UI with CAP/TAP integration
- [x] Environment variable configuration

### 🔲 TODO: Requires TikTok API Credentials

When you have TikTok Partner Center API credentials, implement:

1. **Real TikTok API Calls**
   - Replace mock data generators in `sync-metrics.ts`
   - Implement `fetchFromTikTokAPI()` with proper signing
   - Add token refresh handling

2. **CAP Binding API Integration**
   - Call `/affiliate/202405/creators/invite` to create invitation
   - Implement invitation URL generation
   - Add webhook handler for binding status updates

3. **TAP Offer Sync**
   - Pull offers from `/affiliate/202405/campaigns`
   - Sync offer assignments
   - Generate real affiliate links via API

4. **Scheduled Sync Jobs**
   - Create Vercel Cron for daily metrics sync
   - Implement `syncAllCreatorsMetrics()` batch job
   - Add error handling and retry logic

---

## TikTok Partner Center API Reference

Based on documentation at:
https://partner.tiktokshop.com/docv2/page/about-partner-center-console

### Key Endpoints (v202405)

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | `/api/v2/token/get` | Exchange auth code for tokens |
| Auth | `/api/v2/token/refresh` | Refresh access token |
| Affiliate Partner | `/affiliate/creators` | List linked creators |
| Affiliate Partner | `/affiliate/creators/invite` | Invite creator to link |
| Affiliate Partner | `/affiliate/creators/performance` | Get creator metrics |
| Affiliate Partner | `/affiliate/campaigns` | List partner campaigns |
| Analytics | `/analytics/reports` | Performance reports |

### Required Scopes

```javascript
const scopes = [
  'user.info.basic',      // Basic user info
  'shop.affiliate',       // Affiliate data (CAP/TAP)
  'shop.order',           // Order data
  'shop.product',         // Product data  
  'analytics.read',       // Analytics data
];
```

---

## Security Considerations

1. **OAuth Tokens**
   - Stored encrypted in Supabase
   - Never exposed to frontend
   - Refreshed server-side before expiration

2. **API Routes**
   - All require Supabase JWT authentication
   - Service role key for database writes
   - Rate limiting on sync endpoints

3. **RLS Policies**
   - Users can only see their own data
   - CAP bindings scoped to user_id
   - TAP assignments scoped to user_id
   - Performance metrics scoped to user_id

4. **Environment Variables**
   - `TIKTOK_APP_SECRET` - NEVER in frontend
   - `SUPABASE_SERVICE_ROLE_KEY` - Backend only
   - Partner IDs can be public but shouldn't be

---

## Troubleshooting

### Common Issues

**"No TikTok account connected"**
- User needs to complete OAuth flow first
- Check `tiktok_connections` table for active connection

**"CAP binding stuck in pending"**
- Creator hasn't accepted invitation in TikTok app
- Invitation may have expired (7 days default)
- Use "I've Accepted" button to manually confirm

**"Metrics not syncing"**
- Check rate limiting (15 min cooldown)
- Use `forceRefresh: true` to bypass
- Verify TikTok access token hasn't expired

**"TAP offers empty"**
- No active offers created in Partner Center
- Offers may have expired (check `end_date`)
- Check `tap_offers` table has data

### Debug Queries

```sql
-- Check user's TikTok connection
SELECT * FROM tiktok_connections WHERE user_id = 'uuid';

-- Check CAP binding status
SELECT * FROM cap_bindings WHERE user_id = 'uuid';

-- Check TAP assignments
SELECT cta.*, to.offer_name 
FROM creator_tap_assignments cta
JOIN tap_offers to ON cta.tap_offer_id = to.id
WHERE cta.user_id = 'uuid';

-- Check recent metrics
SELECT * FROM creator_performance_metrics 
WHERE user_id = 'uuid' 
ORDER BY metric_date DESC LIMIT 30;
```

---

## Next Steps

1. **Get TikTok API Credentials**
   - Register as developer at Partner Center
   - Create app and get App Key/Secret
   - Configure OAuth redirect URLs

2. **Test with Sandbox**
   - Use TikTok's development shops
   - Test OAuth flow end-to-end
   - Verify data sync works

3. **Launch Production**
   - Deploy to Vercel
   - Configure production env vars
   - Set up monitoring for API errors

4. **Scale**
   - Implement batch sync for many creators
   - Add caching layer (Redis?)
   - Optimize database queries with views
