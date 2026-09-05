(() => {
  const validNumber = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const money = (amount, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  function milestone(sales) {
    if (!Number.isSafeInteger(sales) || sales < 0) return null;
    const target = [1, 5, 10, 25, 50, 100].find(value => value > sales) ?? (Math.floor(sales / 100) + 1) * 100;
    return { sales, target, remaining: target - sales };
  }
  function estimate(link) {
    if (!validNumber(link?.price?.amount) || !/^[A-Z]{3}$/.test(link.price.currency) || !validNumber(link.commissionPercent) || link.commissionPercent > 100 || link.payments !== "first_payment") return null;
    try { return money(link.price.amount * link.commissionPercent / 100, link.price.currency); } catch { return null; }
  }
  function render(data) {
    const set = (selector, text) => { document.querySelector(selector).textContent = text; };
    const metrics = data.metrics;
    const display = (key, format) => validNumber(metrics?.[key]) ? format(metrics[key]) : data.preview ? format(0) : "Not available";
    set('[data-stat="earned"]', display("totalEarnedUsd", money));
    set('[data-stat="sales"]', display("sales", String));
    set('[data-stat="clicks"]', display("clicks", String));
    set('[data-stat="conversion"]', display("conversionRate", value => `${value}%`));
    set('[data-stat="pending"]', display("pendingUsd", money));
    set('[data-stat="paid"]', display("paidUsd", money));
    for (const stat of document.querySelectorAll("[data-stat]")) stat.classList.toggle("stat-unavailable", stat.textContent === "Not available");
    const goal = milestone(metrics?.sales ?? (data.preview ? 0 : null));
    document.querySelector("[data-milestone]").hidden = !goal;
    if (goal) {
      set("[data-milestone-title]", goal.sales === 0 ? "Your first referral" : `Next milestone: ${goal.target} sales`);
      set("[data-milestone-remaining]", `${goal.remaining} ${goal.remaining === 1 ? "sale" : "sales"} away`);
      set("[data-milestone-count]", `${goal.sales} / ${goal.target} sales`);
      const progress = document.querySelector("[data-milestone-progress]");
      progress.max = goal.target;
      progress.value = goal.sales;
      const achieved = document.querySelector("[data-milestone-achieved]");
      achieved.hidden = data.preview || goal.sales === 0;
      achieved.textContent = goal.sales > 0 ? "First referral achieved" : "";
    }
    for (const link of data.links) {
      const example = document.querySelector(`[data-commission-example="${link.product}"]`);
      const amount = estimate(link);
      example.hidden = !amount;
      example.textContent = amount ? `Earn approximately ${amount} per full-price sale. Discounts and final commission terms can change this amount.` : "";
    }
    // Activity remains empty unless a future Whop adapter provides actual rows.
    const activity = document.querySelector("[data-activity-list]");
    activity.replaceChildren();
    const rows = Array.isArray(data.referrals) ? data.referrals.filter(row => ["ai", "exclusive"].includes(row.product) && validNumber(row.commissionUsd) && ["earned", "pending", "paid", "reversed"].includes(row.status)).slice(0, 20) : [];
    for (const row of rows) {
      const item = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = `${row.product === "ai" ? "AI Prompter" : "Titans Exclusive"} referral`;
      const detail = document.createElement("strong");
      detail.className = `activity-${row.status}`;
      detail.textContent = `${row.status === "reversed" ? "−" : "+"}${money(row.commissionUsd)} · Commission ${row.status}`;
      item.append(title, detail);
      activity.append(item);
    }
    document.querySelector("[data-activity-empty]").hidden = rows.length > 0;
    document.querySelector("[data-activity-empty-title]").textContent = !data.preview && metrics?.sales !== 0 ? "Your referral activity lives in Whop." : "Your first commission starts with one share.";
    activity.hidden = rows.length === 0;
  }
  window.TitansAffiliateDashboard = { milestone, estimate, render };
})();
