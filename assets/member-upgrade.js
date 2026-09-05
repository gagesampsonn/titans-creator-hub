(() => {
  const loading = document.querySelector("[data-upgrade-loading]");
  const details = document.querySelector("[data-upgrade-details]");
  const unavailable = document.querySelector("[data-upgrade-unavailable]");
  const error = document.querySelector("[data-upgrade-error]");
  const button = document.querySelector("[data-upgrade-checkout]");
  const clock = document.querySelector("[data-upgrade-timer]");
  let csrf;
  let deadline = 0;
  let timer;

  function expire() {
    clearInterval(timer);
    details.hidden = true;
    error.hidden = true;
    unavailable.hidden = false;
    button.disabled = true;
    csrf = null;
  }

  async function load() {
    clearInterval(timer);
    error.hidden = true;
    details.hidden = true;
    loading.hidden = false;
    try {
      const response = await fetch("/auth/whop/member", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" } });
      if (response.status === 401) {
        window.location.replace("/auth/whop/login?next=%2Fmembers%2Fupgrade%2F");
        return;
      }
      if (!response.ok) throw new Error("unavailable");
      const { data } = await response.json();
      if (!data.offer) { expire(); return; }
      csrf = data.upgradeCsrf;
      deadline = performance.now() + Math.max(0, data.offer.expiresAt - data.serverTime);
      details.hidden = false;
      unavailable.hidden = true;
      button.disabled = false;
      const tick = () => {
        const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
        clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        if (!seconds) expire();
      };
      tick();
      timer = setInterval(tick, 1000);
    } catch { error.hidden = false; }
    finally { loading.hidden = true; }
  }

  button.addEventListener("click", async () => {
    if (!csrf || performance.now() >= deadline) { expire(); return; }
    button.disabled = true;
    error.hidden = true;
    try {
      const response = await fetch("/auth/whop/upgrade", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrf, Accept: "application/json" } });
      if (response.status === 401) { await load(); return; }
      if (response.status === 403) { expire(); return; }
      if (!response.ok) throw new Error("checkout_unavailable");
      const { data } = await response.json();
      const destination = new URL(data.checkoutUrl);
      if (destination.origin !== "https://whop.com" || !destination.pathname.startsWith("/checkout/")) throw new Error("invalid_checkout");
      window.location.assign(destination.href);
    } catch {
      error.hidden = false;
      if (performance.now() < deadline) button.disabled = false;
    }
  });
  document.querySelector("[data-upgrade-retry]").addEventListener("click", load);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  window.addEventListener("pageshow", event => { if (event.persisted) load(); });
  load();
})();
