(() => {
  // Whop remains the attribution authority. This stores only a visitor-supplied
  // affiliate username, never identity, eligibility, or commission amounts.
  const key = "titans.referral.v1";
  const lifetime = 30 * 24 * 60 * 60 * 1000;
  const valid = value => typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value);
  const params = new URLSearchParams(window.location.search);
  const now = Date.now();
  let stored;
  try { stored = JSON.parse(window.localStorage.getItem(key)); } catch { /* Optional browser storage. */ }
  const reusable = valid(stored?.code) && Number.isFinite(stored.capturedAt) && stored.capturedAt <= now && now - stored.capturedAt < lifetime;
  let code;
  let persisted = false;
  if (params.has("a")) {
    const incoming = params.getAll("a");
    if (incoming.length === 1 && valid(incoming[0])) code = incoming[0];
    try {
      if (code) {
        const capturedAt = reusable && stored.code === code ? stored.capturedAt : now;
        window.localStorage.setItem(key, JSON.stringify({ code, capturedAt }));
        persisted = true;
      }
      else window.localStorage.removeItem(key);
    } catch { /* The current URL still works when browser storage is disabled. */ }
  } else {
    try {
      if (reusable) { code = stored.code; persisted = true; }
      else window.localStorage.removeItem(key);
    } catch { /* Corrupt or unavailable storage must not interrupt checkout. */ }
  }
  if (!code) return;
  // Documented Whop embed attribute; run before its deferred loader.
  for (const checkout of document.querySelectorAll("[data-whop-checkout-plan-id]")) {
    checkout.setAttribute("data-whop-checkout-affiliate-code", code);
  }
  for (const link of document.querySelectorAll("a[href]")) {
    const url = new URL(link.href, window.location.origin);
    const hostedCheckout = url.origin === "https://whop.com" && /^\/checkout\/plan_[A-Za-z0-9_]+\/?$/.test(url.pathname);
    // Normal internal navigation uses the original stored timestamp; do not
    // turn every product-page visit into a newly captured referral.
    const productPage = !persisted && url.origin === window.location.origin && ["/ai/", "/exclusive/"].includes(url.pathname);
    if (!url.username && !url.password && (hostedCheckout || productPage)) {
      url.searchParams.set("a", code);
      link.href = url.href;
    }
  }
})();
