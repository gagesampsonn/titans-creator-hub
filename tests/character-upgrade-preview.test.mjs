import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { composeCharacterUpgrade, upgradeRoot } from '../ops/builder-preview/character-upgrade.mjs';

const current = readFileSync(new URL('../prompt/index.html',import.meta.url),'utf8');
const supplied = readFileSync(join(upgradeRoot,'source.html'),'utf8');
test('imports character controls and engine while preserving current downloader and multi-image flow', () => {
  const html = composeCharacterUpgrade(current,supplied);
  assert.equal((html.match(/<button[^>]*data-lock=/g)||[]).length,6);
  assert.equal((html.match(/<button[^>]*data-reroll=/g)||[]).length,6);
  assert.match(html,/aria-label="Lock face"/);
  assert.match(html,/id="useFrameReference"/);
  assert.match(html,/id="instagramDownloader"/);
  assert.match(html,/id="referenceImageCount"/);
  assert.match(html,/function selectedReferenceImages/);
  assert.match(html,/referenceImageCount.addEventListener/);
  assert.match(html,/src="\/__demo\/character-library.js"/);
  assert.doesNotMatch(html,/sourceSubject.addEventListener/);
  const start = '    function invalidatePrompt()';
  assert.equal(html.slice(html.indexOf(start)),current.replace(/\r\n?/g,'\n').slice(current.replace(/\r\n?/g,'\n').indexOf(start)));
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if(match[1].trim()) assert.doesNotThrow(()=>new vm.Script(match[1]));
});
test('composition fails clearly when a source boundary changes', () => {
  assert.throws(()=>composeCharacterUpgrade(current,supplied.replace('    const modeCopy = {','    const renamed = {')),/boundary/);
});
test('supplied runtime is only the declared dataset, with 1063 unique entries', () => {
  const js = readFileSync(join(upgradeRoot,'character-library.js'),'utf8');
  assert.ok(js.startsWith('window.TITANS_CHARACTER_LIBRARY = '));
  const library = JSON.parse(js.slice('window.TITANS_CHARACTER_LIBRARY = '.length).trim().replace(/;$/,''));
  const entries = library.entries;
  assert.equal(entries.length,1063);
  assert.equal(new Set(entries.map(e=>e.id)).size,1063);
});

function characterEngine() {
  const elements = new Map(), timers = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', attributes: {}, handlers: {},
      classList: { toggle() {}, add() {}, remove() {} },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, handler) { this.handlers[name] = handler; },
      closest() { return this; },
      querySelector(selector) { return element(`lock-${selector.match(/data-lock="([^"]+)"/)[1]}`); }
    });
    return elements.get(id);
  };
  for (const [id, value] of Object.entries({ characterAge: '60', characterGender: 'male', professionSelect: 'construction', imagePromptMode: 'character' })) element(id).value = value;
  const context = vm.createContext({
    window: {}, document: { getElementById: element, querySelector: element },
    crypto: { getRandomValues: values => values.fill(0) },
    setTimeout(callback, delay) { timers.set(delay, callback); return delay; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(readFileSync(join(upgradeRoot, 'character-library.js'), 'utf8'), context);
  vm.runInContext(readFileSync(join(upgradeRoot, 'character-compatibility.js'), 'utf8'), context);
  vm.runInContext(readFileSync(join(upgradeRoot, 'character-summary.js'), 'utf8'), context);
  const html = composeCharacterUpgrade(current, supplied);
  vm.runInContext(html.slice(html.indexOf('    const genericBucket = {'), html.indexOf('    const modeCopy = {')), context);
  const events = html.indexOf('    buildImagePrompt(true);\n\n');
  vm.runInContext(html.slice(events, html.indexOf('    function invalidatePrompt()', events)), context);
  return {
    element, context,
    lock(category) {
      const button = element(`lock-${category}`);
      button.dataset = { lock: category };
      element('slotGrid').handlers.click({ target: { closest: selector => selector === '[data-lock]' ? button : null } });
      assert.equal(button.textContent, 'Locked');
      assert.equal(button.attributes['aria-pressed'], 'true');
      return button;
    },
    flushProductInput() { timers.get(220)(); }
  };
}

test('new character prompts use the requested picture opening, including after rerolls', () => {
  const engine = characterEngine();
  const output = engine.element('imagePromptOutput');
  assert.ok(output.textContent.startsWith('A picture is taken of a: '));
  engine.element('rerollBtn').handlers.click();
  assert.ok(output.textContent.startsWith('A picture is taken of a: '));
  assert.ok(!output.textContent.includes('Create a new character reference portrait of this person'));
});

test('editing a locked outfit resets both its visible lock label and pressed state', () => {
  const engine = characterEngine();
  const button = engine.lock('outfit');
  engine.element('productInstruction').value = 'A black shirt and blue jeans';
  engine.element('productInstruction').handlers.input();
  engine.flushProductInput();
  assert.equal(vm.runInContext('lockedCharacterCategories.has("outfit")', engine.context), false);
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.equal(button.textContent, 'Lock');
});

test('an age change that unlocks incompatible hair also resets its visible lock label', () => {
  const engine = characterEngine();
  // Establish a valid older-character selection without depending on a random roll.
  vm.runInContext(`{
    const hair = characterLibrary.entries.find(entry => entry.category === 'hair' && entry.tags.ageMin === 35);
    lastCharacterRoll._selections.hair = { baseId: hair.id, fragment: hair.fragment };
    lastCharacterRoll.hair = hair.fragment;
    updateSlotDisplay(lastCharacterRoll);
  }`, engine.context);
  const button = engine.lock('hair');
  engine.element('characterAge').value = '24';
  engine.element('characterAge').handlers.input();
  assert.equal(vm.runInContext('lockedCharacterCategories.has("hair")', engine.context), false);
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.equal(button.textContent, 'Lock');
});

test('automatic wardrobe respects presentation and excludes mislabeled student workwear', () => {
  const { context } = characterEngine();
  assert.equal(vm.runInContext(`isEntryCompatible({category:'outfit',fragment:'a floral dress',tags:{presentation:['feminine'],professions:['creator']}},{age:24,gender:'male',profession:'creator'})`, context), false);
  assert.equal(vm.runInContext(`isEntryCompatible({category:'outfit',fragment:'construction work boots and utility pants',tags:{presentation:['neutral'],professions:['collegeStudent']}},{age:24,gender:'female',profession:'collegeStudent'})`, context), false);
  assert.equal(vm.runInContext(`isEntryCompatible({category:'outfit',fragment:'neutral casual clothes',tags:{presentation:['neutral'],professions:['creator']}},{age:24,gender:'male',profession:'creator'})`, context), true);
});

test('skin rerolls rotate broad complexion groups without reducing the library', () => {
  const { context } = characterEngine();
  const groups = vm.runInContext(`Array.from({length:9},()=>{
    const entry=weightedEntry('skin',{age:24,gender:'female',profession:'creator'});
    rememberEntry(entry);
    const depth=entry.tags.depth[0];
    return ['very-fair','fair','light','light-medium'].includes(depth)?'light':['medium','medium-tan','tan'].includes(depth)?'medium':'deep';
  })`, context);
  for(let i=2;i<groups.length;i++) assert.equal(new Set(groups.slice(i-2,i+1)).size,3);
});
