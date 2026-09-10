# Creator Kit countdown and membership style completion

## Requested updates

- Shared five-day campaign countdown on homepage/AI banners and above AI checkout. Fixed deadline: 2026-09-15 00:00 UTC (September 14, 8 PM Eastern). No storage-based visitor reset; every arrival/page shares the deadline.
- At expiry, banner, countdown, crossed-out comparisons, and current-offer label are removed. Checkout remains available at its configured Whop price; no automatic Whop price edit is implemented or claimed.
- Public product renamed AI Creator Kit across homepage, AI, Exclusive, Weekly, and completion copy. Prompt Builder remains the name of an included tool. Whop product IDs, attribution and membership checks are untouched.
- TikTok Titans overview and Weekly now use the same warm-white palette, Geist type scale, orange buttons, neutral borders and light checkout theme as Titans AI. Existing content, section order, membership tiers and purchase paths remain intact.
- Homepage uses the supplied Titans image in a smaller 64px image frame (visible mark approximately 24 by 35px), rather than the previous 96px frame. No source-image edits.

## Verification and deployment

- Timer tests: exactly five days, day rollover, synchronized placements, refresh/late arrivals, expiration and reopening after expiration. Public-offer and membership-content regressions added/updated.
- Full Node suite and launch validator pass. Whop read-only API confirms Weekly USD 15 every 7 days, no added initial fee; same existing plan and return URL retained.
- Local browser checks cover desktop, 320/390px mobile layouts, working countdown, smaller homepage logo and comparison navigation. Shared mobile-menu behavior is unchanged. Native video controls and deliberate playback preserved.
- Deploy only the ten public HTML/CSS/JS files listed by `ops/deploy-landing-pages.py`, from a pushed Git commit. Copy current release `20260909-69809e8`, verify unrelated files and symlinks unchanged, then atomically switch current.
- Previous release retained for rollback; private auth `20260908-62962ca`, data, credentials, credit balances, and Caddy unchanged. No paid test transaction submitted.

## Published and verified

- Published implementation commit `eeccc14` through GitHub and activated immutable Contabo release `/srv/titans-marketing/releases/20260909-eeccc14`.
- Release archive SHA256: `c5a18e28ca641bdebd0b2e0612a739ea0022230a0c91e029e0394f998f455f7e`. All ten live public files match the release archive bytes.
- Live homepage and AI timers were synchronized and ticking. AI checkout displayed USD 29.99 due today; Weekly checkout displayed USD 15 per week and USD 15 due today.
- Live homepage and Titans overview screenshots confirmed the light styling and smaller homepage header logo. Backend and configured checkout prices remain unchanged.
