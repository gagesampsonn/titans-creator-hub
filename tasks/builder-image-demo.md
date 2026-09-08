# Integrated Prompt Builder mock

Run `node ops/builder-preview/server.mjs` from this worktree.
URL: http://127.0.0.1:8892/prompt/#character-builder
Direct image section: http://127.0.0.1:8892/prompt/#titans-image-flow

This is a no-charge, local-only UI simulation. It reads the existing Prompt
Builder HTML, then injects the new module into the returned page. Neither
prompt/index.html nor generator/index.html is edited. Other worktrees and the
original supplied avatar package are untouched. No production deployment.

Flow: current finished character prompt -> mock original -> optional selfie ->
downloads -> Step 4 reference count of 1 or 2, preserving the existing video
prompt rules and section order. New character generation clears the prior selfie.
Original/selfie image slots reuse the two real test images saved earlier, clearly
labeled as samples unrelated to the current prompt, upload or accessory choice.

Mock credits start at15 on each reload. Both image actions cost one demo credit;
download costs zero. Six configured packs support a clearly labeled simulated
purchase, not Whop checkout. No account balance, allowance or payment logic.
At zero, generation stops but the existing prompt builder remains available.
Optional file selection is browser-only, PNG/JPEG/WebP <=8 MiB, <=4096px per side.
No uploaded image is sent to a server, OpenAI or Higgsfield.

Security and isolation:
- Exact loopback Host; listen127.0.0.1; all non-GET requests rejected.
- Static asset allowlist. No private repository files, keys or arbitrary proxy.
- Only two fixed sample image IDs are read from the existing owner preview8891.
  Keep `node ops/image-preview/server.mjs` running for initial sample loads.
  Samples cache in memory after loading. No generation endpoint is proxied.
- Whop member script suppression applies only to returned mock HTML. No auth
  service code is changed. Other member pages/download APIs are outside this mock.
- CSP inline-script hashes account for browser newline normalization. This
  regression was observed failing before the fix; no unsafe-inline scripts.

Verification September8,2026:
- 102 tests pass; launch validator passes; independent review no required findings.
- Mock model covers concurrency, failure without spending, zero credits, all pack
  quantities, original/selfie association and clearing a stale selfie.
- HTTP tests cover read-only routes, private paths, hostile Host and CSP hashing.
- Browser: clean reload initializes the real character prompt; Generate image
  changes15->14; selfie14->13; both buttons disabled while running; reference
  handoff sets2; generated video prompt includes @Image1 and @Image2.
- Mock100-credit purchase changes13->113 and closes the dialog with clear feedback.
- Download endpoints: original2,417,587bytes, selfie2,711,229bytes; separate filenames.
  Real preview attempt balance unchanged by all mock checks.
- 320/390/768/1024/1440px layouts have no horizontal overflow. Mobile pack dialog
  and desktop image section inspected visually. Browser error/warning logs clean.
- The production credit ledger, paid packs and admin controls remain unimplemented.

## Supplied character upgrade combined September 8

The owner approved the package at Documents/Codex/2026-09-08/lo/outputs/
titans-character-upgrade after sharing its PDF. The preview now includes a local
snapshot of its source HTML and complete 1,063-entry dataset in
ops/builder-preview/character-upgrade/. Original source files were not edited.
Imported HTML (newline-normalized) and parsed dataset match the supplied package,
including provenance metadata. Only the runtime library is exposed as an asset;
the snapshot HTML is not served as a separate, outdated page.

The supplied page was older than the website: replacing the whole page would
remove Instagram downloads and multiple image references. Instead, the composer
imports only Step 2 HTML, character engine, character event handlers and slot
control styles. Existing navigation, downloader markup/logic and video-reference
logic stay intact. Explicit boundary checks fail if either source shape changes.
There is no runtime dependency on the owner's Documents folder.

Local-only adaptations add category-specific accessible lock labels, 44px touch
targets and wrapping headers. Automatic unlocks must update the visible label as
well as aria-pressed. No claim that a text prompt guarantees perfect realism.

Browser checks: six locks/rerolls visible, Face preserved across a full reroll,
individual Hair reroll changes only Hair, exact garments preserved, new-character
default uses no replacement language, optional frame reference uses neutral
existing-person language. Image and selfie simulation reduces demo credits15->13;
handoff sets Step 4 to2 and its generated prompt includes both @Image1 and @Image2.
320/390/768/1024/1440 layouts have no horizontal overflow; touch targets44px.
Saved image examples remain mock results, not outputs of the newly rerolled prompt.

Final verification: 107 tests and launch validation pass. Independent review
identified the stale automatic-unlock label; both affected paths are corrected in
the composer, with failing-before/passing-after regressions for editing a locked
outfit and changing age with age-incompatible locked hair. Browser verification
confirms the label returns to Lock and aria-pressed=false. No API charges or live
deployment. Full rerolls, per-category rerolls and outfit inputs feed the same
finished prompt used by the image mock.
