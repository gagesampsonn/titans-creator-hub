# Implementation Plan: Titans Exclusive Course Draft

## Overview

Build a protected course library at `/exclusive/course/` that mirrors the
three approved Whop courses and keeps progress native to Whop. Preserve the
public `/exclusive/` sales page and add one obvious member entry point. The
first delivery is a local, reviewable rough draft; production deployment waits
for visual approval.

## Architecture Decisions

- Extend the existing dependency-free Whop authentication service instead of
  introducing a second login or backend.
- Gate the course page and every API request on live Titans Exclusive product
  access; AI-only and Weekly-only users remain denied.
- Read course metadata with the server-held Whop credential and use an explicit
  allowlist for the three current course IDs.
- Fetch full lesson content only when selected so signed Mux tokens are fresh
  and never included in the catalog response.
- Mint short-lived Whop user tokens server-side for progress reads and writes;
  do not create a Titans progress database.
- Keep the frontend static and dependency-light. Use Mux Player for hosted
  video, provider embeds for Loom/YouTube, and a contained PDF viewer.
- Use `/exclusive/course/` for the member area while keeping `/exclusive/`
  public for sales and checkout.

## Dependency Graph

```text
Existing Whop session
  -> Exclusive-only page/API gate
    -> Allowlisted course catalog and lesson detail API
      -> Native Whop progress API
        -> Responsive course player UI
          -> Exclusive sales-page entry point
```

## Task List

### Phase 1: Protected data path

- [ ] Task 1: Add the Exclusive-only page and API authorization contract.
- [ ] Task 2: Add allowlisted Whop catalog and lesson-detail endpoints.

### Checkpoint: Protected catalog

- [ ] Existing Prompt Builder authentication tests still pass.
- [ ] Signed-out, Weekly-only, and AI-only users fail closed.
- [ ] Only the three approved courses and visible lessons are returned.

### Phase 2: Member progress and interface

- [ ] Task 3: Add native Whop lesson progress endpoints with CSRF protection.
- [ ] Task 4: Build the accessible desktop/mobile course shell.
- [ ] Task 5: Connect Mux, Loom, YouTube, PDF, navigation, and completion states.

### Checkpoint: Complete member flow

- [ ] A test member can sign in, open content, change chapters, complete a
  lesson, refresh, and see the saved state.
- [ ] Keyboard navigation and 320/768/1024/1440 responsive checks pass.
- [ ] Browser console and same-origin network requests are clean.

### Phase 3: Rough-draft handoff

- [ ] Task 6: Add the public Exclusive-page member entry point and validate all
  existing launch routes.
- [ ] Task 7: Produce local desktop and mobile screenshots for user review.

### Checkpoint: Ready for visual review

- [ ] Full auth/course test suite passes.
- [ ] Static launch validation passes.
- [ ] No secrets, generated output, homepage, pricing, or unrelated sections
  changed.
- [ ] No production deployment occurs before the user approves the draft.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Broad Whop credential could expose unrelated business APIs | High | Keep it server-only, never log it, return a strict response allowlist, and scope minted member tokens |
| Whop response fields differ from older documentation | Medium | Normalize only observed fields and use boundary fixtures in tests |
| Signed Mux tokens expire | Medium | Fetch lesson detail on selection and send `Cache-Control: no-store` |
| A valid Whop lesson ID could bypass the intended catalog | High | Resolve every lesson through the server-owned course allowlist before returning content or mutating progress |
| Static interface becomes difficult on mobile | Medium | Use one-column mobile flow, semantic accordions, and breakpoint browser checks |

## Open Questions

- None blocking. Visual hierarchy and wording will be reviewed from the rough
  draft before production deployment.
