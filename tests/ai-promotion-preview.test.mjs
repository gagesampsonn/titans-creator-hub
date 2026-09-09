import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../assets/ai-promotion-preview.js', import.meta.url), 'utf8');
function preview({ host = '127.0.0.1', saved = null, now = 1000000, blocked = false } = {}) {
  let clock = now, tick, writes = 0, inserted = 0;
  const timer = { textContent: '' };
  const banner = { hidden: false, querySelector: () => timer };
  const storage = { getItem() { if (blocked) throw Error('denied'); return saved; }, setItem(k, v) { writes++; saved = v; } };
  vm.runInNewContext(script, { location: { hostname: host, pathname: '/ai/' }, localStorage: storage,
    Date: { now: () => clock }, document: { querySelector: () => ({ prepend: () => inserted++ }), createElement: () => banner },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() {} });
  return { banner, timer, get saved() { return saved; }, writes, inserted, advance(ms) { clock += ms; tick?.(); } };
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
