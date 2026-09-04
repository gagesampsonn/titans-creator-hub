# Titans Whop authentication gateway

This small, dependency-free Node service connects the Titans site to Whop OAuth
and protects the AI Prompt Builder and Titans Exclusive course library with
live Whop product access checks.

## Access contract

- `GET /auth/whop/login` starts Whop OAuth 2.1 authorization with PKCE.
- `GET /auth/whop/callback` exchanges the authorization code server-side,
  retrieves the Whop user ID, revokes the transient refresh token, and creates
  a signed, HTTP-only Titans session.
- `GET /auth/whop/check-ai` is the Caddy `forward_auth` endpoint. It returns
  `204` only when the signed-in user has active access to the standalone AI
  Content product or Titans Exclusive.
- `GET /auth/whop/access-required` explains the eligible products. Titans
  Weekly alone does not unlock the tool.
- `GET /auth/whop/check-course` protects `/exclusive/course/` for active
  Titans Exclusive members.
- `GET /course-api/catalog` and `GET /course-api/lessons/{id}` return the
  allowlisted Whop course content and the signed-in member's progress.
- `POST /course-api/lessons/{id}/start` and `/complete` record progress in
  Whop. They require the catalog's signed CSRF token.
- `POST /auth/whop/logout` clears the Titans session.
- `GET /auth/whop/healthz` is the deployment health check.

The Whop API key and OAuth configuration must remain server-side. Required
environment variable names are:

```text
WHOP_API_KEY
WHOP_APP_ID
WHOP_SESSION_SECRET
WHOP_AI_PRODUCT_ID
WHOP_EXCLUSIVE_PRODUCT_ID
WHOP_COURSE_IDS
WHOP_REDIRECT_URI
```

Optional variables are `PORT`, `TITANS_BASE_URL`, and
`WHOP_SESSION_MAX_AGE_SECONDS`.

Run the tests with:

```bash
node --test whop-auth/auth.test.mjs whop-auth/course.test.mjs
```

The production Caddy routes are documented in `Caddyfile.routes`, and the
systemd unit is in `titans-whop-auth.service`. The service binds only to
`127.0.0.1`; Caddy is the public edge.
