// Native Whop standard affiliates. No local attribution, payout or earnings ledger.
export class AffiliateUnavailable extends Error {}
const number = value => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
function decimal(value) {
  if (typeof value !== "string") return number(value);
  if (/^\d+(\.\d+)?$/.test(value)) return number(Number(value));
  // Whop returns USD totals such as "$0.00" and "$1,234.56".
  if (/^\$(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/.test(value)) return number(Number(value.slice(1).replaceAll(",", "")));
  return null;
}

export function createAffiliateService(config, memberService, { fetchFn = fetch } = {}) {
  const pending = new Map();
  async function whop(path, body) {
    const response = await fetchFn(`https://api.whop.com/api/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${config.whopApiKey}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000), redirect: "error",
    });
    if (!response.ok) throw new Error("affiliate_provider_unavailable");
    return response.json();
  }
  async function listOverrides(id) {
    const query = new URLSearchParams({ first: "100" });
    const records = [];
    for (let page = 0; page < 10; page++) {
      const result = await whop(`/affiliates/${id}/overrides?${query}`);
      if (!Array.isArray(result.data) || typeof result.page_info?.has_next_page !== "boolean") throw Error("invalid_affiliate_response");
      records.push(...result.data);
      if (!result.page_info.has_next_page) return records;
      if (typeof result.page_info.end_cursor !== "string" || !result.page_info.end_cursor) throw Error("invalid_affiliate_pagination");
      query.set("after", result.page_info.end_cursor);
    }
    throw Error("affiliate_pagination_incomplete");
  }
  function validTerms(record) {
    return record.override_type === "standard" && record.commission_type === "percentage" && record.commission_value === 30 && record.applies_to_payments === "first_payment";
  }
  function referralUrl(record, username) {
    const url = new URL(record.checkout_direct_link);
    if (url.origin !== "https://whop.com" || url.username || url.password || ![ `/checkout/${record.plan_id}`, `/checkout/${record.plan_id}/` ].includes(url.pathname) || url.searchParams.getAll("a").length !== 1 || url.searchParams.get("a") !== username) throw Error("invalid_affiliate_link");
    return url.href;
  }
  function price(plan) {
    // Trial, changed pricing shape, or unknown currency => no advertised estimate.
    if (!/^[a-z]{3}$/.test(plan.currency) || (plan.trial_period_days ?? 0) !== 0) return null;
    const amount = plan.plan_type === "one_time" ? number(plan.initial_price) : plan.plan_type === "renewal" ? (number(plan.initial_price) > 0 ? number(plan.initial_price) : plan.initial_price === 0 ? number(plan.renewal_price) : null) : null;
    return amount === null ? null : { amount, currency: plan.currency.toUpperCase() };
  }
  async function connectMember(userId) {
    if (!config.affiliateEnabled) throw new AffiliateUnavailable("affiliate_disabled");
    if (!/^user_[A-Za-z0-9_]+$/.test(userId)) throw new AffiliateUnavailable("affiliate_ineligible");
    const { access } = await memberService.getMember(userId);
    if (!access.aiPurchased && !access.exclusive) throw new AffiliateUnavailable("affiliate_ineligible");
    const products = [ { product: "ai", planId: config.aiPlanId, productId: config.aiProductId }, { product: "exclusive", planId: config.exclusivePlanId, productId: config.exclusiveProductId } ];
    if (!/^biz_[A-Za-z0-9_]+$/.test(config.whopCompanyId) || products.some(p => !/^plan_[A-Za-z0-9_]+$/.test(p.planId))) throw Error("invalid_affiliate_configuration");
    const plans = await Promise.all(products.map(p => whop(`/plans/${p.planId}`)));
    for (const [index, plan] of plans.entries()) if (plan.id !== products[index].planId || plan.product?.id !== products[index].productId) throw Error("affiliate_plan_changed");
    // Whop documents this operation as create-or-find for this exact company/user.
    const affiliate = await whop("/affiliates", { account_id: config.whopCompanyId, user_identifier: userId });
    if (!/^aff_[A-Za-z0-9_]+$/.test(affiliate.id) || affiliate.user?.id !== userId || affiliate.company?.id !== config.whopCompanyId) throw Error("affiliate_owner_mismatch");
    if (affiliate.status !== "active") throw new AffiliateUnavailable("affiliate_inactive");
    if (typeof affiliate.user.username !== "string" || !affiliate.user.username) throw Error("affiliate_username_unavailable");
    const overrides = await listOverrides(affiliate.id);
    // Inspect both plans before writing either; special arrangements need review,
    // never replacement or automatic stacking with a native revenue-share deal.
    if (overrides.some(o => o.override_type === "rev_share" && (o.applies_to_products !== "single_product" || !o.product_id || products.some(p => p.productId === o.product_id)))) throw new AffiliateUnavailable("affiliate_custom_agreement");
    for (const product of products) {
      const existing = overrides.filter(o => o.plan_id === product.planId);
      if (existing.length > 1 || existing.some(o => !validTerms(o))) throw new AffiliateUnavailable("affiliate_custom_agreement");
    }
    const links = [];
    for (const [index, product] of products.entries()) {
      let override = overrides.find(o => o.plan_id === product.planId);
      if (!override) override = await whop(`/affiliates/${affiliate.id}/overrides`, { id: affiliate.id, override_type: "standard", plan_id: product.planId, commission_type: "percentage", commission_value: 30, applies_to_payments: "first_payment" });
      if (override.plan_id !== product.planId || !validTerms(override)) throw Error("affiliate_terms_not_confirmed");
      links.push({ product: product.product, url: referralUrl(override, affiliate.user.username), commissionPercent: override.commission_value, payments: override.applies_to_payments, price: price(plans[index]) });
    }
    return { preview: false, links, metrics: {
      // Company-wide native referral totals, not site-only or independently counted.
      totalEarnedUsd: decimal(affiliate.total_referral_earnings_usd),
      sales: Number.isSafeInteger(affiliate.total_referrals_count) ? number(affiliate.total_referrals_count) : null,
      clicks: null, conversionRate: null, pendingUsd: null, paidUsd: null,
    }, referrals: null };
  }
  function connect(userId) {
    if (pending.has(userId)) return pending.get(userId);
    const operation = connectMember(userId).finally(() => pending.delete(userId));
    pending.set(userId, operation);
    return operation;
  }
  return { connect };
}
