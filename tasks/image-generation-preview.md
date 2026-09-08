# Owner-only image generation preview

Scope: an isolated localhost image-generation workbench, not a production member feature.
Do not edit the avatar builder being developed separately. No Whop/credit/purchase changes.

Contract:
- Loopback HTTP server, exact Host and Origin checks, JSON-only POST, no CORS.
- POST /api/generations accepts {id: UUID, prompt: string (10–4000 characters)}.
- GET /api/state returns up to five persisted preview attempts and their states.
- GET /api/images/:id returns only a completed, saved PNG. Downloads do not generate.
- Server fixes gpt-image-2, high, 1024x1536, n=1, PNG. Text-only first slice.
- Existing SSH authentication connects the owner’s local server to a private CLI.
  The OpenAI key never leaves Contabo; no public generation endpoint is created.
- A filesystem exclusive lock serializes claims. Save intent before calling OpenAI;
  duplicate ID/payload replays status, changed payload rejects. Five total attempts.
- Timeouts/transport uncertainty never trigger automatic generation retries. An
  uncertain or interrupted provider request blocks new work pending manual review.
- Store results and allowlisted usage metadata privately outside Git. Do not store
  prompt text, raw provider errors, or credentials in logs/responses.
- No preview attempt counter is represented as a customer credit entitlement.

Official sources checked September 8, 2026:
https://developers.openai.com/api/docs/guides/image-generation
https://developers.openai.com/api/docs/models/gpt-image-2
Output estimate for high portrait: $0.165, plus text input. Paid pack economics and
production credit accounting remain a separate unfinished integration.

Verification:
- One real Generate click succeeded and saved a PNG: 1024x1536, 2,417,587 bytes,
  approximately 122 seconds. Provider-reported usage: 103 text input tokens,
  0 image input tokens, 5,488 image output tokens. Standard-rate calculated
  generation cost $0.165155 (not an invoice reconciliation).
- Download endpoint returns 200 image/png and attachment disposition; downloading
  does not change attempts. Four live preview attempts remain after our test.
- 320, 390, 768, 1024 and 1440px browser checks found no horizontal overflow.
  Real loading, disabled button, completion and image display verified.
- Independent review caught and fixed lock-time duplicate replay, parent-directory
  durability, and overlapping HTTP-body concurrency. Both race regressions were
  observed failing before the fixes. Seven focused tests pass.
- A single persistent authenticated SSH stdio connection replaced per-poll SSH;
  connection failures have a 60-second reconnect cooldown. No public API listener.
- Generated files/attempt records live in /var/lib/titans-image-preview, not Git.
  The five-attempt preview is operator-only and not the production credit ledger.

Run: `node ops/image-preview/server.mjs` in this Windows worktree. Local URL:
http://127.0.0.1:8891/
Server-side private helper: /opt/titans-image-preview/worker.mjs.
Stop the local server to close its preview connection. No production service restart.
