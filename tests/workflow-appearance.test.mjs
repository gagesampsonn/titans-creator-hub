import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAppearancePrompt } from '../ops/workflow-preview/appearance-reference.mjs';
import { composeWorkflowPreview } from '../ops/workflow-preview/server.mjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('appearance upload creates an ankles-up front-facing portrait, not a video-person replacement', () => {
  const prompt = buildAppearancePrompt('');
  assert.match(prompt, /^A picture is taken of an adult person, framed from the ankles up, facing the camera\./);
  assert.match(prompt, /uploaded photo as the appearance reference/);
  assert.match(prompt, /full head/);
  assert.match(prompt, /facial features, skin tone, eye color, hair/);
  assert.doesNotMatch(prompt, /Replace the existing person|supplied video frame|Preserve the reference pose/);
});

test('appearance prompt includes explicit outfit requests without adding random character traits', () => {
  const prompt = buildAppearancePrompt('Plain red baseball cap');
  assert.match(prompt, /Outfit or product instruction: Plain red baseball cap/);
  assert.match(prompt, /Keep the reference appearance/);
  assert.doesNotMatch(prompt, /construction worker|24-year-old|Face:|Build:/);
  assert.doesNotMatch(buildAppearancePrompt('   '), /Outfit or product instruction:/);
});

test('local engine uses the appearance prompt before any random-character or avatar branch', () => {
  const source = readFileSync(new URL('../prompt/index.html', import.meta.url), 'utf8');
  const html = composeWorkflowPreview(source);
  const start = html.indexOf('function buildImagePrompt(');
  const branch = html.slice(start, html.indexOf('const isAvatarMode', start));
  assert.match(branch, /TitansAppearanceReference\?\.active/);
  assert.match(branch, /imagePromptOutput.textContent = window.TitansAppearanceReference.buildPrompt/);
  assert.match(branch, /return;/);
  assert.doesNotMatch(source, /TitansAppearanceReference/);
});

test('validated upload overrides the real prompt entry point; outfit edits update it and removing restores character mode', t => {
  const elements = new Map(), listeners = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, value: '', disabled: false, hidden: false, textContent: '', handlers: {}, childNodes: [],
      firstChild: { textContent: '' }, classList: { toggle() {} },
      setAttribute() {}, append(...nodes) { this.childNodes.push(...nodes); }, prepend(...nodes) { this.childNodes.unshift(...nodes); },
      closest(selector) { return element(`${id}:${selector}`); },
      querySelector() { return element(`${id}:label`); },
      querySelectorAll() { return [element('characterAge'), element('characterGender'), element('productInstruction')]; },
      addEventListener(name, handler) { this.handlers[name] = handler; },
    });
    return elements.get(id);
  };
  element('flow-upload').hidden = true;
  const document = {
    getElementById: element, createElement: type => element(`created-${type}`),
    addEventListener: (name, listener) => listeners.set(name, listener),
  };
  const window = {};
  const html = composeWorkflowPreview(readFileSync(new URL('../prompt/index.html', import.meta.url), 'utf8'));
  const start = html.indexOf('function buildImagePrompt(');
  const entryPoint = html.slice(start, html.indexOf('    async function copyText', start));
  const context = vm.createContext({ window, document, imagePromptOutput: element('imagePromptOutput'), productInstruction: element('productInstruction'), imagePromptMode: element('imagePromptMode'),
    characterFields: element('characterFields'), characterAdvancedFields: element('characterAdvancedFields'), avatarFields: element('avatarFields'), slotGrid: element('slotGrid'), productPromptWarning: element('productPromptWarning'), rerollBtn: element('rerollBtn'), generateImagePromptBtn: element('generateImagePromptBtn'),
    buildCharacterPrompt() { element('imagePromptOutput').textContent = 'Original character prompt with locked traits'; },
    buildAvatarPrompt() { throw Error('Avatar mode must not run'); },
  });
  vm.runInContext(entryPoint, context); window.buildImagePrompt = context.buildImagePrompt;
  vm.runInContext(readFileSync(new URL('../ops/workflow-preview/appearance-reference.mjs', import.meta.url), 'utf8').replaceAll('export function ', 'function '), context);
  context.installAppearanceReference();
  assert.equal(element('imagePromptOutput').textContent, 'Original character prompt with locked traits');
  listeners.get('titans:reference-change')({ detail: { present: true } });
  assert.equal(element('imagePromptOutput').textContent, buildAppearancePrompt());
  assert.equal(element('characterAge').disabled, true);
  assert.equal(element('productInstruction').disabled, false);
  element('productInstruction').value = 'Plain red baseball cap';
  element('productInstruction').handlers.input();
  assert.equal(element('imagePromptOutput').textContent, buildAppearancePrompt('Plain red baseball cap'));
  window.buildImagePrompt(true); // Even a queued reroll must not override the appearance reference.
  assert.equal(element('imagePromptOutput').textContent, buildAppearancePrompt('Plain red baseball cap'));
  listeners.get('titans:reference-change')({ detail: { present: false } });
  assert.equal(element('imagePromptOutput').textContent, 'Original character prompt with locked traits');
  assert.equal(element('characterAge').disabled, false);
  assert.equal(element('generateImagePromptBtn').textContent, 'Generate character');
});
