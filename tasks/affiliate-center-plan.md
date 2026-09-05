# Titans Affiliate Center

User approved a separate plan and a localhost-first review on 2026-09-05.
Do not push or deploy until the user reviews this preview. Preserve the existing
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
