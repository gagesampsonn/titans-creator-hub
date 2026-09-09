/* Visual preview only. Live offers must be verified and enforced by checkout. */
(() => {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname) || !['/ai/', '/ai/index.html'].includes(location.pathname)) return;
  const header = document.querySelector('.commerce-header');
  if (!header) return;
  const duration = 10 * 60 * 1000;
  const key = 'titans.ai-promotion.design-preview.ends-at.v1';
  const now = Date.now();
  let endsAt;
  try {
    const saved = localStorage.getItem(key);
    endsAt = saved === null ? now + duration : Number(saved);
    if (!Number.isFinite(endsAt) || endsAt <= now || endsAt > now + duration) return;
    if (saved === null) localStorage.setItem(key, String(endsAt));
  } catch { return; }
  const banner = document.createElement('a');
  banner.className = 'ai-promotion';
  banner.href = '#checkout';
  banner.innerHTML = '<span class="ai-promotion-product">AI Prompter + Guide <s aria-label="Regular price $45">$45</s> <strong>$29.99</strong></span><span class="ai-promotion-time">Promotion preview <span role="timer" aria-label="Time remaining" class="ai-promotion-clock"></span></span>';
  const timer = banner.querySelector('.ai-promotion-clock');
  let interval;
  const update = () => {
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (!remaining) { banner.hidden = true; clearInterval(interval); return; }
    timer.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  };
  update();
  header.prepend(banner);
  interval = setInterval(update, 1000);
})();
