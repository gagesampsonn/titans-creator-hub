import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
test('public homepage and AI page show the real checkout price with the requested comparison', () => {
  for (const name of ['index.html', 'ai/index.html']) {
    const html = read(name);
    const banner = html.match(/<a class="ai-offer-banner"[\s\S]*?<\/a>/)?.[0];
    assert.ok(banner, name + ' needs an always-visible offer banner');
    assert.match(banner, /<s[^>]*>\$45<\/s>/);
    assert.match(banner, /\$29\.99/);
    assert.match(banner, /href="(?:\/ai\/)?#checkout"/);
    assert.match(html, /\/assets\/ai-offer\.css/);
    assert.doesNotMatch(html, /src="[^\"]*ai-promotion-preview\.js/);
    assert.match(banner, /data-ai-offer-timer role="timer"/);
    assert.match(banner, /AI Creator Kit/);
    assert.match(html, /src="\/assets\/ai-offer-timer\.js/);
  }
});
test('AI price contrast appears beside the hero price and directly above Whop checkout', () => {
  const html = read('ai/index.html');
  assert.match(html, /class="ai-inline-price"><s[^>]*>\$45<\/s><strong>\$29\.99/);
  assert.match(html, /class="checkout-panel">\s*<div class="ai-offer-checkout">/);
  assert.match(html, /data-whop-checkout-plan-id="plan_bJeNjIIJAtzSR"/);
  assert.match(html, /data-whop-checkout-return-url="https:\/\/titansagency.co\/checkout\/complete\/\?product=ai"/);
});
