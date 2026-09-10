import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
test('Titans overview and Weekly use the AI light theme and preserve purchase routes', () => {
  for (const file of ['titans/index.html', 'weekly/index.html']) {
    const html = read(file);
    assert.match(html, /family=Geist:/);
    assert.match(html, /class="ai-landing (?:titans|weekly)-landing"/);
    assert.match(html, /\/assets\/membership-landing\.css/);
    assert.match(html, /\/assets\/titans-logo-light\.png/);
    assert.doesNotMatch(html, /family=Inter:/);
  }
  const weekly = read('weekly/index.html');
  assert.match(weekly, /data-whop-checkout-plan-id="plan_DrOCjHLteEqXB"/);
  assert.match(weekly, /data-whop-checkout-return-url="https:\/\/titansagency.co\/checkout\/complete\/\?product=weekly"/);
  assert.match(weekly, /data-whop-checkout-theme="light"/);
  assert.match(weekly, /data-ai-access="false"/);
  assert.match(read('titans/index.html'), /href="\/weekly\/"/);
  assert.match(read('titans/index.html'), /href="\/exclusive\/"/);
});
test('public AI product name is consistent while Prompt Builder remains an included tool', () => {
  for (const file of ['index.html','ai/index.html','weekly/index.html','exclusive/index.html','checkout/complete/index.html']) {
    const html = read(file);
    assert.match(html, /AI Creator Kit/);
    assert.doesNotMatch(html, /AI Content|AI Prompter \+ Guide/);
  }
  assert.match(read('ai/index.html'), /<h3>Titans AI Prompt Builder<\/h3>/);
});
