import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const window = {};
for (const file of ["affiliate-dashboard.js", "affiliate-toolkit.js"]) vm.runInNewContext(readFileSync(new URL(`../assets/${file}`, import.meta.url), "utf8"), { window, URL, Intl });

test("milestones advance from real sales without inventing achievements", () => {
  for (const [sales, target] of [[0, 1], [1, 5], [5, 10], [10, 25], [25, 50], [50, 100], [100, 200]]) {
    const value = window.TitansAffiliateDashboard.milestone(sales);
    assert.equal(value.target, target);
    assert.equal(value.sales, sales);
    assert.equal(value.remaining, target - sales);
  }
  assert.equal(window.TitansAffiliateDashboard.milestone(null), null);
  assert.equal(window.TitansAffiliateDashboard.milestone(-1), null);
});

test("earnings examples require explicit current pricing and commission terms", () => {
  const estimate = window.TitansAffiliateDashboard.estimate;
  assert.equal(estimate({ commissionPercent: 30 }), null);
  assert.equal(estimate({ price: { amount: 50, currency: "USD" }, commissionPercent: 30, payments: "first_payment" }), "$15.00");
  assert.equal(estimate({ price: { amount: 10, currency: "USD" }, commissionPercent: 30, payments: "first_payment" }), "$3.00");
  assert.equal(estimate({ price: { amount: 50, currency: "USD" }, commissionPercent: 30, payments: "all_payments" }), null);
});

test("toolkit ships completely empty and filters approval and reference relationships", () => {
  const catalog = JSON.parse(readFileSync(new URL("../assets/affiliate-toolkit.json", import.meta.url), "utf8"));
  for (const key of ["referenceVideos", "hooks", "scripts", "captions", "talkingPoints"]) assert.deepEqual(catalog[key], []);
  const records = { hooks: [
    { id: "approved", status: "approved", product: "ai", title: "Test", text: "Approved test text", referenceId: "ref1" },
    { id: "draft", status: "draft", product: "ai", title: "Test", text: "Draft test text", referenceId: "ref1" },
    { id: "other", status: "approved", product: "exclusive", title: "Test", text: "Other test text", referenceId: "ref1" },
  ] };
  assert.equal(window.TitansToolkit.approved(records, "hooks", "ai", "ref1").length, 1);
  assert.equal(window.TitansToolkit.approved(records, "hooks", "ai", "missing").length, 0);
});

test("reference media accepts uploaded assets and HTTPS links but rejects unsafe URLs", () => {
  const safe = window.TitansToolkit.safeUrl;
  assert.equal(safe("/assets/affiliate-media/reference.mp4", true), "/assets/affiliate-media/reference.mp4");
  assert.equal(safe("https://www.youtube.com/watch?v=reference"), "https://www.youtube.com/watch?v=reference");
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.test", "https://user:pass@evil.test", "/assets/../whop-auth/server.mjs"]) assert.equal(safe(url), null);
});
