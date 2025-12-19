# Paywall Implementation Plan

## Business Logic

```
IF user is in linked_creators table:
    → FREE access to everything (agency member)
ELSE IF user has active subscription:
    → Access based on tier (starter/growth/pro)
ELSE:
    → Show paywall, prompt to subscribe
```

## Subscription Tiers

### Starter - $11/month
- 15 video audits per month
- 2 follow-up questions per audit
- Basic trend access
- 30-day audit history

### Growth - $29/month
- 50 video audits per month
- 5 follow-up questions per audit
- Full trend access
- 90-day audit history
- Limited product commission boost

### Pro - $59/month
- 150 video audits per month
- Unlimited follow-up questions
- Full trend access + alerts
- Unlimited audit history
- Full product commission boost access

### Agency - FREE
- Everything unlimited
- Automatic for linked_creators

## Cost Analysis

### Per Video Audit (Gemini 2.0 Flash)
- Initial analysis: ~$0.002
- Each follow-up: ~$0.0004 (text only) to $0.002 (with video context)
- Average with 3 follow-ups: ~$0.003-0.008

### Monthly Profit Margins
| Tier | Price | Max Cost (if maxed) | Min Profit |
|------|-------|---------------------|------------|
| Starter | $11 | 15 × $0.008 = $0.12 | $10.88 |
| Growth | $29 | 50 × $0.008 = $0.40 | $28.60 |
| Pro | $59 | 150 × $0.008 = $1.20 | $57.80 |

**Very healthy margins!**

## Square Integration

### Required Square Setup
1. Create Square Developer account
2. Create Subscription Plans for each tier
3. Get API credentials
4. Set up webhook endpoint

### Square Subscription Flow
```
User clicks "Subscribe" 
    → Redirect to Square Checkout
    → User enters payment info
    → Square processes payment
    → Square sends webhook to your API
    → API updates user's subscription_status
    → User redirected back, now has access
```

### Webhook Events to Handle
- `subscription.created` - New subscription
- `subscription.updated` - Plan change
- `invoice.payment_made` - Renewal successful
- `subscription.canceled` - User canceled
- `invoice.payment_failed` - Payment failed

## Database Changes

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN square_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_started_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN subscription_ends_at TIMESTAMP;
```

## Access Control Logic

```typescript
// lib/access.ts
export function getUserAccess(profile: Profile, linkedCreators: string[]) {
  // Agency members get full access
  if (linkedCreators.includes(profile.tiktok_handle)) {
    return { tier: 'agency', hasAccess: true, limits: UNLIMITED };
  }
  
  // Check subscription
  if (profile.subscription_status === 'active') {
    return { 
      tier: profile.subscription_tier, 
      hasAccess: true, 
      limits: TIER_LIMITS[profile.subscription_tier] 
    };
  }
  
  // No access
  return { tier: 'free', hasAccess: false, limits: TIER_LIMITS.free };
}

const TIER_LIMITS = {
  free: { audits: 0, followUps: 0, trendAccess: false },
  starter: { audits: 15, followUps: 2, trendAccess: 'basic' },
  growth: { audits: 50, followUps: 5, trendAccess: 'full' },
  pro: { audits: 150, followUps: Infinity, trendAccess: 'full+alerts' },
  agency: { audits: Infinity, followUps: Infinity, trendAccess: 'full+alerts' }
};
```

## UI Changes Needed

### 1. Pricing Page
- Display 3 tiers with features
- "Subscribe" buttons for each
- Show "You're an Agency Member!" for linked creators

### 2. Paywall Modal
- Shows when non-subscriber tries to access premium feature
- Quick tier comparison
- Direct checkout buttons

### 3. Account Settings
- Show current subscription status
- Manage/cancel subscription link
- Usage stats (X/15 audits used this month)

### 4. Video Audit Page
- Show remaining audits count
- Disable submit if limit reached
- Upgrade prompt when near limit
