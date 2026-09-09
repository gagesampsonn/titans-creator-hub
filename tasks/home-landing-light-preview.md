# Homepage light-style preview — September 9, 2026

## Scope

- Main homepage now reuses the approved AI landing Geist typography, warm white background, neutral borders, and Titans orange actions.
- TikTok Titans and Titans AI remain the two paths. Section order, links, tracking hooks, proof videos, purchase routes, and founder SEO content are unchanged.
- Homepage-specific styles are isolated in `assets/home-landing.css`; no shared commerce behavior changed.
- Mobile uses stacked product cards; tablet and desktop retain the two-column selector. Removed gradient text, dark glows, and benefit pills from this page.
- Local preview: http://127.0.0.1:8901/

## Checkout urgency

- Existing localhost-only AI promotion preview now repeats the price comparison and the same deadline immediately above checkout.
- Review URL: http://127.0.0.1:8901/ai/?bannerPreview=1#checkout
- Explicit review mode is clearly labelled and holds at 10:00 for design inspection. Ordinary preview mode shares the banner deadline, survives refresh, and hides on expiry.
- This is not a live promotion. Public AI pricing remains unchanged. Confirm the actual offer duration/end date and enforce the expired price through Whop before enabling live urgency.
- No changes to the existing server-enforced member Exclusive upgrade offer.

## Verification

- Full Node test suite passed (`node --test --test-reporter=dot tests/*.test.mjs whop-auth/*.test.mjs`).
- Launch validator passed; no route, price, plan, embed, or local asset regressions.
- Browser screenshots reviewed at 320, 390, 768, 1024, and 1440px. Mobile navigation expands correctly; FAQ disclosure tested; videos retain controls and inline, non-autoplay playback.
- Preview blocks private files and POST requests and strips live checkout loading/links. No purchases or live API calls made.
- Live site unchanged; deployment not performed.
