# Local five-stage Prompt Builder preview

Run `node ops/workflow-preview/server.mjs` from the repository, then open:

http://127.0.0.1:8896/prompt/

This is a local design proposal based on the supplied realistic AI video workflow visualization. Nothing is deployed. The production builder, authentication, referral attribution, image API and checkout are unchanged.

## Interaction

- Motion: record your own clip, expand the existing TikTok/Instagram downloader interfaces, or review the real reference examples.
- Character: existing character controls, locks, full prompt, image/selfie mock and credit-pack preview.
- Video setup: existing Higgsfield destination and setup screenshot; external video generation still requires its own credits.
- Video prompt: existing replacement prompt, strictness and 1–6 image reference selector.
- Finish: review/edit guidance, existing case studies and publishing checklist.

Stage changes show/hide persistent DOM panels, never re-create tools. Existing fragment links and image-to-video handoffs reveal their destination. Navigation is not completion tracking and does not mark work done automatically. Videos require explicit playback and pause when their stage closes.

## Safety and preview boundaries

The HTTP server binds only to loopback, validates Host, uses an asset allowlist and CSP, and refuses every non-GET request. Production member/image scripts are removed only from the served preview response. Downloader submits show a local-only message; they do not send requests. No keys or credentials are needed.

Image simulation reuses the existing builder demo's two fixed saved test photos through port 8892, which may require the existing owner sample preview on 8891 if its cache is cold. No new image generation is forwarded. Without those saved samples, the mock reports an error and keeps its demo credit. Mock credits reset on reload; mock purchases never collect money or change real balances.

To inspect responsive layouts on this computer: `/responsive?width=320` (also 390, 768, 1024, 1440). These are viewport-size reviews, not physical iPhone/Safari verification.

## Verification

- `node --test tests/*.test.mjs whop-auth/*.test.mjs`
- `node scripts/validate-launch-site.mjs`
- Browser: five-stage navigation, character prompt and trait-lock preservation, saved original/selfie simulation, image-to-video handoff selecting two references, actual generated video prompt containing both tags, local-only downloader feedback, inline/manual video playback attributes, phone/tablet/desktop visual checks and clean console.
- Code review found no blocking correctness/security issues. A browser check caught inherited light-theme text/surfaces and tall mobile toolbar buttons; the local scoped theme corrects both.

Before considering production, review the layout with Gage, remove local simulation dependencies, reconnect the unchanged real image client/member gate, and repeat authenticated browser tests. Do not deploy this directory or reuse its authentication removal in production.
