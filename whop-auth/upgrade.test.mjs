import assert from "node:assert/strict";
import { test } from "node:test";
import { createUpgradeService, UpgradeUnavailable } from "./upgrade.mjs";

function fixture() {
  let time = 1_800_000_000_000;
  let eligible = true;
  let record = { startedAt: time };
  let promo;
  let creates = 0;
  let changedPrice = false;
  let loseResponse = false;
  const config = { whopSessionSecret: "s".repeat(64), whopApiKey: "private_test_key",
    whopCompanyId: "biz_test", exclusiveProductId: "prod_exclusive", exclusivePlanId: "plan_exclusive" };
  const member = {
    getMember: async () => ({ offer: eligible && time < record.startedAt + 600_000 ? { expiresAt: record.startedAt + 600_000 } : null }),
    readRecord: () => ({ ...record }), saveRecord: (_id, value) => { record = { ...value }; },
  };
  const fetchFn = async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer private_test_key");
    const path = new URL(url).pathname;
    if (path.endsWith("/plans/plan_exclusive")) return Response.json({ product: { id: "prod_exclusive" },
      initial_price: 0, renewal_price: changedPrice ? 60 : 50, billing_period: 30, plan_type: "renewal", currency: "usd", trial_period_days: null });
    if (path.endsWith("/promo_codes") && options.method === "POST") {
      creates++;
      const body = JSON.parse(options.body);
      assert.equal(body.amount_off, 40);
      assert.equal(body.promo_duration_months, 1);
      assert.deepEqual(body.plan_ids, ["plan_exclusive"]);
      assert.equal(body.stock, 1);
      assert.equal(body.unlimited_stock, false);
      promo = { ...body, id: "promo_test", uses: 0, status: "active", duration: "once" };
      if (loseResponse) { loseResponse = false; throw new Error("network_timeout"); }
      return Response.json(promo);
    }
    if (path.endsWith("/promo_codes/promo_test")) return Response.json(promo);
    if (path.endsWith("/promo_codes")) return Response.json({ data: promo ? [promo] : [], page_info: { has_next_page: false } });
    throw new Error("Unexpected request");
  };
  return { service: () => createUpgradeService(config, member, { fetchFn, now: () => time }),
    advance: (ms) => { time += ms; }, setIneligible: () => { eligible = false; },
    changePrice: () => { changedPrice = true; }, loseResponse: () => { loseResponse = true; },
    usePromo: () => { promo.uses = 1; }, creates: () => creates };
}

test("concurrent checkout requests and restarts reuse one single-use discount", async () => {
  const f = fixture();
  const service = f.service();
  const [a, b] = await Promise.all([service.createCheckout("user_a"), service.createCheckout("user_a")]);
  assert.equal(a.checkoutUrl, b.checkoutUrl);
  assert.equal(f.creates(), 1);
  assert.equal((await f.service().createCheckout("user_a")).checkoutUrl, a.checkoutUrl);
  assert.equal(f.creates(), 1);
  assert.equal(new URL(a.checkoutUrl).origin, "https://whop.com");
  assert.match(new URL(a.checkoutUrl).searchParams.get("promoCode"), /^titans10[0-9a-f]{24}$/);
  assert.equal(new URL(a.checkoutUrl).searchParams.has("promo"), false);
});

test("expired, ineligible, redeemed, and altered-price offers fail closed", async () => {
  const expired = fixture(); expired.advance(600_000);
  await assert.rejects(expired.service().createCheckout("user_a"), UpgradeUnavailable);
  assert.equal(expired.creates(), 0);
  const ineligible = fixture(); ineligible.setIneligible();
  await assert.rejects(ineligible.service().createCheckout("user_a"), UpgradeUnavailable);
  const changed = fixture(); changed.changePrice();
  await assert.rejects(changed.service().createCheckout("user_a"), /upgrade_plan_terms_changed/);
  assert.equal(changed.creates(), 0);
  const redeemed = fixture(); await redeemed.service().createCheckout("user_a"); redeemed.usePromo();
  await assert.rejects(redeemed.service().createCheckout("user_a"), UpgradeUnavailable);
});

test("a timeout after Whop creates the promo does not create a second discount", async () => {
  const f = fixture(); f.loseResponse();
  await assert.rejects(f.service().createCheckout("user_a"), /network_timeout/);
  assert.ok((await f.service().createCheckout("user_a")).checkoutUrl);
  assert.equal(f.creates(), 1);
});
