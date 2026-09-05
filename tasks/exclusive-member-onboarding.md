# Exclusive member onboarding

Successful Exclusive checkouts return to `/exclusive/course/`. Whop login and
the existing live Exclusive membership check still protect that destination.
The course page links to Discord (Full Access) on Whop and `/prompt/`; each
opens in a new tab so the current lesson stays open.

The Discord destination was verified against the Exclusive product's Whop
experiences and its member-facing account selection / Claim Access screen:
`https://whop.com/tiktoktitan/exp_IO7Nn4xZjBg3ZN/app/`.

## Whop configuration accompanying this release

For Exclusive product `prod_kdcibFkgij8Fl`, set `redirect_purchase_url` to
`https://titansagency.co/exclusive/course/`. This also covers hosted purchases.
The prior after-checkout destination, for rollback, is:
`https://whop.com/joined/tiktoktitan/join-discord-IO7Nn4xZjBg3ZN/app/`.
Use the existing server-side credentials and update only this one field.

The embedded checkout keeps its completion URL so external-payment failures
can show the retry path. Successful returns (or the regular return without a
status parameter) continue to the protected course. Unknown status values do
not trigger automatic navigation. A URL parameter never grants access.

## Verification

- `node --test tests/checkout-return.test.mjs whop-auth/auth.test.mjs whop-auth/course.test.mjs`: 26 passing tests.
- `node scripts/validate-launch-site.mjs`: passed.
- `git diff --check`: passed.
- Browser: successful and failed checkout returns; member links at 320, 768,
  1024, and 1440px; keyboard focus. The local static preview has no course API,
  so authenticated content is verified on production after release activation.
- No real purchase or Discord role claim is made during verification.

Deploy the committed GitHub revision into a new directory under
`/srv/titans-marketing/releases/`, then atomically switch the `current` symlink.
The previous static release is `20260904T181536Z-7defbb2`. The running auth/API
service needs no change or restart for this release.
