import { stages, stageForTarget } from './stages.mjs';
import { installAppearanceReference } from './appearance-reference.mjs';

if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw Error('Local preview only');
const $ = id => document.getElementById(id);
const main = $('top');
const shell = document.createElement('div');
shell.className = 'wf-shell';
shell.innerHTML = `<div class="wf-topline"><a class="wf-brand" href="#motion">TITANS<span>AI WORKSPACE</span></a><span class="wf-local">Design preview</span></div>
  <header class="wf-hero"><p class="wf-eyebrow">THE TITANS WORKFLOW</p><h1>Your next video starts here.</h1><p>One stage at a time. Open a step for the instructions and tools you need.</p></header>
  <nav class="wf-nav" aria-label="Workflow stages"></nav><div class="wf-boards"></div>`;
main.prepend(shell);
const nav = shell.querySelector('.wf-nav');
const boards = shell.querySelector('.wf-boards');
const extraSections = { 'motion-reference': 'See good and bad motion references', 'character-examples': 'See character reference examples', references: 'Understand the reference rules', 'case-studies': 'Watch reference-to-result examples', publish: 'Final quality checklist' };

function disclosure(title, content) {
  const details = document.createElement('details'); details.className = 'wf-disclosure';
  const summary = document.createElement('summary'); summary.textContent = title;
  details.append(summary, content); return details;
}
for (const [index, stage] of stages.entries()) {
  const button = document.createElement('button');
  button.type = 'button'; button.id = `wf-nav-${stage.id}`; button.dataset.stage = stage.id;
  button.setAttribute('aria-controls', `wf-board-${stage.id}`); button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="wf-number">0${index + 1}</span><span>${stage.name}</span><span class="wf-arrow" aria-hidden="true">↗</span>`;
  nav.append(button);
  const panel = document.createElement('section'); panel.id = `wf-board-${stage.id}`; panel.className = 'wf-board'; panel.hidden = true;
  panel.setAttribute('aria-labelledby', `wf-title-${stage.id}`);
  panel.innerHTML = `<header class="wf-board-head"><p class="wf-eyebrow">STEP 0${index + 1} / ${stage.name.toUpperCase()}</p><h2 id="wf-title-${stage.id}" tabindex="-1">${stage.title}</h2><p>${stage.subtitle}</p></header>
    <ol class="wf-instructions">${stage.steps.map(text => `<li>${text}</li>`).join('')}</ol>
    <p class="wf-output"><span>What you’ll have</span>${stage.output}</p><div class="wf-tools"></div>`;
  const tools = panel.querySelector('.wf-tools');
  if (stage.id === 'setup') {
    // Keep the real destination and existing affiliate attribution unchanged.
    tools.append($('higgsfield-setup').querySelector('.section-action'));
  }
  if (stage.id === 'motion') {
    const recording = document.createElement('div'); recording.className = 'wf-recording';
    recording.innerHTML = '<p>Film the exact performance you want to recreate. Keep the subject clearly visible and leave room for their movement.</p><div><h3>On your phone</h3><p>Record → trim in CapCut or your editor → save the motion clip.</p></div><div><h3>On your computer</h3><p>Transfer the original clip from your phone → trim in your editor → export the motion reference.</p></div>';
    const recordDetails = disclosure('Record your own motion', recording); recordDetails.open = true; tools.append(recordDetails);
    const downloader = $('tiktokDownloader');
    const downloadDetails = disclosure('Use a TikTok or Instagram link', downloader);
    const note = document.createElement('p'); note.className = 'wf-tool-note'; note.textContent = 'Downloader layout preview. Live downloads require your signed-in Titans account; no download requests are sent here.';
    downloader.prepend(note); tools.append(downloadDetails);
  }
  for (const id of stage.sections) {
    const section = $(id); if (!section) throw Error(`Missing existing tool: ${id}`);
    tools.append(extraSections[id] ? disclosure(extraSections[id], section) : section);
  }
  const pager = document.createElement('div'); pager.className = 'wf-pager';
  if (index > 0) pager.innerHTML += `<button type="button" class="wf-back" data-stage="${stages[index - 1].id}">← ${stages[index - 1].name}</button>`;
  if (index < stages.length - 1) pager.innerHTML += `<button type="button" class="wf-next" data-stage="${stages[index + 1].id}">Next: ${stages[index + 1].name} →</button>`;
  else pager.innerHTML += '<button type="button" class="wf-next" data-stage="motion">Back to the workflow ↑</button>';
  panel.append(pager); boards.append(panel);
}

// Keep every existing form, generated prompt, upload and image job in the same DOM.
// Never re-render a tool when its workflow stage is selected.
export function selectStage(id, { focus = false, updateHash = true } = {}) {
  if (!stages.some(stage => stage.id === id)) return;
  for (const stage of stages) {
    const active = stage.id === id;
    $(`wf-board-${stage.id}`).hidden = !active;
    $(`wf-nav-${stage.id}`).setAttribute('aria-expanded', String(active));
    if (active) $(`wf-nav-${stage.id}`).setAttribute('aria-current', 'step');
    else $(`wf-nav-${stage.id}`).removeAttribute('aria-current');
    if (!active) $(`wf-board-${stage.id}`).querySelectorAll('video').forEach(video => video.pause());
  }
  if (updateHash && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  if (focus) {
    const heading = $(`wf-title-${id}`); heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
function revealTarget(id) {
  const target = $(id);
  const stage = stageForTarget(id) || stages.find(s => target?.closest(`#wf-board-${s.id}`))?.id;
  if (!stage) return false;
  selectStage(stage, { updateHash: false });
  for (let parent = target?.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
  return true;
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-stage]');
  if (button) { selectStage(button.dataset.stage, { focus: true }); return; }
  // Run before the existing image client's handoff scroll and focus listeners.
  if (event.target.closest('#flow-video')) selectStage('prompt');
  const jump = event.target.closest('[data-jump], a[href^="#"]');
  if (!jump) return;
  const hash = jump.dataset.jump || jump.getAttribute('href');
  if (!hash || hash === '#') return;
  const id = hash.slice(1);
  if (!revealTarget(id)) return;
  if (stages.some(stage => stage.id === id)) {
    event.preventDefault(); selectStage(id, { focus: true });
  }
}, true);
const restoreRoute = () => {
  const id = location.hash.slice(1);
  if (!revealTarget(id)) selectStage('motion', { updateHash: false });
};
window.addEventListener('popstate', restoreRoute);
window.addEventListener('hashchange', restoreRoute);
// Capture locally so the unchanged production form handlers never call paid download APIs.
for (const service of ['tiktok', 'instagram']) {
  $(`${service}Form`).addEventListener('submit', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    $(`${service}Status`).textContent = 'Local design preview only. Your link is kept here; open the live Prompt Builder to download it.';
  }, true);
}
restoreRoute();
installAppearanceReference();
document.body.classList.add('wf-ready');
