# Integrated Prompt Builder mock

Run `node ops/builder-preview/server.mjs` from this worktree.
URL: http://127.0.0.1:8892/prompt/#character-builder
Direct image section: http://127.0.0.1:8892/prompt/#titans-image-flow

This is a no-charge, local-only UI simulation. It reads the existing Prompt
Builder HTML, then injects the new module into the returned page. Neither
prompt/index.html nor generator/index.html is edited. Other worktrees and the
separate avatar-uniqueness work are untouched. No production deployment.

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
- The production credit ledger, paid packs, admin controls and the other AI's
  avatar improvements are not implemented or merged by this mock.
