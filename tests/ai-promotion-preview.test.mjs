import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../assets/ai-promotion-preview.js', import.meta.url), 'utf8');
function preview({ host = '127.0.0.1', search = '', saved = null, now = 1000000, blocked = false } = {}) {
  let clock = now, tick, writes = 0, inserted = 0;
  const timer = { textContent: '' };
  const banner = { hidden: false, querySelector: () => timer };
  const checkoutTimer = { textContent: '' };
  const checkoutNotices = [];
  const heroPrices = [];
  const storage = { getItem() { if (blocked) throw Error('denied'); return saved; }, setItem(k, v) { writes++; saved = v; } };
  vm.runInNewContext(script, { location: { hostname: host, pathname: '/ai/', search }, URLSearchParams, localStorage: storage,
    Date: { now: () => clock }, document: {
      querySelector: selector => selector === '.ai-inline-price' ? { prepend: node => heroPrices.push(node) } : selector === '.checkout-panel' ? { prepend: node => checkoutNotices.push(node) } : { prepend: () => inserted++ },
      createElement: tag => tag === 'a' ? banner : { hidden: false, setAttribute() {}, querySelector: () => checkoutTimer } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() {} });
  return { banner, timer, heroPrices, checkoutTimer, checkoutNotices, get saved() { return saved; }, writes, inserted, advance(ms) { clock += ms; tick?.(); } };
}
test('promotion preview starts at ten minutes and survives refresh', () => {
  const first = preview();
  assert.equal(first.timer.textContent, '10:00');
  assert.equal(first.inserted, 1);
  first.advance(61000);
  assert.equal(first.timer.textContent, '08:59');
  const refreshed = preview({ saved: first.saved, now: 1061000 });
  assert.equal(refreshed.timer.textContent, '08:59');
  assert.equal(refreshed.writes, 0);
});
test('hero shows the same regular price as the active banner and hides it on expiry', () => {
  const active = preview();
  assert.equal(active.heroPrices[0]?.textContent, '$45');
  active.advance(600000);
  assert.equal(active.heroPrices[0].hidden, true);
  assert.equal(preview({ saved: '1' }).heroPrices.length, 0);
  assert.equal(preview({ host: 'titansagency.co' }).heroPrices.length, 0);
  const review = preview({ saved: '1', search: '?bannerPreview=1' });
  assert.equal(review.heroPrices[0]?.textContent, '$45');
});
test('expired preview does not restart or continue advertising a discount', () => {
  const first = preview();
  first.advance(600000);
  assert.equal(first.banner.hidden, true);
  assert.equal(preview({ saved: first.saved, now: 1600001 }).inserted, 0);
});
test('production, broken storage and altered deadlines never show the preview', () => {
  for (const options of [{ host: 'titansagency.co' }, { host: 'evil.localhost.example' }, { blocked: true }, { saved: 'broken' }, { saved: '99999999999' }]) {
    assert.equal(preview(options).inserted, 0);
  }
});
test('explicit design review shows a static banner even after expiry without resetting the real preview deadline', () => {
  for (const options of [{ saved: '1' }, { blocked: true }]) {
    const result = preview({ ...options, search: '?bannerPreview=1' });
    assert.equal(result.inserted, 1);
    assert.equal(result.timer.textContent, '10:00');
    assert.equal(result.writes, 0);
    result.advance(700000);
    assert.equal(result.banner.hidden, false);
    assert.equal(result.timer.textContent, '10:00');
  }
  assert.equal(preview({ host: 'titansagency.co', search: '?bannerPreview=1' }).inserted, 0);
});
test('checkout deadline matches the banner, expires with it, and stays preview-only', () => {
  const active = preview();
  assert.equal(active.checkoutNotices.length, 1);
  assert.equal(active.checkoutTimer.textContent, '10:00');
  active.advance(61000);
  assert.equal(active.checkoutTimer.textContent, active.timer.textContent);
  active.advance(600000);
  assert.equal(active.checkoutNotices[0].hidden, true);
  assert.equal(preview({ host: 'titansagency.co' }).checkoutNotices.length, 0);
  assert.equal(preview({ saved: '1' }).checkoutNotices.length, 0);
  const demo = preview({ saved: '1', search: '?bannerPreview=1' });
  assert.equal(demo.checkoutTimer.textContent, '10:00');
  assert.match(demo.checkoutNotices[0].innerHTML, /Design preview/);
});
