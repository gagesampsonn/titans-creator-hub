import { createHash } from "node:crypto";

export const newWinState = () => ({ version: 1, records: {}, lastSuccessAt: null });
const identity = item => `${item.affiliateId}:${item.userId}:${item.planId}`;
const dollars = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const plainName = name => String(name).replace(/[@*_`~<>\[\]\\\r\n]/g, "").slice(0, 80).trim() || "A Titans affiliate";

export function planWins(state, items, now) {
  const notices = [], seen = new Set();
  for (const item of items) {
    if (!/^affov_[A-Za-z0-9_]+$/.test(item.key) || !Number.isSafeInteger(item.totalCents) || item.totalCents < 0 || seen.has(item.key)) throw Error("invalid_win_snapshot");
    seen.add(item.key);
    let record = state.records[item.key];
    if (!record || record.identity !== identity(item)) {
      state.records[item.key] = { identity: identity(item), totalCents: item.totalCents, sequence: 0, notice: null };
      continue;
    }
    if (item.totalCents < record.totalCents) {
      record.totalCents = item.totalCents;
      record.notice = null;
      continue;
    }
    if (!record.notice && item.totalCents > record.totalCents) {
      record.sequence++;
      const id = createHash("sha256").update(`${item.key}:${record.identity}:${record.sequence}:${now}`).digest("hex").slice(0, 24);
      record.notice = { id, deltaCents: item.totalCents - record.totalCents, totalCents: item.totalCents, createdAt: now, attemptedAt: null };
      record.totalCents = item.totalCents;
    }
    if (record.notice) notices.push({ ...item, ...record.notice });
  }
  for (const key of Object.keys(state.records)) if (!seen.has(key)) delete state.records[key];
  return notices;
}

export function validateDiscordIdentity(identity) {
  if (!identity || typeof identity.userId !== "string" || !/^\d{17,20}$/.test(identity.userId) ||
      typeof identity.username !== "string" || !/^[a-z0-9_.]{2,32}$/.test(identity.username)) throw Error("invalid_discord_identity");
}

export function winMessage(notice, discordIdentity = null) {
  if (discordIdentity) validateDiscordIdentity(discordIdentity);
  return {
    ...(discordIdentity ? { content: `<@${discordIdentity.userId}> earned with Titans.` } : {}),
    allowed_mentions: discordIdentity ? { parse: [], users: [discordIdentity.userId] } : { parse: [] }, nonce: notice.id, enforce_nonce: true,
    embeds: [{ color: 3066993,
      author: { name: `${discordIdentity?.username ?? plainName(notice.name || notice.username)} earned with Titans`, icon_url: "https://titansagency.co/assets/icon.png" },
      title: `+${dollars(notice.deltaCents)} REFERRAL EARNINGS`,
      description: "Whop-reported earnings increased since the last check. This update may include multiple referrals or adjustments.",
      thumbnail: { url: "https://titansagency.co/assets/icon.png" },
      fields: [{ name: "Product", value: notice.product, inline: true }, { name: "Earnings increase", value: dollars(notice.deltaCents), inline: true }, { name: "Product earnings", value: dollars(notice.totalCents), inline: true }],
      footer: { text: `Titans Affiliate Center | Not a payout | Notice ${notice.id}` },
      timestamp: new Date(notice.createdAt).toISOString(),
    }],
    components: [{ type: 1, components: [{ type: 2, style: 5, label: "Open Affiliate Center", url: "https://titansagency.co/members/earn/" }] }],
  };
}
