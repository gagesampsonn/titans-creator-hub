import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createWorkflowPreview, composeWorkflowPreview } from '../ops/workflow-preview/server.mjs';
import { stages, stageForTarget } from '../ops/workflow-preview/stages.mjs';

test('workflow groups every existing tool and routes image-to-video handoff', () => {
  assert.equal(stages.length, 5);
  assert.equal(stageForTarget('tiktokDownloader'), 'motion');
  assert.equal(stageForTarget('titans-image-flow'), 'character');
  assert.equal(stageForTarget('referenceImageCount'), 'prompt');
  assert.equal(stageForTarget('publish'), 'finish');
  assert.equal(stageForTarget('unknown'), null);
  const sections = stages.flatMap(s => s.sections);
  assert.equal(new Set(sections).size, sections.length);
});

test('preview preserves the production prompt engine, removes autoplay and live API client only in response', () => {
  const original = readFileSync(new URL('../prompt/index.html', import.meta.url), 'utf8');
  const html = composeWorkflowPreview(original);
  assert.match(html, /workflow-app.js/);
  assert.match(html, /LOCAL DESIGN PREVIEW/);
  assert.match(html, /function buildImagePrompt\(/);
  assert.match(html, /function buildPrompt\(/);
  assert.match(html, /character-compatibility.js/);
  assert.doesNotMatch(html, /entry.target.play\(/);
  assert.doesNotMatch(html, /src="\/assets\/(?:member-access|image-builder).js"/);
  assert.match(original, /src="\/assets\/member-access.js"/);
});

test('local workflow serves only public assets and refuses all write requests', async t => {
  const server = createWorkflowPreview();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base + '/prompt/');
  assert.equal(page.status, 200);
  const html = await page.text();
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!script[1].trim()) continue;
    const hash = createHash('sha256').update(script[1]).digest('base64');
    assert.ok(page.headers.get('content-security-policy').includes(`'sha256-${hash}'`));
  }
  for (const path of ['/__workflow/stages.mjs', '/__workflow/workflow-app.js', '/__workflow/workflow.css', '/__demo/demo-app.js', '/__demo/panel.html', '/prompt/character-controls.css']) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  for (const path of ['/image-api/generate', '/api/tiktok/resolve', '/checkout']) {
    assert.equal((await fetch(base + path, { method: 'POST' })).status, 405);
  }
  for (const path of ['/.env', '/.git/config', '/ops/image-preview/check-whop-fees.mjs']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
  const hostileStatus = await new Promise(resolve => http.get(base, { headers: { Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }));
  assert.equal(hostileStatus, 403);
});
