import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('homepage uses the approved light typography while retaining the two conversion paths', () => {
  assert.match(html, /family=Geist:/);
  assert.match(html, /class="ai-landing home-landing"/);
  assert.match(html, /\/assets\/home-landing\.css/);
  assert.match(html, /\/assets\/titans-logo-light\.png/);
  const products = html.split('<section id="products"')[1].split('</section>')[0];
  assert.equal((products.match(/<article class="ecosystem-card/g) || []).length, 2);
  assert.match(products, /href="\/titans\/"/);
  assert.match(products, /href="\/ai\/"/);
  assert.doesNotMatch(products, /\$\d|countdown|role="timer"/);
  assert.deepEqual([...html.matchAll(/<section id="([^"]+)"/g)].map(match => match[1]), ['products', 'proof', 'how-it-works', 'questions']);
});

test('homepage preserves deliberate video playback and existing navigation hooks', () => {
  const videos = [...html.matchAll(/<video\b[^>]*>/g)].map(match => match[0]);
  assert.equal(videos.length, 3);
  for (const video of videos) {
    assert.match(video, /\bcontrols\b/);
    assert.match(video, /\bplaysinline\b/);
    assert.doesNotMatch(video, /\bautoplay\b/);
  }
  assert.match(html, /data-menu-button/);
  assert.match(html, /aria-controls="mobile-navigation"/);
  assert.match(html, /data-mobile-panel/);
  assert.match(html, /src="\/assets\/commerce\.js"/);
});
