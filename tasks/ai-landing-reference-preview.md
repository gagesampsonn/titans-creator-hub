# AI landing reference adaptation — local only

Reference supplied: https://debate-beats-late-cell.trycloudflare.com/

Applied the reference's compact headline, adjacent price/action, and two-column
before/after media treatment to `/ai/`, using the existing dark Titans tokens.
Follow-up: per the user's correction, the AI landing page now uses the reference's
warm-white surfaces, dark text and orange actions, including a light checkout
theme. Tokens and overrides remain scoped to this page; other Titans pages
retain their existing themes.
Retained the homepage's two paths, page section order, navigation, all current
benefits, $29.99 one-time price, Whop plan, return URL and referral scripts.
Did not import the reference's promotion timer, unverified $59 comparison price,
saved-project claims, or routes that do not exist in the Titans site.

The new stylesheet is page-scoped. All three videos require explicit playback
and retain native controls and inline playback attributes. No backend changes,
new dependencies, image generation calls or payment transactions.

Preview: http://127.0.0.1:8898/ai/ (loopback-only temporary Node server).
The preview response disables the checkout loader and substitutes a payment
placeholder; source checkout markup is unchanged. No production deployment.

Verification: all 143 existing tests and the launch validator passed. Updated
the validator's design-specific assertions for the intentional Before/After
layout; pricing, checkout isolation and playback safety checks remain enabled.
