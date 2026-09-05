(() => {
  const library = document.querySelector("[data-member-library]");
  const products = document.querySelector("[data-member-products]");
  const loading = document.querySelector("[data-member-loading]");
  const error = document.querySelector("[data-member-error]");
  let timer;
  let banner;

  function renderOffer(member) {
    clearInterval(timer);
    banner?.remove();
    if (!member.offer) return;
    if (!document.querySelector('link[href="/assets/member.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/assets/member.css";
      document.head.append(css);
    }
    banner = document.createElement("aside");
    banner.className = `titans-upgrade${library ? "" : " upgrade-site-banner"}`;
    if (document.querySelector(".commerce-header")) banner.classList.add("upgrade-commerce-banner");
    banner.setAttribute("aria-label", "Limited-time Exclusive upgrade");
    // All markup here is static. Provider values are assigned as text below.
    banner.innerHTML = '<div><strong>Upgrade to Titans Exclusive for $10</strong><p>Get the TikTok Shop course, private Discord, and creator resources.</p><p>$10 for your first 30 days, then $50 every 30 days. Cancel before renewal.</p></div><div class="upgrade-actions"><span class="upgrade-timer" role="timer"></span><a class="upgrade-link" href="/members/upgrade/">See the upgrade</a></div>';
    const target = library ? products : document.querySelector("main");
    if (!target) return;
    if (library) target.before(banner);
    else target.prepend(banner);
    const deadline = performance.now() + Math.max(0, member.offer.expiresAt - member.serverTime);
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      banner.querySelector(".upgrade-timer").textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} left`;
      if (!seconds) { clearInterval(timer); banner.remove(); }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  function renderProducts(access) {
    for (const product of document.querySelectorAll("[data-product]")) {
      const key = product.dataset.product;
      const owned = access[key] === true;
      product.classList.toggle("is-locked", !owned);
      product.querySelector("[data-product-status]").textContent = owned
        ? (key === "ai" && access.exclusive && !access.aiPurchased ? "Included with Exclusive" : "You have access")
        : "Not included in your purchases";
      product.querySelector("[data-owned-actions]").hidden = !owned;
      const locked = product.querySelector("[data-locked-actions]");
      if (locked) locked.hidden = owned;
      if (key === "weekly") product.hidden = !owned;
    }
    products.hidden = false;
  }

  async function refresh() {
    if (error) error.hidden = true;
    if (loading) loading.hidden = false;
    try {
      const response = await fetch("/auth/whop/member", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" } });
      if (response.status === 401) {
        if (products) products.hidden = true;
        clearInterval(timer);
        banner?.remove();
        if (library) window.location.replace("/auth/whop/login?next=%2Fmembers%2F");
        return;
      }
      if (!response.ok) throw new Error("membership_unavailable");
      const { data } = await response.json();
      if (products) renderProducts(data.access);
      renderOffer(data);
      window.dispatchEvent(new CustomEvent("titans:member", { detail: data }));
    } catch {
      if (error) error.hidden = false;
      if (products) products.hidden = true;
      clearInterval(timer);
      banner?.remove();
    } finally {
      if (loading) loading.hidden = true;
    }
  }

  document.querySelector("[data-member-retry]")?.addEventListener("click", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) refresh(); });
  refresh();
})();
