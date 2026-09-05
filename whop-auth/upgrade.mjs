import { createHmac } from "node:crypto";

export class UpgradeUnavailable extends Error {}

export function createUpgradeService(config, memberService, { fetchFn = fetch, now = Date.now } = {}) {
  const pending = new Map();
  async function whop(path, options = {}) {
    const response = await fetchFn(`https://api.whop.com/api/v1${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${config.whopApiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("upgrade_provider_unavailable");
    return response.json();
  }

  async function recoverPromo(record) {
    const query = new URLSearchParams({ account_id: config.whopCompanyId, first: "100",
      created_after: new Date(record.startedAt - 60_000).toISOString() });
    query.append("plan_ids[]", config.exclusivePlanId);
    for (let page = 0; page < 10; page++) {
      const result = await whop(`/promo_codes?${query}`);
      const match = result.data?.find(promo => promo.code === record.promoCode);
      if (match) return match;
      if (!result.page_info?.has_next_page) return null;
      if (!result.page_info.end_cursor) throw new Error("invalid_promo_pagination");
      query.set("after", result.page_info.end_cursor);
    }
    throw new Error("promo_recovery_incomplete");
  }

  async function createCheckout(userId) {
    const member = await memberService.getMember(userId);
    if (!member.offer) throw new UpgradeUnavailable("offer_expired_or_ineligible");
    const expiresAt = member.offer.expiresAt;
    const plan = await whop(`/plans/${config.exclusivePlanId}`);
    if (plan.product?.id !== config.exclusiveProductId || plan.plan_type !== "renewal" ||
        plan.currency !== "usd" || plan.initial_price !== 0 || plan.renewal_price !== 50 ||
        plan.billing_period !== 30 || (plan.trial_period_days ?? 0) !== 0) {
      throw new Error("upgrade_plan_terms_changed");
    }
    const record = memberService.readRecord(userId);
    let promo;
    if (record.promoId) {
      promo = await whop(`/promo_codes/${record.promoId}`);
    } else {
      // Reuse a deterministic code after a timeout or process restart. Never
      // issue another discount just because a checkout button was clicked twice.
      if (record.promoCode) promo = await recoverPromo(record);
      if (!promo) {
        if (expiresAt <= now()) throw new UpgradeUnavailable("offer_expired_or_ineligible");
        record.promoCode ??= "titans10" + createHmac("sha256", config.whopSessionSecret)
          .update(`${userId}:${record.startedAt}`).digest("hex").slice(0, 24);
        memberService.saveRecord(userId, record);
        promo = await whop("/promo_codes", {
          method: "POST",
          body: JSON.stringify({ account_id: config.whopCompanyId, code: record.promoCode,
            amount_off: 40, base_currency: "usd", promo_type: "flat_amount", promo_duration_months: 1,
            new_users_only: false, one_per_customer: true, stock: 1, unlimited_stock: false,
            product_id: config.exclusiveProductId, plan_ids: [config.exclusivePlanId],
            expires_at: new Date(expiresAt).toISOString() }),
        });
      }
      if (!/^promo_[A-Za-z0-9]+$/.test(promo.id ?? "")) throw new Error("invalid_upgrade_promo");
      record.promoId = promo.id;
      memberService.saveRecord(userId, record);
    }
    if (expiresAt <= now() || promo.uses > 0 || promo.status !== "active") {
      throw new UpgradeUnavailable("offer_expired_or_ineligible");
    }
    if (promo.code !== record.promoCode || promo.amount_off !== 40 || promo.duration !== "once" ||
        promo.stock !== 1 || promo.unlimited_stock !== false ||
        Date.parse(promo.expires_at) !== expiresAt) throw new Error("invalid_upgrade_promo");
    const checkout = new URL(`https://whop.com/checkout/${config.exclusivePlanId}/`);
    checkout.searchParams.set("promoCode", promo.code);
    return { checkoutUrl: checkout.href, expiresAt };
  }

  return {
    async createCheckout(userId) {
      if (pending.has(userId)) return pending.get(userId);
      const request = createCheckout(userId);
      pending.set(userId, request);
      try { return await request; } finally { pending.delete(userId); }
    },
  };
}
