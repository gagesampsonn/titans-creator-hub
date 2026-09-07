import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

async function libraryView(access, ok = true, legacyMarkup = false) {
  const products = { hidden: true };
  const cards = ["ai", "exclusive", "weekly"].map(key => {
    const fields = new Map();
    const classes = new Set();
    return { dataset: { product: key }, hidden: key === "weekly", classes,
      classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } },
      querySelector(selector) { if (legacyMarkup && selector === "[data-ownership-check]") return null; if (!fields.has(selector)) fields.set(selector, { hidden: true, textContent: "" }); return fields.get(selector); },
    };
  });
  vm.runInNewContext(readFileSync(new URL("../assets/member-access.js", import.meta.url), "utf8"), {
    document: { querySelector: selector => selector === "[data-member-products]" ? products : null,
      querySelectorAll: () => cards, addEventListener() {} },
    window: { addEventListener() {}, dispatchEvent() {} }, CustomEvent: class {}, clearInterval() {},
    fetch: async () => ({ ok, json: async () => ({ data: { access, offer: null } }) }),
  });
  await new Promise(resolve => setImmediate(resolve));
  return { cards, products };
}

test("green ownership checks appear only for explicitly verified product access", async () => {
  for (const access of [
    { ai: true, aiPurchased: true, exclusive: false, weekly: false },
    { ai: true, aiPurchased: false, exclusive: true, weekly: false },
    { ai: false, exclusive: false, weekly: true },
    { ai: "true", exclusive: null },
  ]) {
    const { cards, products } = await libraryView(access);
    assert.equal(products.hidden, false);
    for (const card of cards) {
      const owned = access[card.dataset.product] === true;
      assert.equal(card.querySelector("[data-ownership-check]").hidden, !owned);
      assert.equal(card.classes.has("is-locked"), !owned);
    }
    if (access.exclusive) assert.equal(cards[0].querySelector("[data-product-status]").textContent, "Included with Exclusive");
  }
});

test("unverified products stay hidden when the membership lookup fails", async () => {
  const view = await libraryView({ ai: true, exclusive: true }, false);
  assert.equal(view.products.hidden, true);
  assert.ok(view.cards.every(card => card.querySelector("[data-ownership-check]").hidden));
});

test("cached pre-badge markup still renders product access during rollout", async () => {
  const view = await libraryView({ ai: true, aiPurchased: true }, true, true);
  assert.equal(view.products.hidden, false);
  assert.equal(view.cards[0].querySelector("[data-owned-actions]").hidden, false);
});
