# Branded referrals, then image generation

User approved this separate plan on September 8, 2026. Preserve the unfinished
course plan and the unshipped AI Discord join work. This worktree starts at the
verified production commit 49772c4, not either unfinished feature branch.

## Phase 1: Branded referrals (must finish first)

- [x] Capture a genuine incoming affiliate code on the two product sales pages
  and pass it to Whop's documented `data-whop-checkout-affiliate-code` before
  the checkout loader runs. Retain only that public code for up to 30 days on
  this browser; explicit valid new referrals replace it. Storage failure must
  not break current-page referral checkout. Never invent a default affiliate.
- [x] Route `/r/<Whop username>` to the existing AI sales page, and
  `/r/<Whop username>/exclusive` to the Exclusive sales page. Restrict routes
  to safe username characters and fixed destinations; invalid routes return 404.
- [x] Earn displays/copies/shares branded URLs derived from the authenticated
  member's verified native Whop links. Keep the backend response and all native
  agreements, commissions, payouts, legacy URLs and coach approvals unchanged.
- [x] Regression tests: loader ordering, both products, invalid/duplicate input,
  expiry, blocked storage, no referral, route parsing, copy/share/toolkit links.
- [ ] Browser-check mobile/desktop and Whop iframe attribution. Commit/push to
  GitHub, deploy an immutable Contabo static release and validated Caddy routes,
  and verify the live branded links. No Vercel. No fabricated sale/referral.

Dependencies: checkout attribution -> branded routes -> Earn URLs -> release.
Tests: `node --test whop-auth/*.test.mjs tests/*.test.mjs` and
`node scripts/validate-launch-site.mjs`, plus browser and Caddy checks.
Source: https://docs.whop.com/manage-your-business/payment-processing/embed-checkout
Rollback: restore previous static symlink and Caddy configuration, validate and
reload. The auth service, durable member records and all Whop deals stay intact.

Pre-release verification (September 8): 83 automated tests pass; launch validator
and diff whitespace checks pass. Real Whop iframe DOM on both local product
pages contains `a=mitchschill` and the correct separate plan IDs. Mobile 390px
and desktop 1440/1920px checks show no horizontal overflow. Earn copy reports
success, with local demo labels retained. Independent review found and resolved
same-code refresh extending capture timestamps; normal product navigation no
longer creates fresh referral captures. The composed production Caddy config
passes installed Caddy 2.11.3 validation before any production switch.

No paid transaction was submitted: iframe attribution is verified, but this
does not claim an actual commission or settlement has occurred. Whop continues
to enforce its real eligibility, attribution and existing affiliate terms.

## Phase 2: OpenAI account and economic feasibility

- [ ] Only after Phase 1, verify official gpt-image-2 Images API documentation,
  model availability, 1024x1536 high-quality generation/editing, usage costs and
  billing behavior for errors/timeouts. Do not silently substitute a model.
- [ ] Open the user's OpenAI platform account. Reuse/create a dedicated Titans
  Image Generation project; use existing billing where available. STOP when
  login, verification, payment setup or adding funds needs user action. Do not
  purchase funds. Never expose a key in browser-code, chat, logs or screenshots.
- [ ] Check actual hosting storage/database and native Whop checkout fees. Model
  full-redemption economics for packs $5/10, $10/25, $15/40, $20/60, $25/80,
  $30/100, including inputs/references, output, failed attempts and storage.
  Paid packs stay disabled unless costs have a reasonable positive margin.

## Phase 3: Metered image generation (after account gate)

- [ ] Reuse authenticated Whop identity and verified AI eligibility. Grant 15
  lifetime credits once per customer, including existing customers; never grant
  again for login, renewal, upgrade, duplicate event or pack purchase.
- [ ] Establish durable unique transactions and atomic reservations using the
  existing database when suitable. Successful stored image costs one credit;
  confirmed failures release it; uncertain requests reconcile before retry.
- [ ] Server-only OPENAI_API_KEY, model/quality/size/count, bounded prompts and
  optional reference upload, rate limits, spending cap and private image access.
- [ ] Add generation/edit, progress, saved preview, free download, balance and
  six one-time packs to the existing responsive Prompt Builder; zero credits
  never disables prompt building. Mark $30/100 Best Value.
- [ ] Verify paid credits with authenticated provider notifications and unique
  transaction IDs; handle affected-purchase refunds/reversals and duplicates.
- [ ] Admin balances, pack settings, usage, actual costs, margin warnings and
  independent sales pause; retain purchased balances when sales are paused.
- [ ] Test eligibility/idempotency/concurrency/zero balances, generation/edit/
  saving/download/errors/timeouts, test-mode payment success/failure/duplicate/
  refund. Use only a small number of authorized live image tests.
- [ ] Deliver working preview, actual test costs, estimated per-pack margins,
  remaining account actions and honest verification limits.

Each implementation increment is tested before the next. Phase 3 database,
payment and generation tasks will be refined against the actual account/API
and storage capabilities, without replacing existing systems unnecessarily.
