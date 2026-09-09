# Landing page release — September 9, 2026

- Authorized: publish the reviewed homepage, AI landing, and Exclusive light design.
- Scope: nine public HTML/CSS/JS/logo files. Protected builder, course, member pages, checkout completion handler, referral attribution, API runtime, and Caddy configuration remain unchanged.
- Whop API read-only verification: AI plan `plan_bJeNjIIJAtzSR` matches the configured AI product, USD 29.99 one-time. Exclusive plan `plan_i0exA8Z5f3XOZ` matches the configured Exclusive product, USD 50 every 30 days, no trial.
- Both existing live embedded payment forms render their correct price. AI completion links to authenticated Prompt Builder; Exclusive completion opens membership-protected course.
- Countdown and regular-price comparison remain localhost-only previews. No unenforced public deadline or unconfigured price increase enabled.
- All Node tests and launch validation passed. Prior local browser checks cover desktop and 320/390/768/1024/1440px layouts, mobile navigation, FAQ, and checkout offer preview. Video autoplay remains disabled.
- GitHub push precedes Contabo deployment. A strict nine-file Git archive is applied to a copy of `20260909-8cf19aa`; every unrelated regular file and symlink is verified unchanged before activation.
- Rollback: atomically restore `/srv/titans-marketing/current` to `/srv/titans-marketing/releases/20260909-8cf19aa`. The deploy script automatically does this if immediate live HTML/hash or auth-health verification fails.
- Private auth remains `/opt/titans-whop-auth/releases/20260908-62962ca`. No restart, migration, environment edit, payment submission, or paid image test.

## Live verification

- Published GitHub commit `159042a` as `/srv/titans-marketing/releases/20260909-159042a`.
- Archive SHA256: `17a1f5b1a970894f2f9f36be975e6dbb4e58922f2268508cfd52093478bf3f47`.
- All nine public responses match the exact release archive. Git archive applies Windows checkout line endings; text comparison with Git blobs also matches after line-ending normalization.
- Homepage, AI, Exclusive, checkout completion, and auth health return 200. Anonymous Prompt Builder/course requests redirect to Whop login; anonymous image state returns 401. Login redirects to Whop OAuth.
- Fresh browser pages render the light design and both embedded forms: AI USD 29.99 and Exclusive USD 50 per month. No provider-name mentions or local-preview messages on the new AI page. Referral parameter and AI completion URL are present in the Whop iframe.
- No new homepage browser errors. Whop iframe analytics report existing speed-insights parsing and Meta/TikTok pixel configuration warnings; payment UI renders, but tracking health is not asserted. No test purchase submitted, so a newly settled payment was not exercised.
- Python 3.10 compatibility check stopped the first staging attempt before any release was created; corrected streaming hash verification, tested empty/small/multi-chunk inputs, pushed the fix, and successfully staged/activated.
- Previous static release retained for rollback; unrelated user worktree changes excluded from commits and deployment.
