# Spec: Whop Course Progress

## Objective

Keep lesson progress native to Whop while members use the Titans website.
Members can see completed lessons and deliberately mark the current lesson
complete without returning to Whop.

## Tech Stack

- Existing Whop user ID from the signed Titans session
- Whop short-lived company-scoped user access tokens
- Whop lesson interaction, start, and completion endpoints
- Stateless HMAC-signed CSRF tokens

## Commands

```bash
node --test whop-auth/course.test.mjs
node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs
```

## Project Structure

```text
whop-auth/server.mjs       User-token minting and progress proxy
whop-auth/course.test.mjs  Progress authorization and mutation tests
exclusive/course/index.html Progress display and completion controls
```

## Code Style

```js
async function markLessonComplete(context, lessonId) {
  assertAllowedLesson(context.catalog, lessonId);
  const userToken = await createWhopUserToken(context);
  return postWhop(userToken, `/course_lessons/${lessonId}/mark_as_completed`);
}
```

- Derive the Whop user ID only from the verified session.
- Keep mutation handlers idempotent from the browser's perspective.
- Mint short-lived user tokens only when needed and never return them.

## Interface Contract

### Progress read

`GET /course-api/catalog` overlays Whop lesson interactions for the signed-in
user and the allowlisted courses. The browser receives lesson completion
booleans and aggregate completed/total counts, not other students' records.

### `POST /course-api/lessons/{lessonId}/start`

Records that the signed-in member opened the lesson. Returns:

```json
{ "data": { "started": true } }
```

### `POST /course-api/lessons/{lessonId}/complete`

Marks the lesson complete in Whop. Returns:

```json
{ "data": { "lessonId": "lesn_...", "completed": true } }
```

Both mutations require `Content-Type: application/json`, a same-origin request,
and the `X-CSRF-Token` returned by the catalog endpoint.

The service mints a short-lived Whop user token using the authenticated Whop
user ID and Titans company context. The credential is scoped to
`courses:read` and `course_analytics:read`, used server-side, and discarded.

## Testing Strategy

- Verify progress queries always filter by the session user ID and approved
  course IDs.
- Verify a client-supplied user ID is ignored or rejected.
- Verify missing/invalid CSRF, cross-origin requests, invalid lesson IDs, and
  non-Exclusive users cannot mutate progress.
- Verify repeated completion requests remain successful.
- Verify Whop user tokens and API keys never appear in responses or logs.

## Boundaries

- Always: store progress in Whop, use short-lived scoped user tokens, validate
  lesson ownership, and require CSRF protection.
- Ask first: adding local progress storage, collecting viewing analytics, or
  automatically completing a lesson based on watch percentage.
- Never: store member email/name for progress, accept another user's ID from
  the browser, or expose a Whop token to the frontend.

## Success Criteria

- Completion survives refreshes and is visible again through Whop-backed
  progress.
- Members can move between lessons while completed states and totals update.
- No Titans-side progress database or duplicated member PII is introduced.

## Open Questions

- None. Completion is a deliberate member action rather than watch-time based.
