import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createDemoSession, PACKS } from '../ops/builder-preview/demo-model.mjs';
import { createBuilderPreview } from '../ops/builder-preview/server.mjs';

test('mock generation spends once, preserves original source and stops at zero', async () => {
  let finish;
  const demo = createDemoSession();
  const pending = demo.generate('original', 'A finished character prompt', () => new Promise(resolve => { finish = resolve; }));
  await assert.rejects(demo.generate('original', 'A finished character prompt', async () => {}), /busy/);
  finish(); await pending;
  assert.equal(demo.snapshot().credits, 14);
  await demo.generate('selfie', '', async () => {});
  assert.equal(demo.snapshot().selfie.sourceId, demo.snapshot().original.id);
  for (let i = 0; i < 13; i++) await demo.generate('selfie', '', async () => {});
  assert.equal(demo.snapshot().credits, 0);
  await assert.rejects(demo.generate('selfie', '', async () => {}), /credits/);
  demo.addPack('pack-5'); assert.equal(demo.snapshot().credits, 10);
  assert.deepEqual(PACKS.map(p => [p.price, p.credits]), [[5,10],[10,25],[15,40],[20,60],[25,80],[30,100]]);
});
test('failed mock image load does not spend and a new original clears its previous selfie', async () => {
  const demo = createDemoSession();
  await assert.rejects(demo.generate('selfie', '', async () => {}), /original/);
  await assert.rejects(demo.generate('original', '', async () => {}), /prompt/);
  await assert.rejects(demo.generate('original', 'A finished character prompt', async () => { throw Error('load'); }), /load/);
  assert.equal(demo.snapshot().credits, 15); assert.equal(demo.snapshot().busy, false);
  await demo.generate('original', 'A finished character prompt', async () => {});
  await demo.generate('selfie', '', async () => {});
  await demo.generate('original', 'Another finished character prompt', async () => {});
  assert.equal(demo.snapshot().selfie, null);
  assert.throws(() => demo.addPack('invented'), /pack/);
});
test('local combined preview injects UI without exposing write endpoints or private files', async t => {
  const server = createBuilderPreview({ loadSample: async () => Buffer.from('fixture') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(origin + '/prompt/');
  const html = await page.text();
  assert.equal(page.status, 200);
  assert.match(html, /imagePromptOutput/); assert.match(html, /demo-app.js/);
  assert.doesNotMatch(html, /src="\/assets\/member-access.js"/);
  assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!script[1].trim()) continue;
    const browserText = script[1].replace(/\r\n?/g,'\n');
    const hash = createHash('sha256').update(browserText).digest('base64');
    assert.ok(page.headers.get('content-security-policy').includes(`'sha256-${hash}'`),'CSP hash must match HTML-parsed newlines');
  }
  for (const path of ['/api/generations','/auth/whop/upgrade']) assert.equal((await fetch(origin + path, { method:'POST' })).status, 405);
  for (const path of ['/.git/config','/ops/install-image-key.mjs','/__demo/image/unknown','/prompt/assets/../../.env']) assert.equal((await fetch(origin + path)).status, 404);
  const hostileStatus = await new Promise(resolve => http.get(origin,{headers:{Host:'evil.example'}},res => { res.resume(); resolve(res.statusCode); }));
  assert.equal(hostileStatus, 403);
  assert.equal((await fetch(origin + '/__demo/image/original')).status, 200);
});
