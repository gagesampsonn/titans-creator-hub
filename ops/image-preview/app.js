const el = id => document.getElementById(id);
const promptInput = el('prompt');
let state = null, submitting = false, selectedId = null, startedAt = null, historyKey = '';
function message(text, error = false) { el('form-status').textContent = text; el('form-status').classList.toggle('error', error); }
function count() { el('character-count').textContent = `${promptInput.value.length.toLocaleString()} / 4,000`; }
promptInput.addEventListener('input', count); count();
function showImage(job) {
  selectedId = job.id;
  const url = `/api/images/${job.id}`;
  if (el('result-image').getAttribute('src') !== url) el('result-image').src = url;
  el('result-image').hidden = false; el('empty-state').hidden = true; el('loading-state').hidden = true;
  el('download').href = `${url}?download=1`; el('download').hidden = false;
  el('image-stage').setAttribute('aria-busy', 'false');
  el('result-label').textContent = 'IMAGE SAVED';
  el('result-detail').textContent = '1024 × 1536 · High quality · PNG';
}
function render() {
  if (!state) return;
  const activeJob = state.jobs.find(job => job.status === 'running');
  const busy = Boolean(submitting || state.active || activeJob);
  const review = state.bridgeWarning || state.jobs.find(job => job.status === 'unknown')?.message;
  el('attempt-count').textContent = `${state.attemptsRemaining} / ${state.attemptLimit}`;
  el('generate').disabled = busy || !!review || state.attemptsRemaining === 0;
  el('generate').querySelector('span').textContent = busy ? 'Generating…' : 'Generate image';
  el('image-stage').setAttribute('aria-busy', String(busy));
  if (busy) {
    startedAt ||= activeJob?.createdAt || Date.now();
    el('loading-state').hidden = false; el('empty-state').hidden = true; el('result-image').hidden = true; el('download').hidden = true;
    el('result-label').textContent = 'GENERATING';
  } else {
    startedAt = null; el('loading-state').hidden = true;
    const completed = state.jobs.filter(job => job.status === 'succeeded');
    const chosen = completed.find(job => job.id === selectedId) || completed[0];
    if (chosen) showImage(chosen);
    else { el('empty-state').hidden = false; el('result-label').textContent = '02 / RESULT'; }
    if (review) message(review, true);
    else if (state.jobs[0]?.status === 'failed') message(state.jobs[0].message, true);
    else if (state.jobs[0]?.status === 'succeeded') message('Image saved. Download it below or create a new variation.');
    else message('Ready to generate your first image.');
    if (state.attemptsRemaining === 0 && !review) message('The five-attempt preview limit has been reached. Your saved downloads still work.');
    const key = completed.map(job => job.id).join(',');
    if (key !== historyKey) {
      historyKey = key; el('history-list').replaceChildren();
      completed.forEach((job, index) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = `View image ${completed.length - index}`;
        button.addEventListener('click', () => { showImage(job); el('result-heading').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        el('history-list').append(button);
      });
      el('history-section').hidden = completed.length < 2;
    }
  }
}
async function refresh() {
  try {
    const response = await fetch('/api/state');
    if (!response.ok) throw Error('offline');
    state = await response.json(); render();
  } catch { el('generate').disabled = true; message('The private test connection is unavailable. No automatic generation retry will be sent.', true); }
  setTimeout(refresh, state?.active || submitting ? 2500 : 5000);
}
el('generate-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (el('generate').disabled || submitting || !promptInput.reportValidity()) return;
  submitting = true; selectedId = null; startedAt = Date.now(); render(); message('Creating one high-quality image. Please keep this page open.');
  if (matchMedia('(max-width: 767px)').matches) el('result-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const response = await fetch('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), prompt: promptInput.value }) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'The request could not be started.');
    state.active = result.id;
  } catch (error) { state.bridgeWarning = error.message || 'Connection interrupted. Check the request before trying again.'; }
  finally { submitting = false; render(); }
});
setInterval(() => { if (startedAt) el('elapsed').textContent = `${Math.max(0, Math.floor((Date.now() - startedAt) / 1000))}s elapsed`; }, 1000);
el('result-image').addEventListener('error', () => message('The image preview could not load. Your saved image can still be downloaded; do not generate again to retry the download.', true));
refresh();
