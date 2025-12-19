# Current State - December 2025

## What's Working ✅

- **Authentication:** Supabase Auth with email/password
- **Dashboard:** Shows metrics for linked creators with % change indicators
- **Video Audit:** Analyzes TikTok videos via Gemini AI
- **Trend Scanner:** Scans for trending content
- **Link Requests:** Non-linked users can request to join, sends Discord notification
- **Data Import:** Excel → Supabase pipeline working

## What's Not Built Yet ❌

- **Paywall/Subscriptions:** No payment integration
- **Audit Storage:** Video audits are not saved to database
- **Follow-up Questions:** No chat-style follow-up after audit
- **Usage Limits:** No tracking of how many audits a user has done
- **Discord Role Sync:** No Discord integration beyond webhooks

## Database Tables That Exist

1. `profiles` - User accounts
2. `linked_creators` - Agency members (get free access)
3. `creator_product_metrics` - Product-level sales data
4. `creator_period_summary` - Aggregated metrics with comparisons
5. `link_requests` - Pending link requests

## Database Tables Needed

1. `video_audits` - Store all audit results + conversations
2. `audit_usage` - Track monthly usage per user
3. `subscriptions` - Or add columns to profiles

## Credentials / Keys Location

- **Supabase:** Dashboard at supabase.com, project `myylgglbtroabqclzvvn`
- **Vercel:** Auto-deploys from GitHub `gagesampsonn/titans-creator-hub`
- **Gemini:** Key in Vercel env vars as `GEMINI_API_KEY`
- **Discord Webhook:** Hardcoded in `api/link-request.ts` (should move to env)

## Recent Changes (This Session)

1. Added `creator_period_summary` table for comparison data
2. Imported Dec 1-18, 2025 data with % change calculations
3. Updated Dashboard to show dynamic dates
4. Removed redundant DATE column from Performance Summary
5. Added comparison arrows (green ▲ / red ▼) to stats

## Git Status

- **Repo:** https://github.com/gagesampsonn/titans-creator-hub
- **Branch:** master
- **Last commit:** "Fix Performance Summary: use dynamic dates, remove DATE column"
- **Deploy:** Auto-deploys to Vercel on push
