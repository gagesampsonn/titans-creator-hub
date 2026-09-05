# Member library and ten-minute upgrade

## Contract

General Sign in opens `/members/`. The library uses live Whop access checks:
AI customers get the AI Prompter and guide; active Exclusive members get both
the course/Discord and AI tools. Locked products remain visible in gray.
Weekly-only customers keep their community link without gaining AI/course access.
Protected tools retain their existing server-side access checks.

An authenticated AI customer without active Exclusive access receives one
10-minute offer from their first eligible site visit, not from clicking the
banner. Storefront pages and the AI tool register that visit. Signed-out visitors
cannot be identified until login. Reloading, returning later, or restarting the
service does not reset an existing deadline. JavaScript-disabled visits cannot
register an offer. The server, not the displayed clock, decides expiry.

The upgrade is a new Exclusive subscription: $10 for the first 30 days, then
$50 every 30 days until canceled, plus any applicable taxes. It does not cancel
or alter the customer's original AI purchase. Whop handles confirmation,
payment, membership grants, purchase redirect, and Discord role automation.
The Exclusive product's purchase redirect remains `/exclusive/course/`.

## Decisions and limitations

Reuse the existing $50/30-day plan with a $40 first-payment-only promo instead
of changing the normal plan. Validate the plan's product, price, interval,
currency, trial, and billing type before creating checkout. Random-looking,
single-use, product/plan-restricted codes expire at the member's original
deadline. `promoCode` is the checkout query parameter; `promo` does not autoapply.

Whop promo codes are bearer discounts, not buyer-ID-bound entitlements. The
website only issues a code after checking the authenticated member, but someone
could share their checkout link during its remaining lifetime. Single-use stock
and the short provider-side expiry limit this exposure. No public reusable code
is included in frontend assets. The checkout asks customers to use their AI
purchase account. Strict buyer-bound discounts would require provider support.

Durable JSON records live outside immutable releases in
`/var/lib/titans-whop-auth` (systemd StateDirectory, mode 0700). Record files use
0600 and atomic rename; file names are HMACs of Whop user IDs. One Node process
owns the state. Preserve this directory on every deployment and backup. Rotating
`WHOP_SESSION_SECRET` also changes record names: migrate records or retain the
old state key before rotation, otherwise previously expired offers could restart.
Do not deploy this implementation with multiple independent writers.

Checkout requests are deduplicated per member. A deterministic code is saved
before contacting Whop; ambiguous network failures recover that code from Whop
instead of granting another discount. API failures fail closed with generic
responses. Secrets and member session tokens are never logged.

## Verification

- Automated auth, course, checkout-return, membership, expiry, promo recovery,
  duplicate-click, altered-price, and access-denial tests.
- `node scripts/validate-launch-site.mjs` validates existing launch invariants.
- `node tests/member-preview.mjs` runs loopback-only browser fixtures at port
  8876. Visit `/__preview/ai`, `/exclusive`, `/none`, `/weekly`, `/expired`,
  `/error`, or `/unauth` under that prefix to exercise member states.
- Browser verification of Whop checkout on 2026-09-05 confirmed automatic
  $10 due today and $50 next renewal with a temporary single-use verification
  promo. No payment was submitted; end-to-end paid enrollment remains untested.

## Deployment and rollback

Push the tested commit to GitHub, download that exact immutable archive on
Contabo, test there, then atomically switch static and auth release symlinks.
Add StateDirectory access to the existing systemd service without replacing
unrelated service settings. First start with the upgrade flag off; check health
and the live member library, then enable `WHOP_UPGRADE_ENABLED=true` server-side.
No Caddy route changes are required and Vercel is not involved.

Pre-release rollback targets: static `20260905-ae7a508`, auth
`20260905T131000Z-e744227`. Disable the upgrade flag and restart auth to stop new
offers immediately. Existing issued Whop codes expire within ten minutes.
For full rollback, restore both previous symlink targets and restart auth;
preserve member-state files and the harmless StateDirectory configuration.
