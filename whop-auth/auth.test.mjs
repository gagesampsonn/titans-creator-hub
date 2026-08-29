import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  createAuthServer,
  isMainModule,
  normalizeNextPath,
} from "./server.mjs";

const AI_PRODUCT_ID = "prod_ai";
const EXCLUSIVE_PRODUCT_ID = "prod_exclusive";

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
    redirectUri: "https://titansagency.co/auth/whop/callback",
    sessionMaxAgeSeconds: 7 * 24 * 60 * 60,
  };
}

async function startServer(fetchFn) {
  const server = createAuthServer(makeConfig(), { fetchFn });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  openServers.add(server);
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function beginLogin(origin, next = "/prompt/") {
  const response = await fetch(
    `${origin}/auth/whop/login?next=${encodeURIComponent(next)}`,
    { redirect: "manual" },
  );
  const location = new URL(response.headers.get("location"));
  return {
    response,
    location,
    transactionCookie: response.headers.get("set-cookie").split(";", 1)[0],
  };
}

function whopFetchWithAccess(allowedProducts = []) {
  return async (url, options = {}) => {
    const target = String(url);
    if (target === "https://api.whop.com/oauth/token") {
      assert.equal(options.method, "POST");
      assert.match(String(options.body), /code_verifier=/);
      return Response.json({
        access_token: "oauth_access",
        refresh_token: "oauth_refresh",
        token_type: "Bearer",
      });
    }
    if (target === "https://api.whop.com/oauth/userinfo") {
      assert.equal(options.headers.Authorization, "Bearer oauth_access");
      return Response.json({ sub: "user_test", name: "Test User" });
    }
    if (target === "https://api.whop.com/oauth/revoke") {
      assert.equal(options.method, "POST");
      return new Response(null, { status: 200 });
    }
    const match = target.match(/\/api\/v1\/users\/user_test\/access\/(prod_[^/?]+)/);
    if (match) {
      assert.equal(options.headers.Authorization, "Bearer test_api_key");
      return Response.json({ has_access: allowedProducts.includes(match[1]) });
    }
    throw new Error(`Unexpected Whop request: ${target}`);
  };
}

describe("redirect safety", () => {
  it("allows only known first-party destinations", () => {
    assert.equal(normalizeNextPath("/prompt/"), "/prompt/");
    assert.equal(normalizeNextPath("/generator/"), "/generator/");
    assert.equal(normalizeNextPath("https://evil.example/"), "/prompt/");
    assert.equal(normalizeNextPath("//evil.example/"), "/prompt/");
    assert.equal(normalizeNextPath("/account"), "/prompt/");
  });
});

describe("production entrypoint", () => {
  it("recognizes the executable when systemd starts it through a release symlink", () => {
    assert.equal(
      isMainModule(
        "file:///C:/opt/titans-whop-auth/releases/123/server.mjs",
        "C:\\opt\\titans-whop-auth\\current\\server.mjs",
        () => "/opt/titans-whop-auth/releases/123/server.mjs",
      ),
      true,
    );
  });
});

describe("Whop OAuth login", () => {
  it("starts OAuth with PKCE and a secure, HTTP-only transaction cookie", async () => {
    const { origin } = await startServer(whopFetchWithAccess());
    const { response, location } = await beginLogin(origin);

    assert.equal(response.status, 302);
    assert.equal(location.origin, "https://api.whop.com");
    assert.equal(location.pathname, "/oauth/authorize");
    assert.equal(location.searchParams.get("client_id"), "app_test");
    assert.equal(location.searchParams.get("response_type"), "code");
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    assert.ok(location.searchParams.get("code_challenge"));
    assert.ok(location.searchParams.get("state"));
    assert.ok(location.searchParams.get("nonce"));
    assert.equal(location.searchParams.get("scope"), "openid profile");
    assert.match(
      response.headers.get("set-cookie"),
      /titans_whop_oauth=.*HttpOnly.*Secure.*SameSite=Lax/i,
    );
  });

  it("rejects a callback with the wrong OAuth state", async () => {
    const { origin } = await startServer(whopFetchWithAccess());
    const { transactionCookie } = await beginLogin(origin);
    const response = await fetch(
      `${origin}/auth/whop/callback?code=test_code&state=wrong_state`,
      { headers: { Cookie: transactionCookie }, redirect: "manual" },
    );

    assert.equal(response.status, 400);
    assert.match(await response.text(), /could not verify/i);
    assert.doesNotMatch(response.headers.get("set-cookie") ?? "", /titans_whop_session=/);
  });

  it("creates a signed Titans session after Whop authenticates the user", async () => {
    const { origin } = await startServer(whopFetchWithAccess());
    const { location, transactionCookie } = await beginLogin(origin);
    const state = location.searchParams.get("state");
    const response = await fetch(
      `${origin}/auth/whop/callback?code=test_code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: transactionCookie }, redirect: "manual" },
    );

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/prompt/");
    assert.match(
      response.headers.get("set-cookie"),
      /titans_whop_session=.*HttpOnly.*Secure.*SameSite=Lax/i,
    );
  });
});

describe("AI Prompt Builder access", () => {
  async function authenticatedSession(origin) {
    const { location, transactionCookie } = await beginLogin(origin);
    const state = location.searchParams.get("state");
    const callback = await fetch(
      `${origin}/auth/whop/callback?code=test_code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: transactionCookie }, redirect: "manual" },
    );
    return callback.headers
      .get("set-cookie")
      .split(/,(?=\s*titans_)/)
      .find((value) => value.trim().startsWith("titans_whop_session="))
      .split(";", 1)[0];
  }

  it("redirects signed-out visitors to Whop login", async () => {
    const { origin } = await startServer(whopFetchWithAccess());
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: { "X-Forwarded-Uri": "/prompt/" },
      redirect: "manual",
    });

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/auth/whop/login?next=%2Fprompt%2F",
    );
  });

  it("rejects a tampered Titans session", async () => {
    const { origin } = await startServer(whopFetchWithAccess([AI_PRODUCT_ID]));
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: {
        Cookie: `${sessionCookie}tampered`,
        "X-Forwarded-Uri": "/prompt/",
      },
      redirect: "manual",
    });

    assert.equal(response.status, 302);
    assert.match(response.headers.get("location"), /^\/auth\/whop\/login/);
  });

  it("allows active standalone AI customers", async () => {
    const { origin } = await startServer(whopFetchWithAccess([AI_PRODUCT_ID]));
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: { Cookie: sessionCookie, "X-Forwarded-Uri": "/prompt/" },
      redirect: "manual",
    });

    assert.equal(response.status, 204);
  });

  it("allows active Titans Exclusive members", async () => {
    const { origin } = await startServer(
      whopFetchWithAccess([EXCLUSIVE_PRODUCT_ID]),
    );
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: { Cookie: sessionCookie, "X-Forwarded-Uri": "/generator/" },
      redirect: "manual",
    });

    assert.equal(response.status, 204);
  });

  it("does not unlock AI for members without AI or Exclusive access", async () => {
    const { origin } = await startServer(whopFetchWithAccess());
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: { Cookie: sessionCookie, "X-Forwarded-Uri": "/prompt/" },
      redirect: "manual",
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/auth/whop/access-required");
  });

  it("fails closed when Whop access cannot be verified", async () => {
    const workingFetch = whopFetchWithAccess();
    const fetchFn = async (url, options) => {
      if (String(url).includes("/access/")) {
        return Response.json({ error: "temporary" }, { status: 503 });
      }
      return workingFetch(url, options);
    };
    const { origin } = await startServer(fetchFn);
    const sessionCookie = await authenticatedSession(origin);
    const response = await fetch(`${origin}/auth/whop/check-ai`, {
      headers: { Cookie: sessionCookie, "X-Forwarded-Uri": "/prompt/" },
      redirect: "manual",
    });

    assert.equal(response.status, 503);
    assert.match(await response.text(), /temporarily unable to verify access/i);
  });
});
