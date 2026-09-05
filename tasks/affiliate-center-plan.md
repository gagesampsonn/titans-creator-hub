# Titans Affiliate Center

User approved a separate plan and a localhost-first review on 2026-09-05.
User approved publishing on 2026-09-05 after adding supplied references and payout access. Preserve the existing
course plan, other worktrees, homepage flow, and pending upgrade work.

## Contract

Earn lives at `/members/earn/` inside My Titans. AI Prompter + Guide is the
primary referral option; Titans Exclusive is secondary. Both pay 30% of the
first payment only, never renewal commissions. A discounted first payment
must use its actual Whop commission basis, not the normal advertised price.
Eligibility is an AI purchase OR active Exclusive access; Weekly-only is denied.

Whop remains the source of truth for affiliate identity, referral URLs,
attribution, earnings, refunds and payouts. No independent commission ledger.
Do not fabricate clicks, conversions, recent referrals, or pending/paid totals.
The documented API exposes affiliate totals and override-level earnings but
does not establish all requested reporting capabilities.

Sources verified during discovery:
- https://docs.whop.com/developer/guides/affiliates
- https://docs.whop.com/api-reference/affiliates/list-overrides

## Slice 1: Local review (current scope)

- [x] Build responsive Earn page, both referral links, copy/share feedback,
  30% first-payment terms, unavailable reporting and referral empty state.
- [x] Add draft promotional kit using existing Titans logo/video plus new
  reviewable hooks and talking points. Do not claim new assets are approved.
- [x] Provide loopback-only fixture responses; label all demo links clearly.
  No production credentials, enrollment, commissions or payout mutations.
- [x] Add My Titans entry point only for preview-enabled eligible accounts.
- [x] Test copy/share and rejected access, browser-check 320/390/768/1440 widths,
  save locally and give the user the review URL.

Preview: http://127.0.0.1:8881/members/earn/ (loopback server started locally).
Reset AI preview: `/__preview/ai?next=earn`; substitute `exclusive`, `weekly`,
`none`, `error`, or `unauth` for other states. Run with
`TITANS_PREVIEW_PORT=8881 node tests/member-preview.mjs` (set the environment
variable using the host shell's syntax). Existing preview processes preserved.

Verification: 49 automated tests pass, launch validator passes, copy links and
hooks work in Chrome. Native-share and copy fallback covered by unit fixtures;
no external share was sent. Browser widths 320, 390, 768, 1024, 1440 show no
horizontal overflow. Exclusive-to-Earn navigation, Weekly denial and error
states verified. Independent review prompted an announced access-denied state;
the “Most popular” label follows the user's explicit description of AI Prompter.
Production backend/authentication and Whop records are unchanged; this is a
design/interaction preview, not a live affiliate enrollment implementation.

Files: `members/earn/index.html`, `assets/affiliate-center.js`,
`assets/affiliate-center.css`, `tests/affiliate-preview-data.mjs`,
`tests/affiliate-center.test.mjs`, existing member preview and navigation.

## Slice 2: After visual approval (not included in local demo)

### UI revision: color, motivation and empty approved-content toolkit

User supersedes the earlier draft resource kit: remove its sample hooks,
talking points, video and logo-download UI. Keep the original media files
because other website pages still use them. No new marketing material is
authored, generated or prepopulated. No Whop/auth/referral behavior changes.

- [x] Compact semantic-color dashboard: green money, blue/purple analytics,
  gold milestone, orange actions; two-column mobile stats.
- [x] Explicitly labeled zero preview baseline, data-driven milestones,
  conditional price-based estimate, inline temporary green copy feedback.
- [x] Five empty Toolkit tabs, product switcher and associated affiliate link.
- [x] Add empty catalog/schema and renderer for approved local video files or
  HTTPS reference links, optional thumbnail, hook, rationale, notes and CTA.
  Related resource `referenceId` links to reference `id` of the same product.
- [x] Unit tests, responsive/keyboard browser checks, review, local save only.

Revision verification: 55 tests pass and launch validation passes. Browser
checks at 320/390/768/1024/1440 show no page overflow. Tested copy-to-green and
automatic label restoration, keyboard Arrow/End tab navigation, all five empty
states, and switching the Toolkit's product-specific affiliate link. Reduced
motion is respected in CSS. Independent review fixes add nearby visible copy
failure guidance and exact-reference focus/scroll, covered by regressions.
No Whop/authentication/referral files, API requests, or server settings changed.
All five content arrays remain empty. No upload service or admin editor was
created; content entry is through the documented catalog and supplied assets.

Content entry: `assets/affiliate-toolkit.json` follows
`assets/affiliate-toolkit.schema.json`. Add only user-provided material. For
uploaded media place the supplied file under `assets/affiliate-media/` and use
`media.kind=uploaded`; external TikTok/Instagram/YouTube/other HTTPS links use
`media.kind=external` and open safely in a new tab. No arbitrary third-party
iframe HTML is accepted. The renderer does not invent "why it worked" bullets.
It displays only the supplied values. Resources attach through `referenceId`.
This is file-backed preparation, not a new admin upload/authentication service.

Only `status=approved` items render. Static JSON is publicly fetchable; do not
put private drafts in this asset, and publish approved records only. Future
private editorial storage requires a separate authorized backend workflow.

Presentation adapter accepts optional `links[].price={amount,currency}` with
the existing `commissionPercent`/`payments` fields. No price is added to the
fixture: estimates remain hidden until an authoritative price is supplied.
Optional metrics: `totalEarnedUsd`, `sales`, `clicks`, `conversionRate` (percent),
`pendingUsd`, `paidUsd`. Optional activity rows: `product`, `commissionUsd`,
`status` (earned/pending/paid/reversed). These are display contracts, not a
commission-calculation or payout system. Unknown real metrics stay unavailable;
only the already-local-only preview permits a labeled zero baseline.

### Deferred Whop implementation

- [ ] Define and test authenticated server API. Resolve users from signed
  sessions only; check eligibility and affiliate ownership on every request.
- [ ] Implement Whop enrollment and two standard plan-specific overrides,
  commission_value 30 and applies_to_payments first_payment. Preserve existing
  custom deals and archived affiliate status; do not silently overwrite them.
- [ ] Confirm actual supported reporting/payout integration and exact referral
  attribution through the Titans embedded checkout using official Whop support.
  Unsupported fields stay unavailable, never show invented zeros or estimates.
- [ ] Verify privacy, same-origin writes, retry safety, plan identity and
  actual first-payment commissions including the $10 Exclusive upgrade.
- [ ] Approve promotional kit and affiliate disclosure wording for launch.
- [ ] Full tests/review, GitHub push and immutable Contabo deployment only
  after approval; verify live. Never use Vercel.

## Approved production slice — September 5, 2026

- Removed the AI product thumbnail only; retained original image asset for other pages.
- Published the four user-supplied AI reference URLs with TikTok/Instagram embeds
  and direct-link fallbacks. Three view figures are explicitly Titans-reported,
  dated September 5. No invented hook, script, caption, rationale or CTA.
- Added `reportedViews` / `viewsSource` optional reference fields. Related approved
  resources still attach via `referenceId`. Other resource arrays remain empty.
- `POST /auth/whop/affiliates`: signed session, current eligible purchase, exact
  Origin + required custom header, existing rate limiter, no-store response.
  Request bodies/query user IDs are ignored; only signed `session.sub` is used.
- `WHOP_AFFILIATE_ENABLED=true` enables this feature and eligible My Titans navigation.
  Default false. Optional `WHOP_AI_PLAN_ID` defaults to the existing public AI plan.
  Flag owner: Titans; review the operational kill switch by September 19, 2026.
- Native Whop create-or-find affiliate; verify company/user/status and plan products.
  Add missing standard overrides only: 30% / first_payment. Existing conflicting
  deals, archived accounts, or relevant/unknown revenue-share scopes stop enrollment
  for manual review. No deal is deleted, replaced, unarchived, or stacked automatically.
- Whop-returned checkout links retain native `?a=<username>` attribution unchanged.
  Prices come from current Whop plans. Estimates are promotional estimates only,
  never a payout/commission ledger. Discounts, refunds and final Whop terms govern.
- Company-wide native referral totals feed earned/sales; unsupported clicks,
  conversion, pending/paid breakdown and recent rows remain unavailable. Missing
  rendering code fails closed, never showing placeholder zeros as real reporting.
- Personal payout setup opens `https://whop.com/home/?account=personal` in a new
  tab. Browser verified personal currency balance / Withdraw flow. Detailed native
  referral reporting opens `https://whop.com/affiliates/dashboard/`. No bank data,
  connected-business account, balance transfer, or payout API is added to Titans.
  Whop's embedded connected-account payout portal is not verified as a frontend
  to the native personal affiliate balance, so it is deliberately not used.
- Retry reconciliation re-reads overrides, in-process concurrent enrollment shares
  one promise per signed user, provider fetches have timeouts and no redirects.
  Whop records are the durable source of truth; no extra local affiliate PII store.

Sources: Whop API create-affiliate / create-override / list-overrides;
https://docs.whop.com/manage-your-business/manage-payouts/set-up-payouts;
https://developers.tiktok.com/doc/embed-player.

Pre-release verification: 65 tests pass, launch validator and diff checks pass.
Independent review approved after fixing raw account_id request, all-products
rev-share guard and required dashboard renderer. Local browser confirms all four
embeds, no AI thumbnail, copy feedback, and responsive toolkit. Dependency audit
not applicable: no package manifest/lockfile or installed dependencies; Node built-ins.

Release isolation: cherry-pick affiliate commits onto the currently deployed
285cb31 baseline in a fresh release worktree. Do not ship pending upgrade embed
commits in this release. Run release tests and browser checks again, push exact
release to GitHub, then deploy immutable static/auth releases via Contabo SSH.
Enable only after provider verification. Rollback: restore both current symlinks
to 20260905-285cb31 and restart titans-whop-auth; preserve durable member offer
records and all Whop agreements. Flag can also be disabled without removing data.
