import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { createAuthServer } from "./server.mjs";

const AI_PRODUCT_ID = "prod_ai";
const EXCLUSIVE_PRODUCT_ID = "prod_exclusive";
const COMPANY_ID = "biz_titans";
const COURSE_ID = "cors_course";
const RESOURCE_COURSE_ID = "cors_resources";
const MUX_LESSON_ID = "lesn_mux";
const PDF_LESSON_ID = "lesn_pdf";
const OUTSIDE_LESSON_ID = "lesn_outside";

const openServers = new Set();

afterEach(async () => {
  await Promise.all(
    [...openServers].map(
      (server) =>
        new Promise((resolve) => server.close(() => resolve())),
    ),
  );
  openServers.clear();
});

function makeConfig() {
  return {
    baseUrl: "https://titansagency.co",
    port: 0,
    whopApiKey: "test_api_key",
    whopAppId: "app_test",
    whopSessionSecret: "s".repeat(64),
    aiProductId: AI_PRODUCT_ID,
    exclusiveProductId: EXCLUSIVE_PRODUCT_ID,
    courseIds: [COURSE_ID, RESOURCE_COURSE_ID],
    redirectUri: "https://titansagency.co/auth/whop/callback",
    sessionMaxAgeSeconds: 7 * 24 * 60 * 60,
  };
}

function courseFixture() {
  return {
    id: COURSE_ID,
    title: "Full Course",
    tagline: "Build your TikTok Shop business",
    visibility: "visible",
    order: "1",
    chapters: [
      {
        id: "chap_start",
        title: "Getting started",
        order: 1,
        lessons: [
          {
            id: MUX_LESSON_ID,
            title: "Welcome to Titans",
            lesson_type: "multi",
            order: 1,
            video_asset: { duration_seconds: 125 },
          },
          {
            id: "lesn_hidden",
            title: "Draft lesson",
            lesson_type: "text",
            order: 2,
          },
        ],
      },
    ],
  };
}

function resourcesFixture() {
  return {
    id: RESOURCE_COURSE_ID,
    title: "Titans Resources",
    tagline: null,
    visibility: "visible",
    order: "2",
    chapters: [
      {
        id: "chap_resources",
        title: "Resources",
        order: 1,
        lessons: [
          {
            id: PDF_LESSON_ID,
            title: "Creator checklist",
            lesson_type: "pdf",
            order: 1,
          },
        ],
      },
    ],
  };
}

function jsonResponse(value, status = 200) {
  return Response.json(value, { status });
}

function createWhopFetch({ allowedProducts = [EXCLUSIVE_PRODUCT_ID] } = {}) {
  const calls = [];
  const fetchFn = async (url, options = {}) => {
    const target = new URL(String(url));
    calls.push({ target, options });

    if (target.href === "https://api.whop.com/oauth/token") {
      return jsonResponse({
        access_token: "oauth_access",
        refresh_token: "oauth_refresh",
        token_type: "Bearer",
      });
    }
    if (target.href === "https://api.whop.com/oauth/userinfo") {
      return jsonResponse({ sub: "user_test", name: "Test User" });
    }
    if (target.href === "https://api.whop.com/oauth/revoke") {
      return new Response(null, { status: 200 });
    }

    const accessMatch = target.pathname.match(
      /^\/api\/v1\/users\/user_test\/access\/(prod_[A-Za-z0-9_]+)$/,
    );
    if (accessMatch) {
      return jsonResponse({
        has_access: allowedProducts.includes(accessMatch[1]),
      });
    }

    if (target.pathname === `/api/v1/products/${EXCLUSIVE_PRODUCT_ID}`) {
      return jsonResponse({
        id: EXCLUSIVE_PRODUCT_ID,
        account: { id: COMPANY_ID, title: "Titans" },
      });
    }

    if (target.pathname === `/api/v1/courses/${COURSE_ID}`) {
      return jsonResponse(courseFixture());
    }
    if (target.pathname === `/api/v1/courses/${RESOURCE_COURSE_ID}`) {
      return jsonResponse(resourcesFixture());
    }

    if (
      target.pathname === "/api/v1/course_lessons" &&
      target.searchParams.get("course_id") === COURSE_ID
    ) {
      return jsonResponse({
        data: [
          {
            id: MUX_LESSON_ID,
            title: "Welcome to Titans",
            order: 1,
            lesson_type: "multi",
            visibility: "visible",
          },
          {
            id: "lesn_hidden",
            title: "Draft lesson",
            order: 2,
            lesson_type: "text",
            visibility: "hidden",
          },
        ],
        page_info: { has_next_page: false },
      });
    }
    if (
      target.pathname === "/api/v1/course_lessons" &&
      target.searchParams.get("course_id") === RESOURCE_COURSE_ID
    ) {
      return jsonResponse({
        data: [
          {
            id: PDF_LESSON_ID,
            title: "Creator checklist",
            order: 1,
            lesson_type: "pdf",
            visibility: "visible",
          },
        ],
        page_info: { has_next_page: false },
      });
    }

    if (target.pathname === `/api/v1/course_lessons/${MUX_LESSON_ID}`) {
      return jsonResponse({
        id: MUX_LESSON_ID,
        title: "Welcome to Titans",
        order: 1,
        lesson_type: "multi",
        visibility: "visible",
        content: "Start here.",
        video_asset: {
          signed_playback_id: "signed-playback-id",
          signed_video_playback_token: "video-token",
          signed_thumbnail_playback_token: "thumbnail-token",
          signed_storyboard_playback_token: "storyboard-token",
          duration_seconds: 125,
        },
        attachments: [],
      });
    }
    if (target.pathname === `/api/v1/course_lessons/${PDF_LESSON_ID}`) {
      return jsonResponse({
        id: PDF_LESSON_ID,
        title: "Creator checklist",
        order: 1,
        lesson_type: "pdf",
        visibility: "visible",
        content: null,
        main_pdf: {
          id: "file_checklist",
          filename: "creator-checklist.pdf",
          url: "https://media.whop.com/checklist.pdf",
        },
        attachments: [],
      });
    }
    if (target.pathname === `/api/v1/course_lessons/${OUTSIDE_LESSON_ID}`) {
      throw new Error("Outside lessons must never be requested from Whop");
    }

    if (target.pathname === "/api/v1/access_tokens") {
      const body = JSON.parse(options.body);
      assert.equal(body.company_id, COMPANY_ID);
      assert.equal(body.user_id, "user_test");
      return jsonResponse({
        token: "member_access_token",
        expires_at: "2099-01-01T00:00:00.000Z",
      });
    }

    if (target.pathname === "/api/v1/course_lesson_interactions") {
      assert.equal(options.headers.Authorization, "Bearer test_api_key");
      assert.equal(target.searchParams.get("user_id"), "user_test");
      const courseId = target.searchParams.get("course_id");
      assert.ok([COURSE_ID, RESOURCE_COURSE_ID].includes(courseId));
      return jsonResponse({
        data: courseId === COURSE_ID ? [
          {
            id: "crsli_complete",
            completed: true,
            lesson: { id: MUX_LESSON_ID, title: "Welcome to Titans" },
            course: { id: COURSE_ID, title: "Full Course" },
            user: { id: "user_test" },
          },
        ] : [],
        page_info: { has_next_page: false },
      });
    }

    if (
      target.pathname ===
      `/api/v1/course_lessons/${PDF_LESSON_ID}/start`
    ) {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer member_access_token");
      return jsonResponse(true);
    }
    if (
      target.pathname ===
      `/api/v1/course_lessons/${PDF_LESSON_ID}/mark_as_completed`
    ) {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer member_access_token");
      return jsonResponse(true);
    }

    throw new Error(`Unexpected Whop request: ${target.href}`);
  };
  return { calls, fetchFn };
}

async function startServer(whopFetch) {
  const server = createAuthServer(makeConfig(), { fetchFn: whopFetch.fetchFn });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  openServers.add(server);
  const { port } = server.address();
  return { origin: `http://127.0.0.1:${port}`, whopFetch };
}

async function authenticatedSession(origin) {
  const login = await fetch(
    `${origin}/auth/whop/login?next=${encodeURIComponent("/exclusive/course/")}`,
    { redirect: "manual" },
  );
  const authorize = new URL(login.headers.get("location"));
  const transactionCookie = login.headers.get("set-cookie").split(";", 1)[0];
  const callback = await fetch(
    `${origin}/auth/whop/callback?code=test_code&state=${encodeURIComponent(authorize.searchParams.get("state"))}`,
    { headers: { Cookie: transactionCookie }, redirect: "manual" },
  );
  return callback.headers
    .get("set-cookie")
    .split(/,(?=\s*titans_)/)
    .find((value) => value.trim().startsWith("titans_whop_session="))
    .split(";", 1)[0];
}

describe("course API authorization", () => {
  it("returns JSON 401 for signed-out catalog requests", async () => {
    const { origin } = await startServer(createWhopFetch());
    const response = await fetch(`${origin}/course-api/catalog`);

    assert.equal(response.status, 401);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.deepEqual(await response.json(), {
      error: { code: "authentication_required", message: "Sign in with Whop to continue." },
    });
  });

  it("returns JSON 403 for AI-only customers", async () => {
    const { origin } = await startServer(
      createWhopFetch({ allowedProducts: [AI_PRODUCT_ID] }),
    );
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/course-api/catalog`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "exclusive_access_required");
  });
});

describe("course catalog", () => {
  it("returns only visible allowlisted lessons and member completion", async () => {
    const whopFetch = createWhopFetch();
    const { origin } = await startServer(whopFetch);
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/course-api/catalog`, {
      headers: { Cookie: sessionCookie },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(payload.data.courses.length, 2);
    assert.equal(payload.data.courses[0].chapters[0].lessons.length, 1);
    assert.deepEqual(payload.data.courses[0].chapters[0].lessons[0], {
      id: MUX_LESSON_ID,
      title: "Welcome to Titans",
      type: "multi",
      order: 1,
      durationSeconds: 125,
      completed: true,
    });
    assert.equal(payload.data.completedLessons, 1);
    assert.equal(payload.data.totalLessons, 2);
    assert.deepEqual(
      whopFetch.calls
        .filter(({ target }) => target.pathname === "/api/v1/course_lesson_interactions")
        .map(({ target }) => target.searchParams.get("course_id"))
        .sort(),
      [COURSE_ID, RESOURCE_COURSE_ID].sort(),
    );
    assert.match(payload.data.csrfToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.doesNotMatch(JSON.stringify(payload), /video-token|signed-playback-id/);
  });

  it("returns normalized signed Mux playback data for an allowed lesson", async () => {
    const { origin } = await startServer(createWhopFetch());
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(
      `${origin}/course-api/lessons/${MUX_LESSON_ID}`,
      { headers: { Cookie: sessionCookie } },
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.id, MUX_LESSON_ID);
    assert.deepEqual(payload.data.media, {
      kind: "mux",
      playbackId: "signed-playback-id",
      playbackToken: "video-token",
      thumbnailToken: "thumbnail-token",
      storyboardToken: "storyboard-token",
    });
    assert.equal(payload.data.content, "Start here.");
  });

  it("returns normalized PDF data for a resource lesson", async () => {
    const { origin } = await startServer(createWhopFetch());
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(
      `${origin}/course-api/lessons/${PDF_LESSON_ID}`,
      { headers: { Cookie: sessionCookie } },
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload.data.media, {
      kind: "pdf",
      filename: "creator-checklist.pdf",
      url: "https://media.whop.com/checklist.pdf",
    });
  });

  it("does not request a valid-looking lesson outside the allowlist", async () => {
    const whopFetch = createWhopFetch();
    const { origin } = await startServer(whopFetch);
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(
      `${origin}/course-api/lessons/${OUTSIDE_LESSON_ID}`,
      { headers: { Cookie: sessionCookie } },
    );

    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, "lesson_not_found");
    assert.equal(
      whopFetch.calls.some(
        ({ target }) =>
          target.pathname === `/api/v1/course_lessons/${OUTSIDE_LESSON_ID}`,
      ),
      false,
    );
  });
});

describe("course progress", () => {
  it("requires same-origin JSON and a valid CSRF token", async () => {
    const { origin } = await startServer(createWhopFetch());
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(
      `${origin}/course-api/lessons/${PDF_LESSON_ID}/complete`,
      {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/json",
          Origin: "https://evil.example",
        },
        body: "{}",
      },
    );

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "invalid_request_origin");
  });

  it("starts and completes an allowlisted lesson as the session user", async () => {
    const { origin } = await startServer(createWhopFetch());
    const sessionCookie = await authenticatedSession(origin);
    const catalog = await fetch(`${origin}/course-api/catalog`, {
      headers: { Cookie: sessionCookie },
    }).then((response) => response.json());
    const headers = {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
      Origin: "https://titansagency.co",
      "X-CSRF-Token": catalog.data.csrfToken,
    };

    const started = await fetch(
      `${origin}/course-api/lessons/${PDF_LESSON_ID}/start`,
      { method: "POST", headers, body: "{}" },
    );
    assert.equal(started.status, 200);
    assert.deepEqual(await started.json(), { data: { started: true } });

    const completed = await fetch(
      `${origin}/course-api/lessons/${PDF_LESSON_ID}/complete`,
      { method: "POST", headers, body: "{}" },
    );
    assert.equal(completed.status, 200);
    assert.deepEqual(await completed.json(), {
      data: { lessonId: PDF_LESSON_ID, completed: true },
    });
  });
});
