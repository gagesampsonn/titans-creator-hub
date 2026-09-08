// Member-only image workflow. All balances, eligibility and prices come from the backend.
const $ = id => document.getElementById(id);
const imagePath = /^\/image-api\/images\/[a-f0-9-]{36}$/;
const messages = {
  credits_exhausted: 'No photo credits remaining. You can still build and copy prompts.',
  request_in_progress: 'Your previous image is still being processed. Please wait.',
  capacity_limit: 'Image generation is busy. Please try again shortly.',
  spend_limit: 'Image generation is temporarily paused. Your credits are safe.',
  generation_paused: 'Image generation is temporarily paused. Prompt building is still available.',
  storage_capacity: 'Image storage is temporarily full. Your credit has not been used.',
  invalid_reference: 'Use one PNG, JPG or WebP, up to 8 MB and 4096 × 4096 pixels.',
  invalid_prompt: 'Use a finished prompt between 10 and 4,000 UTF-8 bytes.',
  credit_sales_paused: 'Additional credit purchases are not enabled yet.',
  access_required: 'Your Whop account needs eligible AI access.',
  authentication_required: 'Please sign in to Titans again.',
};
async function api(path, body) {
  const response = await fetch(path, { method: body ? 'POST' : 'GET', credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json', 'x-titans-images': '1' } : {},
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(35000) });
  const result = await response.json();
  if (!response.ok) {
    const error = Error(result.error || 'unavailable');
    error.confirmed = response.status < 500 || ['generation_paused','spend_limit','storage_capacity'].includes(result.error);
    throw error;
  }
  return result.data;
}
async function initialize() {
  let state;
  try { state = await api('/image-api/state'); } catch { return; } // Feature-off leaves the existing builder intact.
  const template = await fetch('/assets/image-builder-panel.html', { credentials: 'same-origin' });
  if (!template.ok || !$('character-builder')) return;
  const mount = document.createElement('template');
  mount.innerHTML = await template.text(); // First-party static template; never prompt or provider output.
  $('character-builder').append(mount.content);
  const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'btn orange'; jump.textContent = 'Create image ↓';
  jump.addEventListener('click', () => $('titans-image-flow').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('copyImagePromptBtn').after(jump);
  let busy = false, reference = null, uploadUrl = null, poll = null, original = null, selfie = null, submissionError = null;
  function status(message, error = false) {
    $('flow-status').textContent = message; $('flow-status').classList.toggle('flow-error', error);
  }
  function render() {
    const jobs = Array.isArray(state.jobs) ? state.jobs : [];
    if (submissionError && jobs.some(job => job.id === submissionError.id)) submissionError = null;
    const active = jobs.some(job => ['reserved','running','unknown'].includes(job.state));
    original = jobs.find(job => job.kind === 'original' && job.state === 'succeeded' && imagePath.test(job.imageUrl)) ?? null;
    selfie = jobs.find(job => job.kind === 'selfie' && job.state === 'succeeded' && job.sourceId === original?.id && imagePath.test(job.imageUrl)) ?? null;
    const promptSize = new TextEncoder().encode($('imagePromptOutput').textContent.trim()).length;
    $('flow-credits').textContent = Number.isSafeInteger(state.credits) ? state.credits : 0;
    const disabled = busy || active || submissionError?.uncertain || !state.generationEnabled || state.credits < 1 || !$('flow-consent').checked;
    $('flow-generate').disabled = disabled || promptSize < 10 || promptSize > 4000;
    $('flow-selfie').disabled = disabled || !original;
    $('flow-reference').disabled = busy || active;
    $('flow-remove').disabled = busy || active;
    $('flow-accessory').disabled = busy || active;
    $('flow-selfie-tools').hidden = !original;
    $('flow-next').hidden = !original;
    $('flow-reference-summary').textContent = selfie ? '2 references ready · Original @Image1 + selfie @Image2' : '1 reference ready · Original @Image1';
    for (const [kind, item] of [['original', original], ['selfie', selfie]]) {
      $(`flow-${kind}-image`).hidden = !item;
      $(`flow-${kind}-empty`).hidden = Boolean(item);
      $(`flow-${kind}-download`).hidden = !item;
      if (item) {
        if ($(`flow-${kind}-image`).getAttribute('src') !== item.imageUrl) $(`flow-${kind}-image`).src = item.imageUrl;
        $(`flow-${kind}-download`).href = `${item.imageUrl}?download=1`;
      }
    }
    if (jobs.some(job => job.state === 'unknown')) status('This request needs a result check. Its credit is reserved, not spent. Contact Titans support; do not retry.', true);
    else if (active) status('Creating your photo. This can take a few minutes; you can leave this page and return.');
    else if (!state.generationEnabled) status(messages.generation_paused, true);
    else if (state.credits === 0) status(messages.credits_exhausted);
    else if (!busy && jobs[0]?.state === 'failed') status('The last photo could not be completed. Its credit was released. You can try a new request.', true);
    else if (!busy && jobs[0]?.state === 'succeeded') status('Your photo is ready. Downloads are free; creating another photo uses one credit.');
    if (submissionError) status(submissionError.message, true);
    clearTimeout(poll);
    if (active) poll = setTimeout(refresh, 5000);
  }
  async function refresh() {
    try { state = await api('/image-api/state'); render(); }
    catch { status('Unable to check this request yet. Do not submit another image; refresh to check its status.', true); }
  }
  async function generate(kind) {
    if ($(kind === 'selfie' ? 'flow-selfie' : 'flow-generate').disabled) return;
    busy = true; submissionError = null; render(); status('Submitting your photo request…');
    const request = { id: crypto.randomUUID(), kind, consent: 'images-v1' };
    if (kind === 'selfie') { request.sourceId = original.id; request.accessory = $('flow-accessory').value; }
    else { request.prompt = $('imagePromptOutput').textContent.trim(); if (reference) request.reference = reference; }
    try {
      await api('/image-api/generations', request);
      status('Request accepted. One credit is reserved until the photo is saved.');
    } catch (error) {
      submissionError = { id: request.id, uncertain: !error.confirmed,
        message: messages[error.message] || 'The request could not be confirmed. Refresh to check its status before another attempt.' };
      status(submissionError.message, true);
    }
    finally { busy = false; await refresh(); }
  }
  $('flow-generate').addEventListener('click', () => generate('original'));
  $('flow-selfie').addEventListener('click', () => generate('selfie'));
  $('flow-consent').addEventListener('change', render);
  new MutationObserver(render).observe($('imagePromptOutput'), { childList: true, subtree: true, characterData: true });
  $('flow-reference').addEventListener('change', async () => {
    const file = $('flow-reference').files[0]; reference = null;
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    $('flow-upload').hidden = true;
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      $('flow-reference').value = ''; status(messages.invalid_reference, true); return;
    }
    busy = true; render();
    try {
      reference = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file);
      });
      uploadUrl = URL.createObjectURL(file); $('flow-upload-image').src = uploadUrl; $('flow-upload').hidden = false;
    } catch { reference = null; status(messages.invalid_reference, true); }
    finally { busy = false; render(); }
  });
  $('flow-remove').addEventListener('click', () => {
    reference = null; $('flow-reference').value = ''; $('flow-upload').hidden = true;
    if (uploadUrl) URL.revokeObjectURL(uploadUrl); uploadUrl = null;
  });
  $('flow-video').addEventListener('click', () => {
    const count = $('referenceImageCount');
    if (count) { count.value = selfie ? '2' : '1'; count.dispatchEvent(new Event('change', { bubbles: true })); }
    $('prompt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    count?.focus({ preventScroll: true });
  });
  $('flow-buy').addEventListener('click', () => $('flow-pack-dialog').showModal());
  $('flow-pack-close').addEventListener('click', () => $('flow-pack-dialog').close());
  const packs = state.packs ?? [];
  for (const pack of packs) {
    if (!Number.isSafeInteger(pack.priceCents) || !Number.isSafeInteger(pack.credits)) continue;
    const card = document.createElement('div'); card.className = `flow-pack${pack.bestValue ? ' flow-best' : ''}`;
    if (pack.bestValue) { const badge = document.createElement('small'); badge.textContent = 'Best Value'; card.append(badge); }
    const price = document.createElement('strong'); price.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(pack.priceCents / 100);
    const count = document.createElement('span'); count.textContent = `${pack.credits} photos`;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'flow-primary';
    button.textContent = state.salesEnabled ? 'Buy credits' : 'Not available yet'; button.disabled = !state.salesEnabled;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const checkout = await api('/image-api/checkout', { id: crypto.randomUUID(), packId: pack.id });
        const url = new URL(checkout.checkoutUrl);
        if (url.origin !== 'https://whop.com' || !url.pathname.startsWith('/checkout/')) throw Error('invalid_checkout');
        location.assign(url.href);
      } catch (error) { status(messages[error.message] || 'Checkout is unavailable. No credits have been added.', true); button.disabled = !state.salesEnabled; }
    });
    card.append(price, count, button); $('flow-packs').append(card);
  }
  $('flow-sales-note').hidden = Boolean(state.salesEnabled);
  render();
}
initialize().catch(() => { /* Existing prompt building remains usable if images cannot load. */ });
