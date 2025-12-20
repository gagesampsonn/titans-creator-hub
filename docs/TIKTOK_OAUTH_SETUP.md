# TikTok Shop OAuth Setup Guide

This guide walks you through setting up TikTok Shop OAuth integration for Titans Creator Hub.

## Overview

The OAuth flow allows creators to:
1. Connect their TikTok Shop creator account to Titans
2. Authorize access to their performance data
3. Link to the Titans agency (CAP binding)
4. Access exclusive TAP offers with increased commissions

## Prerequisites

Before starting, you need:
- [ ] TikTok Shop Partner Center account
- [ ] App created in Partner Center with API enabled
- [ ] Vercel project deployed
- [ ] Supabase project with schema applied

---

## Step 1: Create App in TikTok Shop Partner Center

1. Go to [TikTok Shop Partner Center](https://partner.tiktokshop.com)
2. Navigate to **My Apps** → **Create App**
3. Fill in app details:
   - **App Name**: Titans Creator Hub
   - **App Description**: Connect your TikTok Shop to access performance data and exclusive offers
   
4. In **Target sellers** section:
   - **Market**: United States
   - Select: **Local sellers** and **Cross-border sellers**

5. In **Enable API** section:
   - Toggle **Enable API**: ON
   - **Redirect URL**: `https://www.titansagency.co/authorize`

6. Click **Create**

## Step 2: Configure API Scopes

After creating the app, you need to enable the correct scopes:

1. Go to **My Apps** → Your App → **Manage API**
2. Enable these scopes:
   - `creator.profile.read` - Read creator profile
   - `creator.performance.read` - Read performance metrics
   - `creator.order.read` - Read order data
   - `affiliate.campaign.read` - Read affiliate campaigns
   - `affiliate.commission.read` - Read commission data

> **Note**: Creator authorization is currently in beta. You may need to contact TikTok to be added to the allowlist.

## Step 3: Get Your App Credentials

1. Go to **My Apps** → Your App
2. Copy your **App Key** (also called Client ID)
3. Copy your **App Secret** (keep this secure!)

## Step 4: Configure Vercel Environment Variables

Add these environment variables in Vercel Dashboard:
**Project → Settings → Environment Variables**

| Variable | Value | Environment |
|----------|-------|-------------|
| `TIKTOK_APP_KEY` | Your App Key from Partner Center | Production |
| `TIKTOK_APP_SECRET` | Your App Secret from Partner Center | Production |
| `FRONTEND_URL` | `https://www.titansagency.co` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production |

### Required Environment Variables

```env
# TikTok Shop Partner Center
TIKTOK_APP_KEY=your-app-key-here
TIKTOK_APP_SECRET=your-app-secret-here

# Supabase (already configured)
VITE_SUPABASE_URL=https://myylgglbtroabqclzvvn.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
FRONTEND_URL=https://www.titansagency.co
```

## Step 5: Apply Database Migration

Run the OAuth states migration in Supabase SQL Editor:

```sql
-- Run the contents of: supabase/migrations/009_oauth_states.sql
```

This creates the `oauth_states` table for CSRF protection.

## Step 6: Deploy and Test

1. Push your changes to trigger Vercel deployment
2. Go to `https://www.titansagency.co/#/settings`
3. Click "Connect TikTok"
4. You should be redirected to TikTok Shop authorization page
5. After approving, you'll be redirected back to your dashboard

---

## OAuth Flow Diagram

```
┌─────────────────┐
│  User clicks    │
│ "Connect TikTok"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend calls  │
│/api/tiktok/     │
│   auth-url      │
└────────┬────────┘
         │ Returns TikTok auth URL
         ▼
┌─────────────────┐
│ User redirected │
│ to TikTok Shop  │
│ authorization   │
└────────┬────────┘
         │ User approves
         ▼
┌─────────────────┐
│ TikTok redirects│
│ to /authorize   │
│ with code+state │
└────────┬────────┘
         │ Vercel rewrites to /api/tiktok/callback
         ▼
┌─────────────────┐
│ Callback handler│
│ exchanges code  │
│ for tokens      │
└────────┬────────┘
         │ Stores tokens in Supabase
         ▼
┌─────────────────┐
│ Redirect to     │
│ /dashboard with │
│ success message │
└─────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tiktok/auth-url` | GET | Generate TikTok authorization URL |
| `/api/tiktok/callback` | GET | Handle OAuth callback (also `/authorize`) |
| `/api/tiktok/status` | GET | Check connection status |
| `/api/tiktok/disconnect` | POST | Disconnect TikTok account |
| `/api/tiktok/refresh` | POST | Refresh access token |

---

## Troubleshooting

### "TikTok integration not configured"
- Verify `TIKTOK_APP_KEY` is set in Vercel environment variables
- Redeploy after adding environment variables

### "Invalid state parameter"
- The authorization request expired (10 min timeout)
- User should try connecting again

### "Failed to connect to TikTok"
- Check TikTok Shop Partner Center for any app issues
- Verify your app is approved and not in sandbox mode
- Ensure redirect URL matches exactly: `https://www.titansagency.co/authorize`

### "Token refresh failed"
- The refresh token may have expired (usually 30+ days)
- User needs to reconnect their TikTok account

### Creator not showing up
- The user must be a registered TikTok Shop Creator
- They can register at: https://business.tiktokshop.com/us/creator

---

## Security Considerations

1. **Never expose `TIKTOK_APP_SECRET`** in frontend code
2. **State parameter** is required and validated for CSRF protection
3. **Tokens are stored server-side** only, never sent to frontend
4. **RLS policies** ensure users can only access their own connections
5. **Token refresh** runs automatically via Vercel Cron every 6 hours

---

## Next Steps After Setup

1. **Test the connection flow** with a test creator account
2. **Implement CAP binding** to link creators to your agency
3. **Set up TAP offers** for increased commission campaigns
4. **Build the metrics dashboard** to display synced performance data

---

## Files Created/Modified

```
api/tiktok/
├── auth-url.ts      # Generate authorization URL
├── callback.ts      # Handle OAuth callback
├── status.ts        # Check connection status
├── disconnect.ts    # Disconnect account
└── refresh.ts       # Refresh tokens

pages/
└── Settings.tsx     # Settings page with Connect TikTok button

supabase/migrations/
└── 009_oauth_states.sql  # OAuth state storage table

vercel.json          # Added /authorize rewrite and cron job
```
