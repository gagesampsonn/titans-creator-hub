# Character compatibility update — 2026-09-09

## Change

Merge Gage's updated local character-upgrade package into the live builder.
Adds the supplied compatibility helper: strict automatic outfit presentation and
profession matching, student workwear conflict filtering, and broad complexion
group rotation. Exact user outfit requirements remain authoritative.

The 1,063-entry library is semantically unchanged (upstream only reformatted it),
so it is not rewritten. The summary helper is unchanged. Preserve all live layout,
navigation, downloaders, multi-reference video prompts, Whop checks and image API
includes. No changes to backend, secrets, image storage, credits or paid packs.

## Verification before deployment

- New regressions failed before import and passed afterward.
- All 141 Node tests pass; launch-site validation passes.
- Independent review: 12,328 real-engine rerolls across ages 19–85, both genders,
  all 23 professions; 73,968 fragment/compatibility checks; no empty pools/errors.
- Browser local preview: female student wardrobe, locked face, six skin rerolls
  rotating light/medium/deep, exact black-shirt/blue-jeans requirement, image panel,
  desktop and 390px phone controls; no console errors.
- Prompt/generator byte-equivalent; layout before the engine and downloader/video
  JS tail unchanged from the prior production version.

## Release

Push GitHub before deploy. Immutable static payload ONLY:
prompt/index.html, generator/index.html, prompt/character-compatibility.js.
Copy/hash-verify all other files unchanged from 20260908-040ae87, then atomically
switch the Caddy static-root symlink. Auth stays on 20260908-62962ca; no restart,
database migration or paid image test needed for this local-only selection logic.

Rollback: atomically restore static current to 20260908-040ae87. Preserve all
customer data, credits and the unchanged API release. Verify auth health and live
signed-in builder after the switch; restore the prior pointer on failed checks.
