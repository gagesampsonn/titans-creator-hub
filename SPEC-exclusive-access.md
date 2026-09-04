# Spec: Exclusive Access

## Objective

Reuse the production Titans Whop OAuth session to protect the new course page
and every course API request. A user must have live access to the Titans
Exclusive product. Access to Titans Weekly or the standalone AI Content product
must not unlock the course.

## Tech Stack

- Node.js 22 dependency-free HTTP service in `whop-auth/server.mjs`
- Caddy 2 `forward_auth` at the public edge
- Whop REST API v1 product access check
- Existing HMAC-signed, HTTP-only `titans_whop_session` cookie

## Commands

```bash
node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs
node scripts/validate-launch-site.mjs
```

## Project Structure

```text
whop-auth/server.mjs       Authentication and protected course API
whop-auth/auth.test.mjs    OAuth and entitlement tests
whop-auth/course.test.mjs  Course authorization and API tests
whop-auth/Caddyfile.routes Production routing contract
course/index.html          Protected course application shell
```

## Code Style

```js
async function hasExclusiveAccess(config, fetchFn, userId) {
  return checkProductAccess(
    config,
    fetchFn,
    userId,
    config.exclusiveProductId,
  );
}
```

- Use small functions with explicit inputs rather than global mutable state.
- Validate Whop-tag IDs before sending them upstream.
- Return generic public errors while keeping secrets out of logs and responses.

## Interface Contract

### `GET /auth/whop/check-course`

- `204`: signed-in user has active Titans Exclusive access.
- `302`: no valid session; redirect to Whop login with `next=/course/`.
- `302`: valid session without Exclusive; redirect to the course access-required
  page.
- `503`: Whop access verification is unavailable; fail closed.

The OAuth `next` allowlist adds `/exclusive/course/`. No arbitrary redirect target is
accepted.

Every `/course-api/*` handler independently verifies the signed session and
current Titans Exclusive entitlement. The static-page gate is not treated as
API authorization.

## Testing Strategy

- Unit-test redirect normalization for `/course/` and rejection of external
  redirect values.
- Integration-test signed-out, tampered-session, Weekly-only, AI-only,
  Exclusive, and upstream-failure cases using a fake Whop boundary.
- Verify API endpoints return JSON `401`, `403`, or `503` rather than HTML or
  redirects.
- Run the existing authentication suite unchanged to prevent Prompt Builder
  regressions.

## Boundaries

- Always: re-check Titans Exclusive with Whop on protected requests; fail
  closed; use secure HTTP-only cookies; rate-limit login and API mutations.
- Ask first: changing cookie lifetime, adding another eligible product, or
  persisting OAuth credentials.
- Never: accept an email address as proof of identity, expose the Whop API key,
  restore legacy guest links, or trust a client-supplied Whop user ID.

## Success Criteria

- An active Titans Exclusive member can open `/exclusive/course/` using the existing Whop
  sign-in.
- Weekly-only, AI-only, signed-out, expired, and tampered sessions cannot read
  the page or API.
- Prompt Builder access behavior remains unchanged.

## Open Questions

- None.
