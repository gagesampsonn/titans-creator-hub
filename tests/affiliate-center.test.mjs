import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { affiliatePreview } from "./affiliate-preview-data.mjs";

test("only eligible preview accounts receive two clearly non-live referral links", () => {
  for (const mode of ["ai", "exclusive", "expired"]) {
    const response = affiliatePreview(mode);
    assert.equal(response.status, 200);
    assert.equal(response.data.preview, true);
    assert.deepEqual(response.data.links.map(link => link.product), ["ai", "exclusive"]);
    for (const link of response.data.links) {
      assert.equal(new URL(link.url).hostname, "titans.example");
      assert.equal(link.commissionPercent, 30);
      assert.equal(link.payments, "first_payment");
    }
    assert.equal(response.data.metrics, null);
    assert.equal(response.data.referrals, null);
  }
  for (const mode of ["weekly", "none"]) assert.equal(affiliatePreview(mode).status, 403);
  assert.equal(affiliatePreview("unauth").status, 401);
  assert.equal(affiliatePreview("error").status, 503);
});

async function render(mode = "ai", options = {}) {
  const elements = new Map();
  const element = selector => {
    const classes = new Set(["member-sr-only"]);
    if (!elements.has(selector)) elements.set(selector, { hidden: true, value: "", textContent: "Copy Link", dataset: {}, events: {},
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      addEventListener(name, fn) { this.events[name] = fn; }, focus() {}, select() {} });
    return elements.get(selector);
  };
  const copies = [], shares = [];
  const timers = [];
  const copyButtons = ["ai", "exclusive"].map(product => ({ ...element(`copy-${product}`), dataset: { copyLink: product } }));
  const inlineErrors = [];
  if (options.inlineErrors) for (const button of copyButtons) button.closest = () => ({ after: node => inlineErrors.push(node) });
  const shareButtons = ["ai", "exclusive"].map(product => ({ ...element(`share-${product}`), dataset: { shareLink: product } }));
  const response = options.response ?? affiliatePreview(mode);
  vm.runInNewContext(readFileSync(new URL("../assets/affiliate-center.js", import.meta.url), "utf8"), {
    document: { querySelector: element, querySelectorAll: selector => selector === "[data-copy-link]" ? copyButtons : selector === "[data-share-link]" ? shareButtons : [], createElement: () => ({ remove() {} }), addEventListener() {} },
    window: { location: { hostname: options.hostname ?? "127.0.0.1" }, addEventListener() {} }, URL,
    navigator: { clipboard: { writeText: async text => { if (options.clipboardError) throw Error(); copies.push(text); } },
      ...(options.share ? { share: async data => { shares.push(data); } } : {}) },
    fetch: async () => ({ status: response.status, ok: response.status === 200, json: async () => response }),
    setTimeout(fn) { timers.push(fn); return timers.length - 1; }, clearTimeout(id) { timers[id] = null; },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { element, copies, shares, copyButtons, shareButtons, inlineErrors, resetFeedback() { for (const timer of timers) timer?.(); } };
}

test("copy and share use the selected product's link with accessible feedback", async () => {
  const view = await render();
  await view.copyButtons[0].events.click();
  assert.match(view.copyButtons[0].textContent, /Copied!/);
  assert.equal(view.copyButtons[0].classList.contains("is-copied"), true);
  view.resetFeedback();
  assert.equal(view.copyButtons[0].textContent, "Copy Link");
  assert.equal(view.copyButtons[0].classList.contains("is-copied"), false);
  await view.shareButtons[1].events.click();
  assert.match(view.copies[0], /\/ai\//);
  assert.match(view.copies[1], /\/exclusive\//);
  assert.match(view.element("[data-affiliate-status]").textContent, /copied/i);
  const native = await render("exclusive", { share: true });
  await native.shareButtons[1].events.click();
  assert.match(native.shares[0].url, /\/exclusive\//);
});

test("clipboard failure offers manual copy and denied users never see links", async () => {
  const view = await render("ai", { clipboardError: true });
  await view.copyButtons[0].events.click();
  assert.match(view.element("[data-affiliate-status]").textContent, /select|manually/i);
  assert.equal(view.element("[data-affiliate-status]").classList.contains("member-sr-only"), false);
  for (const mode of ["weekly", "none", "unauth", "error"]) {
    const denied = await render(mode);
    assert.equal(denied.element("[data-affiliate-content]").hidden, true);
    assert.equal(denied.element(mode === "error" ? "[data-affiliate-error]" : "[data-affiliate-denied]").hidden, false);
  }
});

test("clipboard errors are inserted beside the invoked control instead of off-screen", async () => {
  const page = await render("ai", { clipboardError: true, inlineErrors: true });
  await page.copyButtons[0].events.click();
  assert.equal(page.inlineErrors.length, 1);
  assert.equal(page.inlineErrors[0].className, "earn-inline-error");
  assert.match(page.inlineErrors[0].textContent, /copy it manually/);
  assert.equal(page.element("[data-affiliate-status]").classList.contains("member-sr-only"), true);
});

test("demo data cannot render on production or accept substituted destinations or terms", async () => {
  const wrongLink = affiliatePreview("ai");
  wrongLink.data.links[0].url = "https://evil.example/ai/";
  const wrongTerms = affiliatePreview("ai");
  wrongTerms.data.links[1].payments = "all_payments";
  for (const options of [{ hostname: "titansagency.co" }, { response: wrongLink }, { response: wrongTerms }]) {
    const page = await render("ai", options);
    assert.equal(page.element("[data-affiliate-content]").hidden, true);
    assert.equal(page.element("[data-affiliate-error]").hidden, false);
    await page.copyButtons[0].events.click();
    assert.equal(page.copies.length, 0);
  }
});

test("My Titans exposes Earn only when the local preview explicitly enables it for an eligible member", async () => {
  for (const [enabled, eligible, visible] of [[true, true, true], [false, true, false], [true, false, false]]) {
    const earn = { hidden: true };
    vm.runInNewContext(readFileSync(new URL("../assets/member-access.js", import.meta.url), "utf8"), {
      document: { querySelector: selector => selector === "[data-member-earn]" ? earn : selector.startsWith("link[") ? {} : null, addEventListener() {} },
      window: { addEventListener() {}, dispatchEvent() {} }, CustomEvent: class {}, clearInterval() {},
      fetch: async () => ({ ok: true, json: async () => ({ data: { affiliatePreview: enabled, access: { ai: eligible }, offer: null } }) }),
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(earn.hidden, !visible);
  }
});
