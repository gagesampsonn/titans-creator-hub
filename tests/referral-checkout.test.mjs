import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const key = "titans.referral.v1";
const now = 1_800_000_000_000;
function render(search = "", stored = null, blocked = false) {
  const storage = new Map(stored === null ? [] : [[key, stored]]);
  const embed = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const anchors = ["https://whop.com/checkout/plan_bJeNjIIJAtzSR", "/exclusive/", "https://other.example/checkout/plan_fake", "/auth/whop/login"].map(href => ({ href: new URL(href, "https://titansagency.co").href }));
  vm.runInNewContext(readFileSync(new URL("../assets/referral-checkout.js", import.meta.url), "utf8"), {
    URL, URLSearchParams, Date: { now: () => now },
    window: { location: { search, origin: "https://titansagency.co" }, localStorage: {
      getItem(k) { if (blocked) throw Error(); return storage.get(k) ?? null; },
      setItem(k, v) { if (blocked) throw Error(); storage.set(k, v); },
      removeItem(k) { if (blocked) throw Error(); storage.delete(k); },
    } },
    document: { querySelectorAll: selector => selector === "[data-whop-checkout-plan-id]" ? [embed] : anchors },
  });
  return { code: embed.attributes["data-whop-checkout-affiliate-code"], storage, anchors };
}

test("explicit genuine code reaches embed and fallback without re-tagging normal product navigation", () => {
  const view = render("?a=mitchschill");
  assert.equal(view.code, "mitchschill");
  assert.equal(new URL(view.anchors[0].href).searchParams.get("a"), "mitchschill");
  assert.equal(new URL(view.anchors[1].href).searchParams.get("a"), null);
  assert.equal(new URL(view.anchors[2].href).search, "");
  assert.equal(new URL(view.anchors[3].href).search, "");
  assert.deepEqual(JSON.parse(view.storage.get(key)), { code: "mitchschill", capturedAt: now });
});

test("valid referral lasts at most 30 days without extending on return visits", () => {
  const stored = JSON.stringify({ code: "real.member_1", capturedAt: now - 1000 });
  const view = render("", stored);
  assert.equal(view.code, "real.member_1");
  assert.equal(view.storage.get(key), stored);
  const refreshed = render("?a=real.member_1", stored);
  assert.equal(refreshed.storage.get(key), stored);
  const nextPage = render(new URL(refreshed.anchors[1].href).search, refreshed.storage.get(key));
  assert.equal(nextPage.code, "real.member_1");
  assert.equal(nextPage.storage.get(key), stored);
  for (const capturedAt of [now - 30 * 86400000, now + 1, "bad", null]) {
    assert.equal(render("", JSON.stringify({ code: "real", capturedAt })).code, undefined);
  }
  assert.equal(render("", "not json").code, undefined);
  assert.equal(render().code, undefined);
});

test("new valid referral replaces old; invalid or duplicate explicit code fails closed", () => {
  const stored = JSON.stringify({ code: "old", capturedAt: now });
  assert.equal(render("?a=new", stored).code, "new");
  for (const search of ["?a=", "?a=x&a=y", "?a=%2F%2Fevil", "?a=%3Cscript%3E", `?a=${"x".repeat(65)}`]) {
    const view = render(search, stored);
    assert.equal(view.code, undefined);
    assert.equal(view.storage.has(key), false);
  }
});

test("blocked storage does not break checkout or explicit attribution", () => {
  assert.equal(render("?a=mitchschill", null, true).code, "mitchschill");
  assert.equal(new URL(render("?a=mitchschill", null, true).anchors[1].href).searchParams.get("a"), "mitchschill");
  assert.equal(render("", null, true).code, undefined);
});

test("sales pages apply attribution before the deferred Whop loader", () => {
  for (const product of ["ai", "exclusive"]) {
    const html = readFileSync(new URL(`../${product}/index.html`, import.meta.url), "utf8");
    const referral = html.match(/<script[^>]*src="\/assets\/referral-checkout\.js[^\"]*"[^>]*><\/script>/);
    const loader = html.match(/<script[^>]*src="https:\/\/js.whop.com\/static\/checkout\/loader.js"[^>]*><\/script>/);
    assert.ok(referral);
    assert.match(referral[0], /\bdefer\b/);
    assert.match(loader[0], /\bdefer\b/);
    assert.doesNotMatch(loader[0], /\basync\b/);
    assert.ok(referral.index < loader.index);
  }
});
