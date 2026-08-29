(() => {
  const menuButton = document.querySelector("[data-menu-button]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");

  const closeMenu = () => {
    if (!menuButton || !mobilePanel) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    mobilePanel.dataset.open = "false";
    mobilePanel.hidden = true;
  };

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Open navigation" : "Close navigation",
      );
      mobilePanel.dataset.open = String(!isOpen);
      mobilePanel.hidden = isOpen;
    });

    mobilePanel
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-cta]").forEach((link) => {
    link.addEventListener("click", () => {
      const detail = {
        product: link.dataset.product || "unknown",
        placement: link.dataset.placement || "unknown",
      };
      window.dispatchEvent(new CustomEvent("titans:cta", { detail }));
      if (typeof window.gtag === "function") {
        window.gtag("event", "select_product", detail);
      }
    });
  });
})();
