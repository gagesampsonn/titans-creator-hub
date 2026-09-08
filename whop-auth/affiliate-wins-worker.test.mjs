import assert from "node:assert/strict";
import { test } from "node:test";
import { newWinState } from "./affiliate-wins.mjs";
import { runWinPoll } from "./affiliate-wins-worker.mjs";

const config = { companyId: "biz_test", aiPlanId: "plan_ai", aiProductId: "prod_ai", exclusivePlanId: "plan_exclusive", exclusiveProductId: "prod_exclusive", channelId: "123456789012345678", guildId: "223456789012345678", botId: "323456789012345678", whopApiKey: "test", botToken: "test" };
function fixture(settings = {}) {
  let total = 0, failWhop = false, lostResponse = false;
  let saved = newWinState(); const messages = [], writes = [];
  const fetchFn = async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (url.includes("api.whop.com")) {
      if (failWhop) return new Response("unavailable", { status: 503 });
      if (path.includes("/plans/")) { const id = path.split("/").at(-1); return Response.json({ id, product: { id: id.replace("plan_", "prod_") } }); }
      if (path.endsWith("/affiliates")) return Response.json({ data: [{ id: "aff_one", status: "active", company: { id: config.companyId }, user: { id: "user_one", name: "Creator", username: "creator" } }], page_info: { has_next_page: false } });
      return Response.json({ data: [{ id: "affov_ai", plan_id: "plan_ai", override_type: "standard", commission_type: "percentage", commission_value: 30, applies_to_payments: "first_payment", total_referral_earnings_usd: total }, { id: "affov_coach", override_type: "rev_share", total_referral_earnings_usd: total * 10 }], page_info: { has_next_page: false } });
    }
    if (path.endsWith("/users/@me")) return Response.json({ id: config.botId });
    if (path.endsWith("/channels/" + config.channelId)) return Response.json({ id: config.channelId, guild_id: config.guildId, type: 0 });
    if (init.method === "POST") {
      const body = JSON.parse(init.body); writes.push(body);
      const message = { ...body, id: String(423456789012345678n + BigInt(messages.length)), channel_id: config.channelId, author: { id: config.botId }, timestamp: new Date().toISOString() };
      messages.unshift(message);
      if (lostResponse) throw Error("simulated connection loss after Discord accepted message");
      return Response.json(message);
    }
    return Response.json(messages);
  };
  const poll = (intercept = fetchFn) => runWinPoll({ ...config, ...settings }, { fetchFn: intercept, load: async () => structuredClone(saved), save: async state => { saved = structuredClone(state); } });
  return { poll, fetchFn, writes, state: () => saved, earn: value => { total = value; }, outage: () => { failWhop = true; }, loseResponse: () => { lostResponse = true; } };
}
test("polling records a baseline and sends exactly one product earnings update without coach income", async () => {
  const f = fixture(); await f.poll(); assert.equal(f.writes.length, 0);
  f.earn(9); await f.poll(); await f.poll();
  assert.equal(f.writes.length, 1);
  assert.match(f.writes[0].embeds[0].title, /9\.00/);
  assert.equal(Object.keys(f.state().records).length, 1);
});

test("Discord identity mapping matches exact Whop owner and never manufactures an earnings event", async () => {
  const identity = { userId: "1060255772874903704", username: "gagesampson_" };
  const owner = fixture({ discordIdentities: { user_one: identity } });
  await owner.poll(); await owner.poll();
  assert.equal(owner.writes.length, 0);
  owner.earn(9); await owner.poll();
  assert.equal(owner.writes[0].embeds[0].author.name, "gagesampson_ earned with Titans");
  const other = fixture({ discordIdentities: { user_other: identity } });
  await other.poll(); other.earn(9); await other.poll();
  assert.equal(other.writes[0].embeds[0].author.name, "Creator earned with Titans");
  assert.deepEqual(other.writes[0].allowed_mentions, { parse: [] });
});

test("malformed Discord identity configuration fails before reading providers or writing state", async () => {
  for (const discordIdentities of [[], "wrong", { wrong: { userId: "1060255772874903704", username: "creator" } },
    { user_one: { userId: 1060255772874903704, username: "creator" } },
    { user_one: { userId: "1060255772874903704", username: "@everyone" } }]) {
    let touched = false;
    await assert.rejects(runWinPoll({ ...config, discordIdentities }, {
      fetchFn: async () => { touched = true; throw Error(); },
      load: async () => { touched = true; }, save: async () => { touched = true; },
    }), /invalid_discord_identit/);
    assert.equal(touched, false);
  }
});
test("provider outage cannot mutate the baseline or send a false win", async () => {
  const f = fixture(); await f.poll(); const before = f.state(); f.outage();
  await assert.rejects(f.poll()); assert.deepEqual(f.state(), before); assert.equal(f.writes.length, 0);
});
test("a lost Discord response is reconciled from the message marker rather than sent twice", async () => {
  const f = fixture(); await f.poll(); f.earn(9); f.loseResponse();
  await assert.rejects(f.poll()); assert.equal(f.writes.length, 1);
  assert.ok(f.state().records.affov_ai.notice.attemptedAt);
  await f.poll(); assert.equal(f.writes.length, 1); assert.equal(f.state().records.affov_ai.notice, null);
});

test("incomplete provider pagination and a mismatched Discord destination fail before state or messages", async () => {
  for (const failure of ["pagination", "channel"]) {
    const f = fixture(); await f.poll(); const before = structuredClone(f.state()); f.earn(9);
    await assert.rejects(f.poll(async (url, init) => {
      if (failure === "pagination" && new URL(url).pathname.endsWith("/overrides")) return Response.json({ data: [], page_info: { has_next_page: true } });
      if (failure === "channel" && new URL(url).pathname.endsWith(config.channelId)) return Response.json({ id: config.channelId, guild_id: "wrong", type: 0 });
      return f.fetchFn(url, init);
    }));
    assert.deepEqual(f.state(), before); assert.equal(f.writes.length, 0);
  }
});
