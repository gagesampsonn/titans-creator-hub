import assert from "node:assert/strict";
import { test } from "node:test";
import { newWinState, planWins, winMessage } from "./affiliate-wins.mjs";

const item = (cents = 900) => ({ key: "affov_one", affiliateId: "aff_one", userId: "user_one", username: "creator", name: "Creator", planId: "plan_ai", product: "AI Prompter + Guide", totalCents: cents });
test("first observation only establishes a baseline, never celebrates historical earnings", () => {
  const state = newWinState();
  assert.deepEqual(planWins(state, [item()], 1000), []);
  assert.equal(state.records.affov_one.totalCents, 900);
  assert.deepEqual(planWins(state, [item()], 2000), []);
});
test("one Whop earnings increase creates a durable, stable notice; duplicate polls do not duplicate it", () => {
  const state = newWinState(); planWins(state, [item(0)], 1000);
  const [notice] = planWins(state, [item()], 2000);
  assert.equal(notice.deltaCents, 900);
  assert.equal(notice.totalCents, 900);
  assert.equal(planWins(state, [item()], 3000)[0].id, notice.id);
  state.records.affov_one.notice = null;
  assert.deepEqual(planWins(state, [item()], 4000), []);
});
test("decreases, missing overrides and changed ownership cannot produce stale celebrations", () => {
  for (const next of [[item(800)], [], [{ ...item(1800), userId: "user_other" }]]) {
    const state = newWinState(); planWins(state, [item(0)], 1000); planWins(state, [item()], 2000);
    assert.deepEqual(planWins(state, next, 3000), []);
  }
});

test("earnings accumulated while a notice is pending produce a separate later update", () => {
  const state = newWinState(); planWins(state, [item(0)], 1000);
  const [first] = planWins(state, [item(900)], 2000);
  const [pending] = planWins(state, [item(1800)], 3000);
  assert.equal(pending.id, first.id);
  assert.equal(pending.deltaCents, 900);
  state.records.affov_one.notice = null;
  const [next] = planWins(state, [item(1800)], 4000);
  assert.notEqual(next.id, first.id);
  assert.equal(next.deltaCents, 900);
  assert.equal(next.totalCents, 1800);
});
test("Discord embed reports provider totals, not invented sale prices, sale counts or payout status", () => {
  const state = newWinState(); planWins(state, [item(0)], 1000);
  const [notice] = planWins(state, [{ ...item(), name: "@everyone **Creator**" }], 2000);
  const msg = winMessage(notice);
  assert.deepEqual(msg.allowed_mentions, { parse: [] });
  assert.match(msg.embeds[0].title, /9\.00/);
  assert.match(msg.embeds[0].description, /multiple referrals|adjustments/);
  assert.ok(msg.embeds[0].fields.some(x => x.name === "Product earnings" && x.value === "$9.00"));
  assert.ok(!msg.embeds[0].fields.some(x => /sale price|total sales|paid/i.test(x.name)));
  assert.equal(msg.embeds[0].author.name.includes("@everyone"), false);
  assert.match(msg.embeds[0].footer.text, new RegExp(notice.id));
});
