(() => {
  const content = document.querySelector("[data-affiliate-content]");
  const loading = document.querySelector("[data-affiliate-loading]");
  const denied = document.querySelector("[data-affiliate-denied]");
  const error = document.querySelector("[data-affiliate-error]");
  const status = document.querySelector("[data-affiliate-status]");
  let links = new Map();
  const copyStates = new WeakMap();
  let visibleFailure;

  function showFailure(message, button) {
    visibleFailure?.remove();
    status.textContent = message;
    const anchor = button?.closest?.(".earn-link-actions, .toolkit-link-row, .toolkit-resource, .earn-milestone, .activity-empty");
    if (anchor) {
      status.classList?.add("member-sr-only");
      visibleFailure = document.createElement("p");
      visibleFailure.className = "earn-inline-error";
      visibleFailure.textContent = message;
      anchor.after(visibleFailure);
    } else status.classList?.remove("member-sr-only");
  }

  async function copy(text, field, button) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied to clipboard.";
      visibleFailure?.remove();
      status.classList?.add("member-sr-only");
      if (button) {
        const previous = copyStates.get(button);
        clearTimeout(previous?.timer);
        const label = previous?.label ?? button.textContent;
        button.textContent = "✓ Copied!";
        button.classList?.add("is-copied");
        const timer = setTimeout(() => { button.textContent = label; button.classList?.remove("is-copied"); copyStates.delete(button); }, 1800);
        copyStates.set(button, { label, timer });
      }
    } catch {
      field?.focus?.();
      field?.select?.();
      showFailure("Copy wasn't available. Select the text and copy it manually.", button);
    }
  }

  for (const button of document.querySelectorAll("[data-copy-link]")) {
    button.addEventListener("click", () => {
      const product = button.dataset.copyLink;
      if (links.has(product)) return copy(links.get(product), document.querySelector(`[data-link="${product}"]`), button);
    });
  }
  for (const button of document.querySelectorAll("[data-share-link]")) {
    button.addEventListener("click", async () => {
      const product = button.dataset.shareLink;
      const url = links.get(product);
      if (!url) return;
      if (!navigator.share) { await copy(url, document.querySelector(`[data-link="${product}"]`), button); return; }
      try {
        await navigator.share({ title: product === "ai" ? "Titans AI Prompter + Guide" : "Titans Exclusive", url });
        status.textContent = "Share options opened.";
      } catch (failure) {
        if (failure.name !== "AbortError") showFailure("Sharing wasn't available. Use Copy link instead.", button);
      }
    });
  }

  async function load() {
    links = new Map();
    content.hidden = true;
    denied.hidden = true;
    error.hidden = true;
    loading.hidden = false;
    try {
      const response = await fetch("/auth/whop/affiliates", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "X-Titans-Affiliate": "1" } });
      if ([401, 403].includes(response.status)) {
        const result = await response.json();
        const special = ["affiliate_custom_agreement", "affiliate_inactive"].includes(result.error);
        document.querySelector("[data-affiliate-denied-title]").textContent = special ? "Your affiliate account needs a review." : "Earn is for Titans customers.";
        document.querySelector("[data-affiliate-denied-copy]").textContent = special ? "Your existing Whop affiliate settings have been preserved. Contact Titans before using this program." : "Sign in with an account that owns AI Prompter + Guide or has active Titans Exclusive access.";
        denied.hidden = false; return;
      }
      if (!response.ok) throw new Error("unavailable");
      const { data } = await response.json();
      const preview = data?.preview === true;
      if (preview && !["127.0.0.1", "localhost"].includes(window.location.hostname)) throw new Error("preview_only");
      if (!preview && data?.preview !== false) throw new Error("invalid_response");
      if (!Array.isArray(data.links) || data.links.length !== 2) throw new Error("invalid_links");
      for (const product of ["ai", "exclusive"]) {
        const link = data.links.find(item => item.product === product);
        const url = new URL(link?.url);
        const validDestination = preview ? url.origin === "https://titans.example" && url.pathname === `/${product}/` : url.origin === "https://whop.com" && /^\/checkout\/plan_[A-Za-z0-9_]+\/?$/.test(url.pathname) && !!url.searchParams.get("a");
        if (!validDestination || url.username || url.password || link.commissionPercent !== 30 || link.payments !== "first_payment") throw new Error("invalid_link");
        links.set(product, url.href);
      }
      for (const [product, url] of links) document.querySelector(`[data-link="${product}"]`).value = url;
      document.querySelector("[data-affiliate-preview]").hidden = !preview;
      if (!window.TitansAffiliateDashboard?.render || !window.TitansToolkit?.load) throw Error("affiliate_components_unavailable");
      window.TitansAffiliateDashboard.render(data);
      await window.TitansToolkit.load(data.links, copy);
      content.hidden = false;
    } catch { links = new Map(); error.hidden = false; }
    finally { loading.hidden = true; }
  }
  document.querySelector("[data-affiliate-retry]").addEventListener("click", load);
  load();
})();
