# Discord identity for genuine affiliate wins

User confirmed their Discord referrals are genuine and asked to keep existing
server links/posts usable. Never default unrelated website payments to an
affiliate or replace Whop attribution with a manual commission calculation.

Verified September 8, 2026:
- Whop affiliate `aff_Sni73P27jGzfZ8`, owner `user_Kz6AMSQdjC0Fq`, username
  `gagesampson`, active; AI plan has a standard 30% first-payment agreement.
- Discord user `1060255772874903704` resolves to `gagesampson_`.
- Existing bot post `1543329779690905681` in channel `1323768647977537648`
  used generic `https://titansagency.co/ai/` on its Open AI Prompt Builder button.
  Updated only that button destination to `https://titansagency.co/r/gagesampson`.
  Readback verifies original labels, content and embed text are preserved.
  Original components backed up privately on the server for rollback.

Worker change: optional `TITANS_AFFILIATE_DISCORD_IDENTITIES` environment mapping
from exact Whop user ID to `{ "userId": "Discord snowflake", "username": "name" }`.
Snowflakes must be strings (numeric JSON loses precision). Mapping is validated
before provider calls or state writes. It affects author presentation and a
single allowed user mention only; no changes to earned amounts, native deals,
ownership checks, first-observation baselines or delivery deduplication.

Configure the verified mapping only in the private worker environment. Keep
the existing state directory and timer. Deploy worker code from an immutable
GitHub commit through a systemd ExecStart override; do not restart or replace
the website/auth service for this display-only change.

Verification: 12 worker/embed tests pass, including exact-owner isolation,
numeric IDs, malformed mappings, zero-earnings no-op, provider outage and lost
Discord-response reconciliation. Full current workspace suite: 88 tests pass
(includes two separate uncommitted image-key setup tests). Site validator passes.
Independent review approved after the numeric-ID boundary fix.

An actual new paid referral has not been submitted; there is no claim that
commission settlement or a real win notification has occurred during testing.
