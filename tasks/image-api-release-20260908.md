# Image API release — 2026-09-08

## Scope and safety

Connect the existing Whop-authenticated builder to real OpenAI image generation.
Fixed backend model/settings: gpt-image-2, high, 1024x1536 PNG, one image.
Original prompt generation, optional reference edit, original-backed close-up
selfie, private download, 15 lifetime credits granted once per eligible Whop user.
No separate authentication or payout system; no changes to affiliate attribution.

The six pack configurations and payment adapter are implemented but paid sales
remain disabled in BOTH the backend environment and database. Real checkout,
refund/reversal and fee/margin validation are still required before enabling them.
Payment unit/integration fixtures are not a substitute for provider test mode.

Private files expire after 30 days; uploads are normalized in memory, not retained.
One active job/member, two globally, four attempts/minute/member; 4,000-byte prompt,
8 MiB reference, 4096-pixel maximum sides, 2 GiB disk headroom. Reserve before
dispatch; deduct only after durable storage; unknown outcomes hold the credit.
Rolling spend limits start at $10/24h and $20/30d including uncertain reservations.
No account funding or automatic reload changes are part of this deployment.

## Verification before deployment

- 139 Node tests pass; launch-site validation passes; dependency audit: zero vulnerabilities.
- Real isolated PostgreSQL integration passes: concurrent allowances/reservations,
  duplicate requests, payment/refund idempotency, admin controls and rolling budgets.
- Browser: local real-client fixture at 8894, desktop and 390px mobile; consent
  gate, 15-credit display, six disabled pack cards, mobile dialog, no JS errors.
- Rejection feedback and unknown-state recovery timestamp regressions tested RED/GREEN.
- Independent review completed; provisioning password is fsynced privately before
  committing the new role/schema, so interrupted deployment remains recoverable.

## Deployment and rollback

Commit/push GitHub before archiving. Prepare a new immutable private auth release
with npm ci --ignore-scripts; install additive schema with a restricted runtime
role; keep the private env outside both release roots. Caddy adds only
/image-api/* -> loopback Whop auth service; every member route checks live access.

Static payload is ONLY index.html, prompt/index.html, generator/index.html and
the three assets/image-builder files. Existing static files are copied unchanged
and hash-verified. Backend dependencies/source are not added to the static root.
The index addition is one co-founder footer link plus matching Organization JSON-LD,
based on https://gagesampson.com/; homepage structure and main content unchanged.

Previous pointers: auth 20260907-49772c4, static 20260908-638418c.
Deployment script restores both pointers/configuration on failed startup checks.
After successful launch, emergency pause: use image-admin.mjs configure through
authorized SSH with {"generationEnabled":false,"salesEnabled":false} on stdin.
Never roll back/delete the credit ledger or customer files to roll back code.

## Admin and cost interpretation

Root-only image-admin.mjs supports overview, configure, pack, adjust and
resolve-failure (JSON stdin; no public admin API). Adjustments use unique UUIDs;
uncertain jobs can only be released after confirmed provider failure, minimum
10 minutes, no saved PNG and recorded evidence/cost. No blind automatic retries.

Overview reports usage-derived cost estimates, NOT invoice-confirmed charges.
Rates verified against official OpenAI model/pricing docs: text $5/M tokens,
image input $8/M, output $30/M. Missing usage/unknown requests reserve $0.25.
Prior owner tests cost approximately $0.165–$0.178/image before checkout fees,
failures and storage. Paid-pack economics must include all of those costs and
any applicable affiliate fees; do not imply the $0.30/photo pack is approved yet.

## Post-deployment verification

Pending at commit: live signed-in allowance persistence, original+selfie generation,
downloads, anonymous denial, saved-file permissions, real usage totals and health.
Record actual outcomes after deployment; do not claim launch completion until then.
