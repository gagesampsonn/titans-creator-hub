# Affiliate wins and coach access — September 7, 2026

## Contract

- Preserve all existing Whop agreements. Only a server-side approval matching the
  exact member and every revenue-share term permits the new 30% first-payment
  referral deals to coexist. Changed terms return to review; no global bypass.
- The user approved the existing coach revenue share plus the referral program.
- A labeled fictional sample was sent to the explicitly approved account as a
  separate Titans Bot DM. No sample goes to the production payouts channel.
- Poll Whop's native standard overrides for the site's two plans every minute.
  The public API has no per-sale affiliate webhook/linkage. Report increases in
  Whop-reported earnings, not fabricated individual sales, sale prices or payouts.
- Exclude coach revenue shares and unrelated plans. First observations establish
  baselines without backfilling historical earnings. Decreases do not celebrate.
- Use a dedicated single-instance worker and private durable state for delivery
  deduplication only. This is not an attribution, commission, or payout ledger.
- Only the configured Discord channel receives notices. No customer identities,
  email addresses, payment details, mass mentions, or unverified Discord mentions.
- Credentials remain server-only. Deploy immutable releases through GitHub and
  Contabo. Existing Caddy routes, authentication and upgrade flow stay unchanged.

## Operational questions

Did the last poll succeed? Did a notice deliver? Are any sends unresolved? Emit
structured per-run logs with counts, duration and safe error codes, never payloads
or credentials. Stop the timer to disable notifications; preserve state on deploy.

## Operations and recovery

- Install both worker modules in the immutable auth release. Install the service
  and timer in `/etc/systemd/system/`, then run `systemd-analyze verify` and reload.
- Create `/var/lib/titans-affiliate-wins` as www-data, mode 0700, before starting
  the service. The service uses flock, atomic state replacement, file/directory
  fsync and mode 0600 state. Never delete state during a release or retry.
- Provision only the necessary Whop and bot credentials plus explicit company,
  plan, product, bot, guild and channel IDs in `/etc/titans-affiliate-wins.env`,
  root-owned mode 0600. Never place this file in a release or source control.
- Start the oneshot service once to establish a baseline; expect zero deliveries.
  Enable the timer only after a successful baseline and destination validation.
  A newly observed override always starts at its current total: activity before
  its first successful observation is deliberately not announced retroactively.
- Inspect `journalctl -u titans-affiliate-wins.service` for structured success or
  failure codes. An inactive oneshot after successful completion is normal.
  Check timer activity separately. Provider failures fail closed and retry next
  cycle; unresolved sends search bot-authored history before another send.
- Stop/disable `titans-affiliate-wins.timer` to pause. Preserve the state and env
  files. To roll back auth, restore the previous immutable symlink and restart
  `titans-whop-auth`; stop the timer first if the older release lacks the worker.
- Revenue-share approvals belong only in the existing private auth environment.
  Snapshot and verify exact existing terms before approval; preserve unrelated
  environment entries and every existing Whop override.
- Automated coverage includes empty/history baselines, positive changes,
  refunds/decreases, new changes while pending, provider failure, incomplete
  pagination, destination mismatch, and lost-response delivery reconciliation.

## Sources

- https://docs.whop.com/developer/guides/affiliates
- https://docs.whop.com/api-reference/affiliates/list-overrides
- https://docs.discord.com/developers/resources/message
