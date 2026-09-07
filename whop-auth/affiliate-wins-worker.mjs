import { readFile, mkdir, open, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { newWinState, planWins, winMessage } from "./affiliate-wins.mjs";

const validId = (value, prefix) => typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9_]+$`).test(value);
function cents(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw Error("invalid_whop_earnings");
  const result = Math.round(value * 100);
  if (!Number.isSafeInteger(result)) throw Error("invalid_whop_earnings");
  return result;
}

export async function runWinPoll(config, { fetchFn = fetch, load, save } = {}) {
  const began = Date.now();
  const counters = { affiliates: 0, tracked: 0, delivered: 0, reconciled: 0, requests: 0 };
  for (const key of ["channelId", "guildId", "botId"]) if (!/^\d{17,20}$/.test(config[key])) throw Error("invalid_discord_configuration");
  if (!validId(config.companyId, "biz") || !config.whopApiKey || !config.botToken) throw Error("invalid_win_configuration");
  const products = [
    { planId: config.aiPlanId, productId: config.aiProductId, title: "AI Prompter + Guide" },
    { planId: config.exclusivePlanId, productId: config.exclusiveProductId, title: "Titans Exclusive" },
  ];
  for (const product of products) if (!validId(product.planId, "plan") || !validId(product.productId, "prod")) throw Error("invalid_plan_configuration");
  async function api(provider, path, body) {
    counters.requests++;
    const whop = provider === "whop";
    const response = await fetchFn((whop ? "https://api.whop.com/api/v1" : "https://discord.com/api/v10") + path, {
      method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `${whop ? "Bearer" : "Bot"} ${whop ? config.whopApiKey : config.botToken}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw Error(`${provider}_http_${response.status}`);
    const text = await response.text();
    if (text.length > 2_000_000) throw Error(`${provider}_response_too_large`);
    try { return JSON.parse(text); } catch { throw Error(`${provider}_invalid_json`); }
  }
  async function list(path, params, maxPages = 50) {
    const query = new URLSearchParams({ ...params, first: "100" });
    const records = [], cursors = new Set();
    for (let page = 0; page < maxPages; page++) {
      const result = await api("whop", `${path}?${query}`);
      if (!Array.isArray(result.data) || typeof result.page_info?.has_next_page !== "boolean") throw Error("invalid_whop_page");
      records.push(...result.data);
      if (!result.page_info.has_next_page) return records;
      const cursor = result.page_info.end_cursor;
      if (typeof cursor !== "string" || !cursor || cursors.has(cursor)) throw Error("invalid_whop_cursor");
      cursors.add(cursor); query.set("after", cursor);
    }
    throw Error("whop_pagination_incomplete");
  }

  // Complete all source reads before changing state or posting anything.
  for (const product of products) {
    const plan = await api("whop", `/plans/${product.planId}`);
    if (plan.id !== product.planId || plan.product?.id !== product.productId) throw Error("win_product_changed");
  }
  const items = [];
  const affiliates = await list("/affiliates", { account_id: config.companyId, status: "active" });
  for (const affiliate of affiliates) {
    if (!validId(affiliate.id, "aff") || affiliate.company?.id !== config.companyId || !validId(affiliate.user?.id, "user") || affiliate.status !== "active") throw Error("invalid_whop_affiliate");
    counters.affiliates++;
    const overrides = await list(`/affiliates/${affiliate.id}/overrides`, {}, 10);
    for (const override of overrides) {
      const product = products.find(p => p.planId === override.plan_id);
      if (!product || override.override_type !== "standard" || override.commission_type !== "percentage" || override.commission_value !== 30 || override.applies_to_payments !== "first_payment") continue;
      if (!validId(override.id, "affov")) throw Error("invalid_whop_override");
      items.push({ key: override.id, affiliateId: affiliate.id, userId: affiliate.user.id, name: affiliate.user.name, username: affiliate.user.username, planId: product.planId, product: product.title, totalCents: cents(override.total_referral_earnings_usd) });
    }
  }
  const bot = await api("discord", "/users/@me");
  const channel = await api("discord", `/channels/${config.channelId}`);
  if (bot.id !== config.botId || channel.id !== config.channelId || channel.guild_id !== config.guildId || channel.type !== 0) throw Error("discord_destination_mismatch");
  const state = await load();
  if (state.version !== 1 || !state.records || Array.isArray(state.records) || typeof state.records !== "object") throw Error("invalid_win_state");
  const notices = planWins(state, items, Date.now());
  counters.tracked = items.length;
  await save(state);

  async function alreadyDelivered(notice) {
    let before;
    for (let page = 0; page < 10; page++) {
      const query = new URLSearchParams({ limit: "100", ...(before ? { before } : {}) });
      const messages = await api("discord", `/channels/${config.channelId}/messages?${query}`);
      if (!Array.isArray(messages)) throw Error("invalid_discord_history");
      if (messages.some(m => m.author?.id === config.botId && m.embeds?.some(e => e.footer?.text?.endsWith(`Notice ${notice.id}`)))) return true;
      if (messages.length < 100) return false;
      const last = messages.at(-1);
      const timestamp = Date.parse(last.timestamp);
      if (!Number.isFinite(timestamp) || !/^\d{17,20}$/.test(last.id) || last.id === before) throw Error("invalid_discord_history");
      if (timestamp < notice.attemptedAt - 5000) return false;
      before = last.id;
    }
    throw Error("discord_reconciliation_incomplete");
  }
  for (const notice of notices) {
    const record = state.records[notice.key];
    if (notice.attemptedAt !== null && await alreadyDelivered(notice)) {
      record.notice = null; counters.reconciled++; await save(state); continue;
    }
    // Persist before calling Discord. A crash/timeout is reconciled from history
    // before any retry, with the same nonce and footer identity on every attempt.
    record.notice.attemptedAt ??= Date.now();
    await save(state);
    const message = await api("discord", `/channels/${config.channelId}/messages`, winMessage(notice));
    if (!/^\d{17,20}$/.test(message.id) || message.channel_id !== config.channelId || message.author?.id !== config.botId) throw Error("invalid_discord_delivery");
    record.notice = null; counters.delivered++; await save(state);
  }
  state.lastSuccessAt = Date.now(); await save(state);
  return { ...counters, durationMs: Date.now() - began };
}

async function main() {
  const env = process.env;
  const directory = env.TITANS_AFFILIATE_WINS_STATE_DIR;
  if (!directory || !resolve(directory).startsWith("/var/lib/")) throw Error("invalid_state_directory");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, "state.json");
  const load = async () => {
    try { return JSON.parse(await readFile(path, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return newWinState(); throw Error("unreadable_win_state"); }
  };
  const save = async state => {
    const temp = path + ".next";
    const handle = await open(temp, "w", 0o600);
    try { await handle.writeFile(JSON.stringify(state)); await handle.sync(); } finally { await handle.close(); }
    await rename(temp, path);
    const parent = await open(directory, "r");
    try { await parent.sync(); } finally { await parent.close(); }
  };
  const runId = randomUUID();
  try {
    const summary = await runWinPoll({ companyId: env.WHOP_COMPANY_ID, whopApiKey: env.WHOP_API_KEY, botToken: env.BOT_TOKEN, botId: env.TITANS_DISCORD_BOT_ID, channelId: env.TITANS_AFFILIATE_WINS_CHANNEL_ID, guildId: env.TITANS_DISCORD_GUILD_ID, aiPlanId: env.WHOP_AI_PLAN_ID, aiProductId: env.WHOP_AI_PRODUCT_ID, exclusivePlanId: env.WHOP_EXCLUSIVE_PLAN_ID, exclusiveProductId: env.WHOP_EXCLUSIVE_PRODUCT_ID }, { load, save });
    console.log(JSON.stringify({ event: "affiliate_wins_poll_ok", runId, ...summary }));
  } catch (error) {
    const code = /^(whop|discord|invalid|unreadable|win)_[a-z0-9_]+$/.test(error.message) ? error.message : "provider_or_storage_unavailable";
    console.error(JSON.stringify({ event: "affiliate_wins_poll_failed", runId, code })); process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await main();
