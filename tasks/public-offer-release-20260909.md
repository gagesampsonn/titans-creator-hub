# Public AI offer display

- User requested the orange banners and $45 struck through beside $29.99 on the live website.
- Always-visible HTML banner on homepage and AI landing, linking to AI checkout. Repeated comparison beside the hero price and directly above the embedded payment form.
- Uses the user-specified $45 comparison and the Whop-verified $29.99 one-time checkout price. No Whop plan, price, recurring billing, or affiliate behavior changes.
- Copy says "Current offer". No deadline, scarcity claim, or countdown enabled: awaiting confirmation of 10-minute expiry versus a fixed date and checkout enforcement. The old localhost countdown script is no longer loaded by public HTML; retained as prototype source only.
- Two homepage paths, all existing sections, and third-party video-cost disclosure preserved. No Higgsfield mention added.
- Full Node tests and launch validator passed. Browser checked desktop and 320px banner/hero/checkout; no overlap or clipped price.
- Three-file immutable release copied from `20260909-159042a`; strict payload/archive verification and all unrelated files checked unchanged. Previous pointer is the rollback target. Backend remains untouched.

## Published

- Live release: `/srv/titans-marketing/releases/20260909-69809e8`, pushed through GitHub first.
- Archive SHA256: `362dabb3d15e6e658b4c03af1a44d33c47c281044606358200c182fec10bc919`.
- All three live files match the release archive; immediate auth health and homepage/AI/Exclusive response checks passed.
