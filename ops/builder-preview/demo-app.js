import { createDemoSession, PACKS } from './demo-model.mjs';

if (!['127.0.0.1','localhost'].includes(location.hostname)) throw Error('Local preview only');
const $ = id => document.getElementById(id);
const markup = await fetch('/__demo/panel.html');
if (!markup.ok) throw Error('Preview unavailable');
const mount = document.createElement('div');
mount.innerHTML = await markup.text(); // Trusted, static local template, never user/provider content.
$('character-builder').append(...mount.childNodes);
const notice = document.createElement('aside'); notice.className = 'builder-demo-bar';
notice.textContent = 'LOCAL MOCK · Image generation, selfies and credit packs · No charges';
document.body.prepend(notice);
const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'btn orange'; jump.textContent = 'Create image ↓';
jump.addEventListener('click', () => $('titans-image-flow').scrollIntoView({behavior:'smooth',block:'start'}));
$('copyImagePromptBtn').after(jump);
const demo = createDemoSession();
let uploading = false, uploadUrl = null;
function clearReference() {
  if (uploadUrl) URL.revokeObjectURL(uploadUrl); uploadUrl = null;
  $('flow-reference').value = ''; $('flow-upload-image').removeAttribute('src'); $('flow-upload').hidden = true;
  document.dispatchEvent(new CustomEvent('titans:reference-change', { detail: { present: false } }));
}
function status(text, error = false) { $('flow-status').textContent = text; $('flow-status').classList.toggle('flow-error',error); }
function render() {
  const state = demo.snapshot();
  const promptLength = $('imagePromptOutput').textContent.trim().length;
  $('flow-credits').textContent = state.credits;
  $('flow-generate').disabled = state.busy || uploading || state.credits === 0 || promptLength < 10 || promptLength > 4000;
  $('flow-selfie').disabled = state.busy || state.credits === 0 || !state.original;
  $('flow-reference').disabled = state.busy || uploading;
  $('flow-remove').disabled = state.busy || uploading;
  $('flow-accessory').disabled = state.busy;
  $('flow-video').disabled = state.busy;
  $('flow-selfie-tools').hidden = !state.original;
  $('flow-next').hidden = !state.original;
  $('flow-reference-summary').textContent = state.selfie ? '2 references ready · Original @Image1 + selfie @Image2' : '1 reference ready · Original @Image1';
  for (const kind of ['original','selfie']) {
    const item = state[kind];
    $(`flow-${kind}-image`).hidden = !item;
    $(`flow-${kind}-empty`).hidden = !!item;
    $(`flow-${kind}-download`).hidden = !item;
    if (item) {
      if ($(`flow-${kind}-image`).getAttribute('src') !== item.url) $(`flow-${kind}-image`).src = item.url;
      $(`flow-${kind}-download`).href = `${item.url}?download=1`;
    }
  }
}
async function loadSample(kind) {
  const image = new Image(); image.src = `/__demo/image/${kind}`;
  await image.decode();
  await new Promise(resolve => setTimeout(resolve,1200)); // Deliberate short simulation, no API call.
}
async function generate(kind) {
  const button = $(kind === 'original' ? 'flow-generate' : 'flow-selfie');
  if (button.disabled) return;
  const label = button.textContent;
  const pending = demo.generate(kind,$('imagePromptOutput').textContent,loadSample);
  button.textContent = kind === 'selfie' ? 'Creating selfie…' : 'Generating image…';
  $('titans-image-flow').setAttribute('aria-busy','true'); render();
  status('Simulating generation. No API request or charge is being made.');
  try {
    await pending;
    status(demo.snapshot().credits === 0 ? 'No demo credits left. Buy credits to preview the packs; prompt building still works.' : 'Mock result ready. This is our saved test photo, not a new generation from your prompt.');
  } catch { status('Could not load the saved example. No demo credit was used. Keep the image preview on port 8891 running.',true); }
  finally { button.textContent = label; $('titans-image-flow').setAttribute('aria-busy','false'); render(); }
}
$('flow-generate').addEventListener('click',() => generate('original'));
$('flow-selfie').addEventListener('click',() => generate('selfie'));
$('flow-video').addEventListener('click',() => {
  const count = demo.snapshot().selfie ? 2 : 1;
  $('referenceImageCount').value = String(count);
  $('referenceImageCount').dispatchEvent(new Event('change',{bubbles:true}));
  $('prompt').scrollIntoView({behavior:'smooth',block:'start'});
  $('referenceImageCount').focus({preventScroll:true});
  status(`${count} reference${count === 1 ? '' : 's'} selected in Step 4. Download and upload the photos to Higgsfield in that order.`);
});
const dialog = $('flow-pack-dialog');
$('flow-buy').addEventListener('click',() => dialog.showModal());
$('flow-pack-close').addEventListener('click',() => dialog.close());
for (const pack of PACKS) {
  const card = document.createElement('article'); card.className = 'flow-pack';
  const title = document.createElement('strong'); title.textContent = `$${pack.price}`;
  const quantity = document.createElement('span'); quantity.textContent = `${pack.credits} photos`;
  if (pack.id === 'pack-30') { card.classList.add('flow-best'); const badge = document.createElement('small'); badge.textContent = 'Best Value'; card.append(badge); }
  const button = document.createElement('button'); button.type = 'button'; button.className = 'flow-secondary'; button.textContent = `Simulate adding ${pack.credits}`;
  button.addEventListener('click',() => { demo.addPack(pack.id); dialog.close(); render(); status(`Added ${pack.credits} demo credits. No payment was made.`); });
  card.append(title,quantity,button); $('flow-packs').append(card);
}
$('flow-reference').addEventListener('change',async () => {
  const file = $('flow-reference').files[0]; if (!file) { clearReference(); render(); return; }
  uploading = true; render(); let nextUrl;
  try {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 8*1024*1024) throw Error('invalid_file');
    nextUrl = URL.createObjectURL(file);
    const image = new Image(); image.src = nextUrl; await image.decode();
    if (image.naturalWidth > 4096 || image.naturalHeight > 4096) throw Error('dimensions');
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    uploadUrl = nextUrl; $('flow-upload-image').src = nextUrl; $('flow-upload').hidden = false;
    document.dispatchEvent(new CustomEvent('titans:reference-change', { detail: { present: true } }));
    status('Reference preview selected. It stays in this browser; mock results do not use this upload.');
  } catch {
    if(nextUrl) URL.revokeObjectURL(nextUrl);
    clearReference();
    status('Choose a valid PNG, JPG or WebP up to 8 MB and 4096 × 4096 pixels.',true);
  } finally { uploading = false; render(); }
});
$('flow-remove').addEventListener('click',() => {
  clearReference();
  status('Reference removed. The character prompt is ready to use without an upload.');
});
render();
new MutationObserver(render).observe($('imagePromptOutput'),{childList:true,characterData:true,subtree:true});
document.dispatchEvent(new CustomEvent('titans:image-panel-ready'));
if (location.hash === '#titans-image-flow') $('titans-image-flow').scrollIntoView({block:'start'});
