import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../ops/image-preview/server.mjs';
import { randomUUID } from 'node:crypto';
import http from 'node:http';

test('overlapping POST bodies can dispatch only one generation', async t => {
  let calls = 0, finish;
  const server = createPreviewServer({ bridge: async () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { finish?.(Buffer.from('{}')); server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let received = 0, bothStarted;
  const started = new Promise(resolve => { bothStarted = resolve; });
  server.on('request', () => { if (++received === 2) bothStarted(); });
  function post() {
    let request;
    const response = new Promise(resolve => {
      request = http.request(origin + '/api/generations', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      request.write('{');
    });
    return { request, response };
  }
  const first = post(), second = post();
  await started;
  for (const item of [first, second]) item.request.end(JSON.stringify({ id: randomUUID(), prompt: 'A fictional adult portrait.' }).slice(1));
  assert.deepEqual((await Promise.all([first.response, second.response])).sort(), [202, 409]);
  assert.equal(calls, 1);
});

test('loopback preview rejects hostile origins, invalid inputs and unknown files', async t => {
  let generations = 0;
  const server = createPreviewServer({ bridge: async input => {
    if (input.action === 'generate') generations++;
    return Buffer.from(JSON.stringify({ jobs: [], attemptsRemaining: 5, attemptLimit: 5 }));
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(origin)).status, 200);
  for (const route of ['/ops/install-image-key.mjs', '/.env', '/api/images/../../secrets']) {
    assert.equal((await fetch(origin + route)).status, 404);
  }
  const body = JSON.stringify({ id: randomUUID(), prompt: 'A fictional adult portrait.' });
  for (const badOrigin of ['https://evil.example', 'null', '']) {
    assert.equal((await fetch(origin + '/api/generations', { method: 'POST', headers: { Origin: badOrigin, 'Content-Type': 'application/json' }, body })).status, 403);
  }
  assert.equal(generations, 0);
  assert.equal((await fetch(origin + '/api/generations', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  assert.equal((await fetch(origin + '/api/generations', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body })).status, 202);
  assert.equal(generations, 1);
});
