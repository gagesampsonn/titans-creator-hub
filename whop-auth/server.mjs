import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { realpathSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";

import { CourseProviderError, createCourseService } from "./course.mjs";
import { createMemberService } from "./member.mjs";
import { createUpgradeService, UpgradeUnavailable } from "./upgrade.mjs";

const WHOP_AUTHORIZE_URL = "https://api.whop.com/oauth/authorize";
const WHOP_TOKEN_URL = "https://api.whop.com/oauth/token";
const WHOP_USERINFO_URL = "https://api.whop.com/oauth/userinfo";
const WHOP_REVOKE_URL = "https://api.whop.com/oauth/revoke";
const WHOP_API_URL = "https://api.whop.com/api/v1";

const OAUTH_COOKIE = "titans_whop_oauth";
const SESSION_COOKIE = "titans_whop_session";
const OAUTH_MAX_AGE_SECONDS = 10 * 60;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const ALLOWED_NEXT_PATHS = new Set([
  "/members",
  "/members/",
  "/members/upgrade/",
  "/prompt",
  "/prompt/",
  "/generator",
  "/generator/",
  "/exclusive/course",
  "/exclusive/course/",
]);
const rateLimits = new Map();

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signValue(value, secret) {
  const payload = base64UrlJson(value);
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyValue(value, secret) {
  if (!value || typeof value !== "string") return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = value.slice(0, separator);
  const received = Buffer.from(value.slice(separator + 1), "base64url");
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object") return null;
    return decoded;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1
          ? [part, ""]
          : [part.slice(0, separator), part.slice(separator + 1)];
      }),
  );
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

// PKCE requires a plain SHA-256 digest, not an HMAC. Kept separate so the
// signing primitive above is never reused for protocol hashing.
async function sha256Base64Url(value) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("base64url");
}

export function normalizeNextPath(value) {
  if (typeof value !== "string") return "/members/";
  try {
    const decoded = decodeURIComponent(value);
    const path = decoded.split(/[?#]/, 1)[0];
    if (!ALLOWED_NEXT_PATHS.has(path)) return "/members/";
    return path === "/exclusive/course" || path === "/members" ? `${path}/` : path;
  } catch {
    return "/members/";
  }
}

function noStoreHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    ...extra,
  };
}

function send(res, status, body = "", headers = {}) {
  res.writeHead(status, noStoreHeaders(headers));
  res.end(body);
}

function redirect(res, location, cookies = []) {
  const headers = { Location: location };
  if (cookies.length) headers["Set-Cookie"] = cookies;
  send(res, 302, "", headers);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function page(title, heading, message, actions = "") {
  const nonce = randomToken(18);
  return {
    body: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(title)} | TikTok Titans</title>
  <style nonce="${nonce}">
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #050505; color: #f7f5f2; padding: 24px; }
    main { width: min(680px, 100%); border: 1px solid #292929; background: #0d0d0d; padding: clamp(28px, 7vw, 56px); }
    .brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; font-weight: 900; letter-spacing: .12em; text-decoration: none; }
    .mark { color: #f15d3d; }
    h1 { margin: 42px 0 18px; font-size: clamp(2.25rem, 8vw, 4.5rem); line-height: .92; letter-spacing: -.055em; text-transform: uppercase; }
    p { color: #b8b5b1; font-size: 1.05rem; line-height: 1.65; max-width: 54ch; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
    a.button, button { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #f15d3d; padding: 13px 20px; background: #f15d3d; color: #fff; font: inherit; font-weight: 800; text-decoration: none; cursor: pointer; }
    a.secondary, button.secondary { border-color: #3b3b3b; background: transparent; }
    form { margin: 0; }
    .help { margin-top: 32px; font-size: .9rem; color: #777; }
    .help a { color: #ddd; }
    @media (max-width: 520px) { .actions, .actions a, .actions form, .actions button { width: 100%; } }
  </style>
</head>
<body>
  <main>
    <a class="brand" href="/"><span class="mark">◆</span> TITANS</a>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
    <div class="actions">${actions}</div>
    <p class="help">Need help? <a href="mailto:Tiktoktitansmanagement@gmail.com">Contact Titans support</a>.</p>
  </main>
</body>
</html>`,
    nonce,
  };
}

function sendPage(res, status, title, heading, message, actions = "") {
  const rendered = page(title, heading, message, actions);
  send(res, status, rendered.body, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${rendered.nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
  });
}

function isRateLimited(req, bucket, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  // The service binds only to loopback and is reached through Caddy, so the
  // first forwarded address is the actual visitor rather than an untrusted
  // public header supplied directly to this process.
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string" && forwarded.length <= 256
      ? forwarded.split(",", 1)[0].trim()
      : (req.socket.remoteAddress ?? "unknown");
  const key = `${bucket}:${ip}`;
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  if (rateLimits.size > 5_000) {
    for (const [entryKey, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryKey);
    }
  }
  return current.count > limit;
}

async function requestWhop(fetchFn, url, options = {}) {
  const response = await fetchFn(url, {
    ...options,
    signal: AbortSignal.timeout(8_000),
  });
  return response;
}

async function exchangeCode(config, fetchFn, code, verifier) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.whopAppId,
    code_verifier: verifier,
  });
  const response = await requestWhop(fetchFn, WHOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("oauth_token_exchange_failed");
  const tokens = await response.json();
  if (!tokens?.access_token) throw new Error("oauth_access_token_missing");
  return tokens;
}

async function getWhopUser(fetchFn, accessToken) {
  const response = await requestWhop(fetchFn, WHOP_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("oauth_userinfo_failed");
  const user = await response.json();
  if (!/^user_[A-Za-z0-9]+$/.test(user?.sub ?? "")) {
    throw new Error("oauth_user_invalid");
  }
  return user;
}

async function revokeRefreshToken(config, fetchFn, refreshToken) {
  if (!refreshToken) return;
  const body = new URLSearchParams({
    token: refreshToken,
    token_type_hint: "refresh_token",
    client_id: config.whopAppId,
  });
  try {
    await requestWhop(fetchFn, WHOP_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // Authentication is already complete. The refresh token is never stored,
    // so a transient revocation outage cannot expose a persisted credential.
  }
}

async function checkProductAccess(config, fetchFn, userId, productId) {
  const response = await requestWhop(
    fetchFn,
    `${WHOP_API_URL}/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(productId)}`,
    { headers: { Authorization: `Bearer ${config.whopApiKey}` } },
  );
  if (!response.ok) throw new Error("whop_access_check_failed");
  const result = await response.json();
  return result?.has_access === true;
}

async function hasAiAccess(config, fetchFn, userId) {
  if (await checkProductAccess(config, fetchFn, userId, config.aiProductId)) {
    return true;
  }
  return checkProductAccess(config, fetchFn, userId, config.exclusiveProductId);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function sendCourseError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

async function hasExclusiveAccess(config, fetchFn, userId) {
  return checkProductAccess(config, fetchFn, userId, config.exclusiveProductId);
}

function getSession(req, config) {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifyValue(cookies[SESSION_COOKIE], config.whopSessionSecret);
  if (
    !session ||
    !/^user_[A-Za-z0-9]+$/.test(session.sub ?? "") ||
    !Number.isInteger(session.exp) ||
    session.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return session;
}

async function handleLogin(req, res, url, config) {
  if (isRateLimited(req, "login")) {
    sendPage(res, 429, "Please wait", "Too many attempts", "Please wait a minute, then try signing in again.");
    return;
  }
  if (getSession(req, config)) {
    redirect(res, normalizeNextPath(url.searchParams.get("next")));
    return;
  }
  const verifier = randomToken(48);
  const state = randomToken(32);
  const nonce = randomToken(32);
  const next = normalizeNextPath(url.searchParams.get("next"));
  const transaction = signValue(
    {
      verifier,
      state,
      nonce,
      next,
      exp: Math.floor(Date.now() / 1000) + OAUTH_MAX_AGE_SECONDS,
    },
    config.whopSessionSecret,
  );
  const authorize = new URL(WHOP_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", config.whopAppId);
  authorize.searchParams.set("redirect_uri", config.redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("code_challenge", await sha256Base64Url(verifier));
  authorize.searchParams.set("code_challenge_method", "S256");
  redirect(res, authorize.toString(), [cookie(OAUTH_COOKIE, transaction, OAUTH_MAX_AGE_SECONDS)]);
}

async function handleCallback(req, res, url, config, fetchFn) {
  if (isRateLimited(req, "callback", 60)) {
    sendPage(res, 429, "Please wait", "Too many attempts", "Please wait a minute, then try signing in again.");
    return;
  }
  const cookies = parseCookies(req.headers.cookie);
  const transaction = verifyValue(cookies[OAUTH_COOKIE], config.whopSessionSecret);
  const now = Math.floor(Date.now() / 1000);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (
    url.searchParams.has("error") ||
    !transaction ||
    !Number.isInteger(transaction.exp) ||
    transaction.exp <= now ||
    !code ||
    !state ||
    state !== transaction.state ||
    typeof transaction.verifier !== "string"
  ) {
    sendPage(
      res,
      400,
      "Sign-in failed",
      "We could not verify this sign-in",
      "Return to Titans and try signing in with Whop again.",
      '<a class="button" href="/auth/whop/login">Try again</a>',
    );
    return;
  }

  try {
    const tokens = await exchangeCode(config, fetchFn, code, transaction.verifier);
    const user = await getWhopUser(fetchFn, tokens.access_token);
    await revokeRefreshToken(config, fetchFn, tokens.refresh_token);
    const session = signValue(
      { sub: user.sub, iat: now, exp: now + config.sessionMaxAgeSeconds },
      config.whopSessionSecret,
    );
    redirect(res, normalizeNextPath(transaction.next), [
      clearCookie(OAUTH_COOKIE),
      cookie(SESSION_COOKIE, session, config.sessionMaxAgeSeconds),
    ]);
  } catch {
    sendPage(
      res,
      502,
      "Sign-in unavailable",
      "Whop sign-in did not complete",
      "No payment or password information was sent to Titans. Please try again in a moment.",
      '<a class="button" href="/auth/whop/login">Try again</a>',
    );
  }
}

async function handleAccessCheck(req, res, config, fetchFn) {
  const requestedPath = normalizeNextPath(req.headers["x-forwarded-uri"]);
  const session = getSession(req, config);
  if (!session) {
    redirect(
      res,
      `/auth/whop/login?next=${encodeURIComponent(requestedPath)}`,
      [clearCookie(SESSION_COOKIE)],
    );
    return;
  }
  try {
    if (await hasAiAccess(config, fetchFn, session.sub)) {
      send(res, 204);
      return;
    }
    redirect(res, "/auth/whop/access-required");
  } catch {
    sendPage(
      res,
      503,
      "Access check unavailable",
      "We are temporarily unable to verify access",
      "Your membership was not changed. Please try opening the Prompt Builder again in a moment.",
      '<a class="button" href="/prompt/">Try again</a>',
    );
  }
}

function courseCsrfToken(config, userId) {
  return signValue(
    {
      sub: userId,
      purpose: "course_progress",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    config.whopSessionSecret,
  );
}

function validCourseCsrf(req, config, userId) {
  const value = req.headers["x-csrf-token"];
  const token = verifyValue(typeof value === "string" ? value : "", config.whopSessionSecret);
  return (
    token?.sub === userId &&
    token?.purpose === "course_progress" &&
    Number.isInteger(token.exp) &&
    token.exp > Math.floor(Date.now() / 1000)
  );
}

async function authorizeCourseApi(req, res, config, fetchFn) {
  const session = getSession(req, config);
  if (!session) {
    sendCourseError(res, 401, "authentication_required", "Sign in with Whop to continue.");
    return null;
  }
  if (!(await hasExclusiveAccess(config, fetchFn, session.sub))) {
    sendCourseError(res, 403, "exclusive_access_required", "An active Titans Exclusive membership is required.");
    return null;
  }
  return session;
}

function courseProviderFailure(res, error) {
  if (error instanceof CourseProviderError) {
    sendCourseError(
      res,
      error.status,
      error.code,
      error.status === 503
        ? "The course provider is temporarily unavailable."
        : "The course provider returned an invalid response.",
    );
    return;
  }
  throw error;
}

async function handleCourseAccessCheck(req, res, config, fetchFn) {
  const requestedPath = "/exclusive/course/";
  const session = getSession(req, config);
  if (!session) {
    redirect(
      res,
      `/auth/whop/login?next=${encodeURIComponent(requestedPath)}`,
      [clearCookie(SESSION_COOKIE)],
    );
    return;
  }
  try {
    if (await hasExclusiveAccess(config, fetchFn, session.sub)) {
      send(res, 204);
      return;
    }
    redirect(res, "/auth/whop/course-access-required");
  } catch {
    sendPage(
      res,
      503,
      "Access check unavailable",
      "We are temporarily unable to verify course access",
      "Your membership was not changed. Please try opening the course again in a moment.",
      '<a class="button" href="/exclusive/course/">Try again</a>',
    );
  }
}

function loadConfig(env = process.env) {
  const config = {
    baseUrl: env.TITANS_BASE_URL ?? "https://titansagency.co",
    port: Number(env.PORT ?? 8091),
    whopApiKey: env.WHOP_API_KEY,
    whopAppId: env.WHOP_APP_ID,
    whopSessionSecret: env.WHOP_SESSION_SECRET,
    aiProductId: env.WHOP_AI_PRODUCT_ID,
    exclusiveProductId: env.WHOP_EXCLUSIVE_PRODUCT_ID,
    weeklyProductId: env.WHOP_WEEKLY_PRODUCT_ID ?? "prod_jTg64CQQGpke0",
    memberStateDir: env.WHOP_MEMBER_STATE_DIR ?? "/var/lib/titans-whop-auth",
    upgradeEnabled: env.WHOP_UPGRADE_ENABLED === "true",
    whopCompanyId: env.WHOP_COMPANY_ID ?? "biz_kcMjlv7meKmJl7",
    exclusivePlanId: env.WHOP_EXCLUSIVE_PLAN_ID ?? "plan_i0exA8Z5f3XOZ",
    redirectUri:
      env.WHOP_REDIRECT_URI ??
      "https://titansagency.co/auth/whop/callback",
    sessionMaxAgeSeconds: Number(
      env.WHOP_SESSION_MAX_AGE_SECONDS ?? DEFAULT_SESSION_MAX_AGE_SECONDS,
    ),
    courseIds: (env.WHOP_COURSE_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
  const required = [
    "whopApiKey",
    "whopAppId",
    "whopSessionSecret",
    "aiProductId",
    "exclusiveProductId",
    "courseIds",
  ];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required Whop auth configuration: ${missing.join(", ")}`);
  }
  if (config.whopSessionSecret.length < 32) {
    throw new Error("WHOP_SESSION_SECRET must contain at least 32 characters");
  }
  if (
    config.courseIds.length === 0 ||
    config.courseIds.some((id) => !/^cors_[A-Za-z0-9_]+$/.test(id))
  ) {
    throw new Error("WHOP_COURSE_IDS must contain valid comma-separated course IDs");
  }
  return config;
}

export function createAuthServer(config, { fetchFn = fetch } = {}) {
  const courseService = createCourseService(config, { fetchFn });
  const memberService = createMemberService(config, {
    checkAccess: (userId, productId) => checkProductAccess(config, fetchFn, userId, productId),
  });
  const upgradeService = createUpgradeService(config, memberService, { fetchFn });
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", config.baseUrl);
    try {
      if (req.method === "GET" && url.pathname === "/auth/whop/healthz") {
        send(res, 200, "ok\n", { "Content-Type": "text/plain; charset=utf-8" });
        return;
      }
      if (url.pathname === "/auth/whop/member" && ["GET", "POST"].includes(req.method)) {
        const session = getSession(req, config);
        if (!session) {
          sendJson(res, 401, { error: "authentication_required" });
          return;
        }
        if (req.method === "POST" && req.headers.origin !== config.baseUrl) {
          sendJson(res, 403, { error: "invalid_request_origin" });
          return;
        }
        if (isRateLimited(req, "member-library", 90)) {
          sendJson(res, 429, { error: "rate_limit_exceeded" });
          return;
        }
        try {
          const member = await memberService.getMember(session.sub, { start: req.method === "POST" });
          if (member.offer) member.upgradeCsrf = signValue({ sub: session.sub, purpose: "exclusive_upgrade", exp: Math.floor(member.offer.expiresAt / 1000) }, config.whopSessionSecret);
          sendJson(res, 200, { data: member });
        } catch {
          sendJson(res, 503, { error: "membership_check_unavailable" });
        }
        return;
      }
      if (url.pathname === "/auth/whop/upgrade" && req.method === "POST") {
        const session = getSession(req, config);
        if (!session) { sendJson(res, 401, { error: "authentication_required" }); return; }
        const token = verifyValue(req.headers["x-csrf-token"], config.whopSessionSecret);
        if (req.headers.origin !== config.baseUrl || token?.sub !== session.sub ||
            token?.purpose !== "exclusive_upgrade" || !Number.isInteger(token.exp) ||
            token.exp <= Math.floor(Date.now() / 1000)) {
          sendJson(res, 403, { error: "upgrade_request_invalid" }); return;
        }
        if (isRateLimited(req, "exclusive-upgrade", 10)) {
          sendJson(res, 429, { error: "rate_limit_exceeded" }); return;
        }
        try {
          sendJson(res, 200, { data: await upgradeService.createCheckout(session.sub) });
        } catch (error) {
          sendJson(res, error instanceof UpgradeUnavailable ? 403 : 503,
            { error: error instanceof UpgradeUnavailable ? "offer_expired_or_ineligible" : "upgrade_checkout_unavailable" });
        }
        return;
      }
      if (req.method === "GET" && url.pathname === "/auth/whop/login") {
        await handleLogin(req, res, url, config);
        return;
      }
      if (req.method === "GET" && url.pathname === "/auth/whop/callback") {
        await handleCallback(req, res, url, config, fetchFn);
        return;
      }
      if (req.method === "GET" && url.pathname === "/auth/whop/check-ai") {
        await handleAccessCheck(req, res, config, fetchFn);
        return;
      }
      if (req.method === "GET" && url.pathname === "/auth/whop/check-course") {
        await handleCourseAccessCheck(req, res, config, fetchFn);
        return;
      }
      if (req.method === "GET" && url.pathname === "/course-api/catalog") {
        const session = await authorizeCourseApi(req, res, config, fetchFn);
        if (!session) return;
        try {
          const catalog = await courseService.getCatalog(session.sub);
          sendJson(res, 200, {
            data: { ...catalog, csrfToken: courseCsrfToken(config, session.sub) },
          });
        } catch (error) {
          courseProviderFailure(res, error);
        }
        return;
      }
      const lessonMatch = url.pathname.match(
        /^\/course-api\/lessons\/(lesn_[A-Za-z0-9_]+)(?:\/(start|complete))?$/,
      );
      if (lessonMatch) {
        const session = await authorizeCourseApi(req, res, config, fetchFn);
        if (!session) return;
        const [, lessonId, action] = lessonMatch;
        try {
          if (!action && req.method === "GET") {
            const lesson = await courseService.getLesson(lessonId);
            if (!lesson) {
              sendCourseError(res, 404, "lesson_not_found", "Lesson not found.");
              return;
            }
            sendJson(res, 200, { data: lesson });
            return;
          }
          if (action && req.method === "POST") {
            if (isRateLimited(req, "course-progress", 90)) {
              sendCourseError(res, 429, "rate_limit_exceeded", "Please wait before trying again.");
              return;
            }
            if (req.headers.origin !== config.baseUrl) {
              sendCourseError(res, 403, "invalid_request_origin", "Request origin could not be verified.");
              return;
            }
            if (!(req.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
              sendCourseError(res, 415, "invalid_content_type", "JSON is required.");
              return;
            }
            if (!validCourseCsrf(req, config, session.sub)) {
              sendCourseError(res, 403, "invalid_csrf_token", "Refresh the course and try again.");
              return;
            }
            const updated = await courseService.updateProgress(session.sub, lessonId, action);
            if (!updated) {
              sendCourseError(res, 404, "lesson_not_found", "Lesson not found.");
              return;
            }
            sendJson(
              res,
              200,
              action === "start"
                ? { data: { started: true } }
                : { data: { lessonId, completed: true } },
            );
            return;
          }
          sendCourseError(res, 405, "method_not_allowed", "Method not allowed.");
        } catch (error) {
          courseProviderFailure(res, error);
        }
        return;
      }
      if (req.method === "GET" && url.pathname === "/auth/whop/access-required") {
        sendPage(
          res,
          403,
          "AI access required",
          "Prompt Builder access required",
          "The Prompt Builder is included with AI Content and Titans Exclusive. Titans Weekly does not include AI access.",
          '<a class="button" href="/ai/#checkout">Get AI Content</a><a class="button secondary" href="/exclusive/#checkout">View Exclusive</a><form method="post" action="/auth/whop/logout"><button class="secondary" type="submit">Sign out</button></form>',
        );
        return;
      }
      if (
        req.method === "GET" &&
        url.pathname === "/auth/whop/course-access-required"
      ) {
        sendPage(
          res,
          403,
          "Exclusive access required",
          "Titans Exclusive is required",
          "The Titans course library is available only to active Titans Exclusive members.",
          '<a class="button" href="/exclusive/#checkout">View Titans Exclusive</a><form method="post" action="/auth/whop/logout"><button class="secondary" type="submit">Sign out</button></form>',
        );
        return;
      }
      if (req.method === "POST" && url.pathname === "/auth/whop/logout") {
        redirect(res, "/", [clearCookie(SESSION_COOKIE), clearCookie(OAUTH_COOKIE)]);
        return;
      }
      sendPage(res, 404, "Not found", "Page not found", "Return to the Titans homepage.", '<a class="button" href="/">Go home</a>');
    } catch {
      sendPage(
        res,
        500,
        "Unexpected error",
        "Something went wrong",
        "Please return to Titans and try again.",
        '<a class="button" href="/">Go home</a>',
      );
    }
  });
}

export function isMainModule(
  importUrl,
  argvPath,
  resolveRealPath = realpathSync,
) {
  if (!argvPath) return false;
  try {
    return resolveRealPath(fileURLToPath(importUrl)) === resolveRealPath(argvPath);
  } catch {
    return false;
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const config = loadConfig();
  createAuthServer(config).listen(config.port, "127.0.0.1");
}
