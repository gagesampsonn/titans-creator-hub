/* One owner-approved campaign deadline, shared across visitors and pages. */
(() => {
  const endsAt = Date.parse('2026-09-15T00:00:00Z'); // September 14, 8 PM Eastern.
  const timers = document.querySelectorAll('[data-ai-offer-timer]');
  if (!timers.length) return;
  let interval;
  function update() {
    const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    const pad = value => String(value).padStart(2, '0');
    const text = `${Math.floor(seconds / 86400)}d ${pad(Math.floor(seconds / 3600) % 24)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
    timers.forEach(timer => { timer.textContent = text; });
    if (seconds === 0) {
      document.querySelectorAll('.ai-offer-banner, .ai-regular-price, .ai-offer-checkout s, .ai-offer-countdown').forEach(node => { node.hidden = true; });
      document.querySelectorAll('[data-ai-offer-label]').forEach(node => { node.textContent = 'AI Creator Kit'; });
      clearInterval(interval);
    }
    return seconds > 0;
  }
  if (update()) interval = setInterval(update, 1000);
})();
