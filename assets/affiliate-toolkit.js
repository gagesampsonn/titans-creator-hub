(() => {
  const types = { referenceVideos: "reference videos", hooks: "hooks", scripts: "scripts", captions: "captions", talkingPoints: "talking points" };
  function safeUrl(value, uploaded = false) {
    if (typeof value !== "string" || value.length > 2048) return null;
    try {
      const url = new URL(value, "https://titansagency.co");
      if (url.username || url.password || url.protocol !== "https:") return null;
      if (value.startsWith("/assets/") && url.origin === "https://titansagency.co" && url.pathname.startsWith("/assets/") && !value.includes("..") && !value.includes("\\")) return value;
      if (!uploaded && value.startsWith("https://")) return url.href;
    } catch { /* Invalid resources are not published. */ }
    return null;
  }
  function approved(catalog, type, product, referenceId) {
    const records = catalog?.[type];
    return Array.isArray(records) ? records.filter(item => item && item.status === "approved" && item.product === product && typeof item.id === "string" && typeof item.title === "string" && (type === "referenceVideos" ? ["uploaded", "external"].includes(item.media?.kind) && safeUrl(item.media.url, item.media.kind === "uploaded") : typeof item.text === "string" && item.text.trim()) && (referenceId === undefined || item.referenceId === referenceId)).slice(0, 50) : [];
  }
  async function load(links, copy) {
    const panels = document.querySelector("[data-toolkit-panels]");
    const tabs = [...document.querySelectorAll("[data-toolkit-tab]")];
    const selector = document.querySelector("[data-toolkit-product]");
    let catalog;
    let active = "referenceVideos";
    const referenceCards = new Map();
    const create = (tag, text, className) => {
      const element = document.createElement(tag);
      if (text) element.textContent = text;
      if (className) element.className = className;
      return element;
    };
    function linkField(parent, product) {
      const input = create("input");
      input.readOnly = true;
      input.value = links.find(link => link.product === product)?.url ?? "";
      input.setAttribute("aria-label", `Affiliate link for ${product === "ai" ? "AI Prompter" : "Titans Exclusive"}`);
      const button = create("button", "Copy link", "earn-secondary-button");
      button.type = "button";
      button.addEventListener("click", () => copy(input.value, input, button));
      const row = create("div", null, "toolkit-link-row");
      row.append(input, button);
      parent.append(row);
    }
    function textResource(item, heading = "h3") {
      const section = create("section", null, "toolkit-resource");
      section.append(create(heading, item.title));
      const text = create("p", item.text, "toolkit-copy-text");
      text.tabIndex = 0;
      const button = create("button", "Copy", "earn-secondary-button");
      button.type = "button";
      button.setAttribute("aria-label", `Copy ${item.title}`);
      button.addEventListener("click", () => copy(item.text, text, button));
      section.append(text, button);
      return section;
    }
    function reference(item) {
      const card = create("article", null, "toolkit-reference");
      card.tabIndex = -1;
      card.setAttribute("aria-label", item.title);
      referenceCards.set(item.id, card);
      card.append(create("h3", item.title));
      const source = safeUrl(item.media.url, item.media.kind === "uploaded");
      if (item.media.kind === "uploaded") {
        const video = create("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "none";
        video.src = source;
        if (safeUrl(item.thumbnail)) video.poster = safeUrl(item.thumbnail);
        card.append(video);
      } else {
        const anchor = create("a", "Watch reference video ↗", "member-text-link");
        anchor.href = source;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        if (safeUrl(item.thumbnail)) { const thumbnail = create("img"); thumbnail.src = safeUrl(item.thumbnail); thumbnail.alt = item.title; thumbnail.loading = "lazy"; anchor.prepend(thumbnail); }
        card.append(anchor);
      }
      for (const [key, label] of [["hookUsed", "Hook used"], ["notes", "Notes for affiliates"], ["cta", "CTA used"]]) if (typeof item[key] === "string" && item[key].trim()) { card.append(create("h4", label), create("p", item[key])); }
      if (Array.isArray(item.whyItWorked) && item.whyItWorked.length) {
        card.append(create("h4", "Why it worked"));
        const list = create("ul");
        for (const reason of item.whyItWorked.filter(value => typeof value === "string").slice(0, 10)) list.append(create("li", reason));
        card.append(list);
      }
      for (const type of ["hooks", "scripts", "captions", "talkingPoints"]) {
        const related = approved(catalog, type, item.product, item.id);
        if (related.length) { card.append(create("h4", `Related ${types[type]}`)); for (const resource of related) card.append(textResource(resource, "h5")); }
      }
      linkField(card, item.product);
      return card;
    }
    function render() {
      for (const video of panels.querySelectorAll("video")) video.pause();
      panels.replaceChildren();
      referenceCards.clear();
      panels.setAttribute("aria-labelledby", `toolkit-tab-${active}`);
      for (const tab of tabs) { const selected = tab.dataset.toolkitTab === active; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; }
      const records = approved(catalog, active, selector.value);
      for (const tab of tabs) tab.querySelector("[data-toolkit-count]").textContent = String(approved(catalog, tab.dataset.toolkitTab, selector.value).length);
      if (!records.length) {
        const empty = create("div", null, "toolkit-empty");
        empty.append(create("span", "＋", "toolkit-empty-icon"), create("h3", `No ${types[active]} added yet.`), create("p", "Add proven examples before publishing this resource."));
        panels.append(empty);
      } else {
        for (const item of records) {
          const card = active === "referenceVideos" ? reference(item) : textResource(item);
          if (active !== "referenceVideos") {
            const linked = approved(catalog, "referenceVideos", item.product).find(reference => reference.id === item.referenceId);
            if (linked) {
              const button = create("button", `View reference: ${linked.title}`, "member-text-link toolkit-reference-link");
              button.type = "button";
              button.addEventListener("click", () => {
                active = "referenceVideos";
                render();
                const target = referenceCards.get(linked.id);
                target?.focus({ preventScroll: true });
                target?.scrollIntoView({ block: "start" });
              });
              card.append(button);
            }
            linkField(card, item.product);
          }
          panels.append(card);
        }
      }
      document.querySelector("[data-toolkit-link]").value = links.find(link => link.product === selector.value)?.url ?? "";
    }
    try {
      const response = await fetch("/assets/affiliate-toolkit.json", { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      catalog = await response.json();
      if (catalog.schemaVersion !== 1) throw new Error("unsupported_catalog");
    } catch { panels.replaceChildren(create("p", "Creator Toolkit couldn't be loaded. Refresh to try again.")); return; }
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => { active = tab.dataset.toolkitTab; render(); });
      tab.addEventListener("keydown", event => {
        const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
        if (next !== null) { event.preventDefault(); active = tabs[next].dataset.toolkitTab; render(); tabs[next].focus(); }
      });
    });
    selector.addEventListener("change", render);
    const button = document.querySelector("[data-toolkit-copy-link]");
    button.addEventListener("click", () => { const field = document.querySelector("[data-toolkit-link]"); copy(field.value, field, button); });
    render();
  }
  window.TitansToolkit = { approved, safeUrl, load };
})();
