import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createMemberService } from "./member.mjs";
import { createAuthServer } from "./server.mjs";

function fixture(t, owned = ["prod_ai"]) {
  const memberStateDir = mkdtempSync(join(tmpdir(), "titans-members-test-"));
  t.after(() => rmSync(memberStateDir, { recursive: true, force: true }));
  const config = { baseUrl: "https://titansagency.co", whopSessionSecret: "s".repeat(64),
    whopApiKey: "test_key", aiProductId: "prod_ai", exclusiveProductId: "prod_exclusive",
    weeklyProductId: "prod_weekly", memberStateDir, upgradeEnabled: true };
  let time = 1_800_000_000_000;
  const service = () => createMemberService(config, {
    checkAccess: async (_userId, productId) => owned.includes(productId), now: () => time,
  });
  return { config, service, advance: (ms) => { time += ms; } };
}

test("AI, Exclusive, Weekly, and unpurchased products have distinct capabilities", async (t) => {
  for (const [owned, expected] of [
    [[], { ai: false, aiPurchased: false, exclusive: false, weekly: false }],
    [["prod_ai"], { ai: true, aiPurchased: true, exclusive: false, weekly: false }],
    [["prod_exclusive"], { ai: true, aiPurchased: false, exclusive: true, weekly: false }],
    [["prod_weekly"], { ai: false, aiPurchased: false, exclusive: false, weekly: true }],
  ]) {
    const f = fixture(t, owned);
    assert.deepEqual((await f.service().getMember("user_a")).access, expected);
  }
});

test("offer starts at first eligible site visit and survives refresh, sessions, and restart", async (t) => {
  const f = fixture(t);
  assert.equal((await f.service().getMember("user_a")).offer, null);
  const first = await f.service().getMember("user_a", { start: true });
  assert.equal(first.offer.expiresAt - first.serverTime, 600_000);
  f.advance(599_999);
  assert.equal((await f.service().getMember("user_a", { start: true })).offer.expiresAt, first.offer.expiresAt);
  f.advance(1);
  assert.equal((await f.service().getMember("user_a", { start: true })).offer, null);
  assert.ok((await f.service().getMember("user_b", { start: true })).offer);
});

test("unowned AI and current Exclusive members never receive the upgrade offer", async (t) => {
  for (const owned of [[], ["prod_weekly"], ["prod_exclusive"], ["prod_ai", "prod_exclusive"]]) {
    const f = fixture(t, owned);
    assert.equal((await f.service().getMember("user_a", { start: true })).offer, null);
    assert.equal(f.service().readRecord("user_a"), null);
  }
});

test("library API verifies the session owner, origin, and current Whop access", async (t) => {
  const f = fixture(t);
  let fail = false;
  const server = createAuthServer(f.config, { fetchFn: async (url) => {
    assert.match(String(url), /\/users\/user_a\/access\/prod_/);
    if (fail) return new Response("private provider detail", { status: 500 });
    return Response.json({ has_access: String(url).endsWith("/prod_ai") });
  } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const payload = Buffer.from(JSON.stringify({ sub: "user_a", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const signature = createHmac("sha256", f.config.whopSessionSecret).update(payload).digest("base64url");
  const Cookie = `titans_whop_session=${payload}.${signature}`;
  assert.equal((await fetch(`${origin}/auth/whop/member`)).status, 401);
  assert.equal((await fetch(`${origin}/auth/whop/member`, { headers: { Cookie: Cookie + "invalid" } })).status, 401);
  assert.equal((await fetch(`${origin}/auth/whop/member`, { method: "POST", headers: { Cookie, Origin: "https://evil.example" } })).status, 403);
  const result = await fetch(`${origin}/auth/whop/member?user_id=user_someone_else`, { method: "POST", headers: { Cookie, Origin: f.config.baseUrl } });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal((await result.json()).data.access.ai, true);
  assert.equal((await fetch(`${origin}/auth/whop/upgrade`, { method: "POST" })).status, 401);
  assert.equal((await fetch(`${origin}/auth/whop/upgrade`, { method: "POST", headers: { Cookie, Origin: f.config.baseUrl } })).status, 403);
  const login = await fetch(`${origin}/auth/whop/login`, { headers: { Cookie }, redirect: "manual" });
  assert.equal(login.headers.get("location"), "/members/");
  fail = true;
  const unavailable = await fetch(`${origin}/auth/whop/member`, { headers: { Cookie } });
  assert.equal(unavailable.status, 503);
  assert.doesNotMatch(await unavailable.text(), /private provider detail|test_key|user_a/);
});

test("checkout API accepts its issued token and rejects another member or expired token", async (t) => {
  const f = fixture(t);
  Object.assign(f.config, { whopCompanyId: "biz_test", exclusivePlanId: "plan_exclusive" });
  let promo;
  let creates = 0;
  const server = createAuthServer(f.config, { fetchFn: async (url, options) => {
    const path = new URL(url).pathname;
    if (path.includes("/access/")) return Response.json({ has_access: path.endsWith("/prod_ai") });
    if (path.endsWith("/plans/plan_exclusive")) return Response.json({ product: { id: "prod_exclusive" },
      initial_price: 0, renewal_price: 50, billing_period: 30, plan_type: "renewal", currency: "usd" });
    if (path.endsWith("/promo_codes") && options.method === "POST") {
      creates++;
      promo = { ...JSON.parse(options.body), id: "promo_test", uses: 0, status: "active", duration: "once" };
      return Response.json(promo);
    }
    throw new Error("Unexpected provider request");
  } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const sign = value => {
    const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
    return payload + "." + createHmac("sha256", f.config.whopSessionSecret).update(payload).digest("base64url");
  };
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const Cookie = "titans_whop_session=" + sign({ sub: "user_a", exp });
  const headers = { Cookie, Origin: f.config.baseUrl };
  const member = await (await fetch(`${origin}/auth/whop/member`, { method: "POST", headers })).json();
  const token = member.data.upgradeCsrf;
  assert.ok(token);
  const post = (extra = {}) => fetch(`${origin}/auth/whop/upgrade`, {
    method: "POST", headers: { ...headers, "X-CSRF-Token": token, ...extra },
  });
  assert.equal((await post({ Origin: "https://evil.example" })).status, 403);
  assert.equal((await post({ Cookie: "titans_whop_session=" + sign({ sub: "user_b", exp }) })).status, 403);
  assert.equal((await post({ "X-CSRF-Token": sign({ sub: "user_a", purpose: "exclusive_upgrade", exp: 1 }) })).status, 403);
  assert.equal(creates, 0);
  const checkout = await post();
  assert.equal(checkout.status, 200);
  assert.equal(checkout.headers.get("cache-control"), "no-store");
  const { data } = await checkout.json();
  assert.equal(new URL(data.checkoutUrl).searchParams.get("promoCode"), promo.code);
  assert.equal(data.expiresAt, member.data.offer.expiresAt);
  assert.equal(creates, 1);
});

test("disabled upgrade flag never starts or returns an offer", async (t) => {
  const f = fixture(t);
  f.config.upgradeEnabled = false;
  assert.equal((await f.service().getMember("user_a", { start: true })).offer, null);
  assert.equal(f.service().readRecord("user_a"), null);
});
