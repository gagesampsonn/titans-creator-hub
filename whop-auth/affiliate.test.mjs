import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createAuthServer, normalizeNextPath } from "./server.mjs";
import { createAffiliateService, AffiliateUnavailable } from "./affiliate.mjs";

const config = { affiliateEnabled: true, whopApiKey: "test_only", whopCompanyId: "biz_titans", aiProductId: "prod_ai", exclusiveProductId: "prod_exclusive", aiPlanId: "plan_ai", exclusivePlanId: "plan_exclusive" };
function fixture(options = {}) {
  const calls = [], overrides = options.overrides ?? [];
  const affiliate = { id: "aff_member", status: "active", company: { id: "biz_titans" }, user: { id: "user_member", username: "member" }, total_referrals_count: 2, total_referral_earnings_usd: "18.00", ...options.affiliate };
  const record = plan => ({ id: `affov_${plan}`, plan_id: plan, override_type: "standard", commission_type: "percentage", commission_value: 30, applies_to_payments: "first_payment", checkout_direct_link: `https://whop.com/checkout/${plan}/?a=member`, total_referral_earnings_usd: 0 });
  const fetchFn = async (url, init = {}) => {
    const path = new URL(url).pathname.replace("/api/v1", "");
    calls.push({ path, method: init.method ?? "GET", body: init.body && JSON.parse(init.body) });
    if (path.startsWith("/plans/")) return Response.json({ id: path.split("/").pop(), product: { id: path.includes("exclusive") ? "prod_exclusive" : "prod_ai" }, currency: "usd", plan_type: path.includes("exclusive") ? "renewal" : "one_time", initial_price: path.includes("exclusive") ? 0 : 29.99, renewal_price: 50, trial_period_days: null, ...options.plan });
    if (path === "/affiliates") return Response.json(affiliate);
    if (path === "/affiliates/aff_member/overrides" && init.method === "POST") { const value = record(JSON.parse(init.body).plan_id); overrides.push(value); if (options.timeoutOnce && overrides.length === 1) throw Error("provider timeout after write"); return Response.json(value); }
    if (path === "/affiliates/aff_member/overrides") return Response.json({ data: overrides, page_info: { has_next_page: false } });
    throw Error("Unexpected provider call");
  };
  const memberService = { getMember: async () => ({ access: options.access ?? { aiPurchased: true, exclusive: false } }) };
  return { service: createAffiliateService({ ...config, ...options.config }, memberService, { fetchFn }), calls, overrides, record, fetchFn };
}
test("eligible members receive only Whop links and supported totals, with current plan estimates", async () => {
  const { service, calls } = fixture();
  const result = await service.connect("user_member");
  assert.equal(result.preview, false);
  assert.equal(result.links.length, 2);
  assert.equal(result.links[0].price.amount, 29.99);
  assert.equal(result.links[1].price.amount, 50);
  assert.equal(result.metrics.totalEarnedUsd, 18);
  assert.equal(result.metrics.sales, 2);
  for (const key of ["clicks", "conversionRate", "pendingUsd", "paidUsd"]) assert.equal(result.metrics[key], null);
  assert.equal(result.referrals, null);
  assert.equal(JSON.stringify(result).includes("user_member"), false);
  assert.equal(calls.find(c => c.path === "/affiliates").body.user_identifier, "user_member");
  for (const call of calls.filter(c => c.path.endsWith("/overrides") && c.method === "POST")) {
    assert.equal(call.body.commission_value, 30);
    assert.equal(call.body.applies_to_payments, "first_payment");
    assert.equal(call.body.override_type, "standard");
  }
});
test("Whop USD-formatted earnings are parsed strictly without inventing unavailable totals", async () => {
  for (const [raw, expected] of [["$0.00", 0], ["$1,234.56", 1234.56], ["18.00", 18], ["$12,34.56", null], ["unknown", null], [null, null], ["", null]]) {
    const result = await fixture({ affiliate: { total_referral_earnings_usd: raw } }).service.connect("user_member");
    assert.equal(result.metrics.totalEarnedUsd, expected);
  }
});
test("weekly, unpurchased and disabled accounts cannot enroll", async () => {
  for (const options of [{ access: { weekly: true } }, { access: {} }, { config: { affiliateEnabled: false } }]) {
    const { service, calls } = fixture(options);
    await assert.rejects(service.connect("user_member"), AffiliateUnavailable);
    assert.equal(calls.length, 0);
  }
});
test("active Exclusive can enroll; repeat and concurrent requests do not duplicate overrides", async () => {
  const { service, calls } = fixture({ access: { exclusive: true } });
  await Promise.all([service.connect("user_member"), service.connect("user_member")]);
  await service.connect("user_member");
  assert.equal(calls.filter(c => c.method === "POST" && c.path.endsWith("/overrides")).length, 2);
});
test("archived affiliates, wrong owners and wrong companies fail closed before commission writes", async () => {
  for (const affiliate of [{ status: "archived" }, { user: { id: "user_other" } }, { company: { id: "biz_other" } }]) {
    const { service, calls } = fixture({ affiliate });
    await assert.rejects(service.connect("user_member"));
    assert.equal(calls.some(c => c.path.endsWith("/overrides") && c.method === "POST"), false);
  }
});
test("existing custom agreements are preserved and reported as needing review", async () => {
  const { record } = fixture();
  for (const changed of [{ commission_value: 50 }, { applies_to_payments: "all_payments" }]) {
    const { service, calls } = fixture({ overrides: [{ ...record("plan_ai"), ...changed }] });
    await assert.rejects(service.connect("user_member"), AffiliateUnavailable);
    assert.equal(calls.some(c => c.path.endsWith("/overrides") && c.method === "POST"), false);
  }
  const allProducts = fixture({ overrides: [{ override_type: "rev_share", applies_to_products: "all_products", product_id: "prod_other" }] });
  await assert.rejects(allProducts.service.connect("user_member"), AffiliateUnavailable);
  assert.equal(allProducts.calls.some(c => c.path.endsWith("/overrides") && c.method === "POST"), false);
});
test("changed plans and unsafe or unattributed referral URLs are rejected", async () => {
  const { record } = fixture();
  for (const options of [{ plan: { product: { id: "prod_other" } } }, { overrides: [{ ...record("plan_ai"), checkout_direct_link: "https://evil.test/?a=member" }] }, { overrides: [{ ...record("plan_ai"), checkout_direct_link: "https://whop.com/checkout/plan_ai/" }] }]) await assert.rejects(fixture(options).service.connect("user_member"));
});
test("a provider timeout is reconciled by reading overrides on the next attempt", async () => {
  const { service, calls } = fixture({ timeoutOnce: true });
  await assert.rejects(service.connect("user_member"));
  await service.connect("user_member");
  assert.equal(calls.filter(c => c.path.endsWith("/overrides") && c.method === "POST").length, 2);
});

test("HTTP enrollment requires a signed eligible session and same-origin custom header, ignores supplied user IDs", async t => {
  const f = fixture();
  let access = true, fail = false;
  const authConfig = { ...config, baseUrl: "https://titansagency.co", whopSessionSecret: "s".repeat(64), upgradeEnabled: false, courseIds: [] };
  const server = createAuthServer(authConfig, { fetchFn: async (url, options) => {
    if (fail) throw Error("private upstream information test_only");
    if (String(url).includes("/access/")) { assert.ok(String(url).includes("user_member")); return Response.json({ has_access: access && String(url).endsWith("/prod_ai") }); }
    return f.fetchFn(url, options);
  } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const endpoint = `http://127.0.0.1:${server.address().port}/auth/whop/affiliates`;
  const payload = Buffer.from(JSON.stringify({ sub: "user_member", exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  const Cookie = "titans_whop_session=" + payload + "." + createHmac("sha256", authConfig.whopSessionSecret).update(payload).digest("base64url");
  const headers = { Cookie, Origin: authConfig.baseUrl, "X-Titans-Affiliate": "1" };
  assert.equal((await fetch(endpoint, { method: "POST" })).status, 401);
  assert.equal((await fetch(endpoint, { headers })).status, 405);
  assert.equal((await fetch(endpoint, { method: "POST", headers: { ...headers, Cookie: Cookie + "bad" } })).status, 401);
  for (const change of [{ Origin: "https://evil.test" }, { Origin: "null" }, { "X-Titans-Affiliate": "" }]) assert.equal((await fetch(endpoint, { method: "POST", headers: { ...headers, ...change } })).status, 403);
  assert.equal(f.calls.length, 0);
  access = false;
  assert.equal((await fetch(endpoint, { method: "POST", headers })).status, 403);
  access = true;
  const response = await fetch(endpoint + "?user_id=user_other", { method: "POST", headers, body: JSON.stringify({ userId: "user_other", commission: 99 }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal((await response.json()).data.links.length, 2);
  const member = await (await fetch(endpoint.replace("affiliates", "member"), { headers })).json();
  assert.equal(member.data.affiliateEnabled, true);
  fail = true;
  const failure = await fetch(endpoint, { method: "POST", headers });
  assert.equal(failure.status, 503);
  assert.doesNotMatch(await failure.text(), /private|test_only|user_member/);
  assert.equal(normalizeNextPath("/members/earn/"), "/members/earn/");
});
