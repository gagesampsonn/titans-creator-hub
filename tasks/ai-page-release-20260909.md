# AI page: deliberate video playback and current benefits — 2026-09-09

## Root cause and change

The page's IntersectionObserver called play() as showcase videos entered a
120px visibility margin. On mobile it intentionally autoplayed the result clip.
Removed that automatic playback controller entirely. All three examples now use
native controls and playsinline/webkit-playsinline; only deliberate Play starts
them. A manually started video may continue during scrolling. No fullscreen API,
scroll listener, touch handler or replacement modal is added.

Inline-playback reference: https://webkit.org/blog/6784/new-video-policies-for-ios/.
The reported native iPhone fullscreen interruption cannot be reproduced directly
in this desktop browser; the underlying scroll-triggered play call is reproduced
with the actual old script in a failing regression and eliminated by this fix.

Updated existing hero/pricing, workflow, benefits, checkout summary and FAQ:
character/video prompts; real image generation; 15 lifetime credits granted once;
original-backed close-up selfies sharing those credits; guide and permission-based
TikTok/Instagram downloaders; user-confirmed AI-only Discord section; Affiliate
Center. Clearly exclude main community/course/calls/audits/samples/brand deals and
external video-platform subscriptions/credits. No paid image-pack availability
claim; no new pricing, plan, affiliate, permission, backend or credit changes.

## Verification

- Three new regression/content tests failed before and pass after changes.
- All 144 Node tests and launch validator pass. Updated the previous validator
  rule forbidding controls to enforce manual inline playback instead.
- Local browser: all three videos paused before and after anchor scrolling;
  controls/inline attributes present; desktop layout has no horizontal overflow.
- Browser screenshots: 320px and 390px phone layouts and desktop benefits grid.
- Whop $29.99 checkout renders locally; no payment submitted. Local third-party
  checkout reported sessionKey/pixel warnings; production checkout code unchanged.
- Independent review: no blockers; clarified that scrolling does not start videos,
  rather than claiming scrolling pauses videos the visitor has already played.

## Deployment

GitHub commit/push first. Immutable Contabo static release changes ONLY ai/index.html.
Copy current 20260909-746dc20, verify all unrelated files remain hash-identical,
atomically switch current, verify live /ai/ and auth health. Roll back by restoring
the prior static symlink if verification fails. Auth remains 20260908-62962ca;
no service restart, schema migration or customer-data changes.
