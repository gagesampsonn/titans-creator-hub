import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('released builder keeps authentication and real tools while loading compact character summaries', () => {
  const html = readFileSync(new URL('../prompt/index.html', import.meta.url), 'utf8');
  assert.match(html, /src="\/assets\/member-access.js" defer/);
  assert.match(html, /src="\/prompt\/character-library.js"/);
  assert.match(html, /src="\/prompt\/character-summary.js"/);
  assert.match(html, /src="\/prompt\/character-compatibility.js"/);
  assert.match(html, /src="\/assets\/image-builder.js"/);
  assert.match(html, /href="\/assets\/image-builder.css"/);
  assert.match(html, /<details class="prompt-details">/);
  assert.match(html, /A picture is taken of a:/);
  assert.match(html, /id="instagramDownloader"/);
  assert.match(html, /id="referenceImageCount"/);
  assert.doesNotMatch(html, /__demo|demo-app|demo-style/);
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (match[1].trim()) assert.doesNotThrow(() => new vm.Script(match[1]));
  }
});

test('character card summaries leave full realism fragments and exact clothing intact', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(new URL('../prompt/character-summary.js', import.meta.url), 'utf8'), context);
  const summarize = context.window.TITANS_CHARACTER_SUMMARY.summarize;
  const entry = { tags: { color: ['blue-gray'], shape: ['almond'] }, fragment: 'blue-gray almond eyes with detailed limbal rings and coherent catchlights' };
  const before = JSON.stringify(entry);
  assert.equal(summarize('eyes', entry, entry.fragment), 'Blue-gray • Almond-shaped eyes');
  assert.equal(JSON.stringify(entry), before);
  assert.equal(summarize('outfit', null, 'the exact user-specified requirement: a black shirt and blue jeans; retain the exact garments'), 'Black shirt and blue jeans');
});
