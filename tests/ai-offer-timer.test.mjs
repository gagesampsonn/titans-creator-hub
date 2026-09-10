import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/ai-offer-timer.js', import.meta.url), 'utf8');
const deadline = Date.parse('2026-09-15T00:00:00Z');
function render(now) {
  let clock = now, tick;
  const timers = [{ textContent: '' }, { textContent: '' }];
  const promotions = Array.from({ length: 4 }, () => ({ hidden: false }));
  const label = { textContent: 'AI Creator Kit · Current offer' };
  vm.runInNewContext(source, {
    Date: { now: () => clock, parse: Date.parse },
    document: { querySelectorAll(selector) {
      if (selector === '[data-ai-offer-timer]') return timers;
      if (selector === '[data-ai-offer-label]') return [label];
      return promotions;
    } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() {},
  });
  return { timers, promotions, label, advance(ms) { clock += ms; tick?.(); } };
}
test('five-day countdown uses one fixed campaign deadline on every page', () => {
  const page = render(deadline - 5 * 86400000);
  assert.equal(page.timers[0].textContent, '5d 00:00:00');
  page.advance(1000);
  assert.equal(page.timers[0].textContent, '4d 23:59:59');
  assert.equal(page.timers[1].textContent, page.timers[0].textContent);
  assert.equal(render(deadline - 4 * 86400000).timers[0].textContent, '4d 00:00:00');
});
test('refresh and later arrivals never restart the offer', () => {
  const page = render(deadline - 61000);
  assert.equal(page.timers[0].textContent, '0d 00:01:01');
  page.advance(2000);
  assert.equal(render(deadline - 59000).timers[0].textContent, page.timers[0].textContent);
});
test('expiry removes sale messaging and strikes without touching checkout', () => {
  const page = render(deadline - 1000);
  assert.ok(page.promotions.every(node => !node.hidden));
  page.advance(1000);
  assert.equal(page.timers[0].textContent, '0d 00:00:00');
  assert.ok(page.promotions.every(node => node.hidden));
  assert.equal(page.label.textContent, 'AI Creator Kit');
  assert.ok(render(deadline + 10000).promotions.every(node => node.hidden));
});
