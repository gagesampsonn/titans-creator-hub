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
