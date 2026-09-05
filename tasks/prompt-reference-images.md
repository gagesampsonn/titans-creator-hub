# Multiple image references — September 5, 2026

## Scope

- Add a 1–6 reference-image selector to the existing video prompt form on both
  `/prompt/` and its mirrored `/generator/` route. Default remains one image.
- Generate every selected `@ImageN` tag. Keep `@Video1` as the motion reference,
  `@Image1` as the primary replacement, and additional images as supporting views
  of the same replacement. Give the primary image priority if references conflict.
- Refresh attachment guidance, clear stale output on changes, and reset to one.
- No uploads, authentication, Whop billing, referral attribution or API changes.
- Ship only this focused change onto the clean affiliate release, not the pending
  upgrade-preview branch history. Deploy to Contabo, never Vercel.

## Verification

- Four new behavioral tests: single-image compatibility; both routes and all six
  replacement modes with multiple counts; copy/change/reset; malformed counts.
- New tests failed before implementation and pass afterward.
- Full automated suite and launch validator pass locally.
- Independent review approved; startup hint synchronization included in response.
- Browser check: two-image generation, copy-button click, stale-output clearing and reset;
  desktop and phone layouts checked before release.
- Clipboard contents are covered by the behavioral test; the browser automation's
  virtual clipboard could not read the native clipboard written by the page.

## Related payout clarification

Whop can restore a member's last-used business dashboard even when opening its
personal-balance URL. Affiliate payout guidance now explicitly says to choose
Personal first. No bank information is collected by Titans; payout setup remains
on Whop. No withdrawal or banking change was performed during verification.
