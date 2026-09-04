# Titans Exclusive Course Tasks

## Task 1: Add the Exclusive authorization contract

**Description:** Extend the existing Whop session gateway with a dedicated
Exclusive-only check for the course page and JSON authorization for course API
requests.

**Acceptance criteria:**
- [ ] `/exclusive/course/` redirects signed-out users through Whop and back.
- [ ] Only active Titans Exclusive access succeeds; AI and Weekly do not.
- [ ] Authentication and provider failures fail closed without leaking secrets.

**Verification:**
- [ ] `node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs`
- [ ] Inspect the Caddy route contract for page and API coverage.

**Dependencies:** None

**Files likely touched:**
- `whop-auth/server.mjs`
- `whop-auth/auth.test.mjs`
- `whop-auth/course.test.mjs`
- `whop-auth/Caddyfile.routes`

**Estimated scope:** Medium

## Task 2: Serve the allowlisted Whop catalog and lesson details

**Description:** Add normalized catalog and lesson endpoints for the three
approved courses, including Mux, Loom, YouTube, text, and PDF media forms.

**Acceptance criteria:**
- [ ] Catalog preserves Whop course/chapter/lesson order and visible content.
- [ ] Full content and signed playback data are returned only for allowlisted
  lessons through the detail endpoint.
- [ ] Responses use no-store caching and stable JSON errors.

**Verification:**
- [ ] `node --test whop-auth/course.test.mjs`
- [ ] Boundary fixtures cover every current lesson/media type.

**Dependencies:** Task 1

**Files likely touched:**
- `whop-auth/server.mjs`
- `whop-auth/course.test.mjs`

**Estimated scope:** Medium

## Checkpoint: Protected catalog

- [ ] `node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs`
- [ ] Only approved course IDs are present in test responses.
- [ ] Prompt Builder authorization behavior is unchanged.

## Task 3: Keep completion progress native to Whop

**Description:** Read the current member's lesson interactions and proxy start
and completion actions through short-lived Whop user tokens.

**Acceptance criteria:**
- [ ] Catalog completion states are filtered to the authenticated member.
- [ ] Start and complete reject invalid CSRF, origins, and non-allowlisted IDs.
- [ ] Whop credentials and member tokens never enter browser responses.

**Verification:**
- [ ] `node --test whop-auth/course.test.mjs`
- [ ] Repeated completion calls remain successful in the boundary tests.

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `whop-auth/server.mjs`
- `whop-auth/course.test.mjs`

**Estimated scope:** Medium

## Task 4: Build the responsive course shell

**Description:** Create the understandable first-pass member interface with
course selection, chapters, lessons, loading/error states, and URL state.

**Acceptance criteria:**
- [ ] Desktop uses a clear lesson sidebar and main content area.
- [ ] Mobile stacks course navigation and content without horizontal overflow.
- [ ] Controls are semantic, keyboard accessible, and expose current/completed
  state without relying on color alone.

**Verification:**
- [ ] `node scripts/validate-launch-site.mjs`
- [ ] Browser checks at 320px, 768px, 1024px, and 1440px.

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `exclusive/course/index.html`
- `scripts/validate-launch-site.mjs`

**Estimated scope:** Medium

## Task 5: Connect media, navigation, and completion

**Description:** Render each supported Whop lesson type, wire previous/next
navigation, and update completion state from the progress API.

**Acceptance criteria:**
- [ ] Mux, Loom, YouTube, PDF, and text lessons render in the member area.
- [ ] Previous/next follows Whop order across chapter boundaries.
- [ ] Marking complete updates the UI and survives a catalog refresh.

**Verification:**
- [ ] `node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs`
- [ ] Manual browser test using one real lesson of each current media type.

**Dependencies:** Tasks 3-4

**Files likely touched:**
- `exclusive/course/index.html`
- `whop-auth/course.test.mjs`

**Estimated scope:** Medium

## Checkpoint: Complete member flow

- [ ] Sign-in, catalog, playback, completion, refresh, and logout work.
- [ ] Browser console contains no first-party errors.
- [ ] Keyboard and responsive checks pass.

## Task 6: Add the Exclusive-page member entry point

**Description:** Add one clear link from the existing public Exclusive page to
the protected course without changing its sales structure or checkout.

**Acceptance criteria:**
- [ ] Existing members can find the course from `/exclusive/`.
- [ ] Existing sales copy, pricing, checkout, and Prompt Builder links remain.
- [ ] The static route validator covers the new destination.

**Verification:**
- [ ] `node scripts/validate-launch-site.mjs`
- [ ] `git diff --check`

**Dependencies:** Tasks 1-5

**Files likely touched:**
- `exclusive/index.html`
- `scripts/validate-launch-site.mjs`

**Estimated scope:** Small

## Task 7: Prepare the rough draft for review

**Description:** Run the complete verification set and capture local desktop
and mobile screenshots. Do not deploy yet.

**Acceptance criteria:**
- [ ] All automated checks pass.
- [ ] Desktop and mobile screenshots are ready for user feedback.
- [ ] No unrelated or generated files are included.

**Verification:**
- [ ] `node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs`
- [ ] `node scripts/validate-launch-site.mjs`
- [ ] `git diff --check`
- [ ] Browser console and network inspection.

**Dependencies:** Tasks 1-6

**Files likely touched:**
- None beyond review artifacts outside version control.

**Estimated scope:** Small

## Checkpoint: Ready for visual review

- [ ] User reviews the rough draft before production deployment.
