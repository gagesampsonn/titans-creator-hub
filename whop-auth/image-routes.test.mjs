import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createAuthServer } from './server.mjs';

test('image API requires a real signed session, live eligibility and same-origin mutations', async () => {
  const secret = 'image-test-session-secret-'.repeat(3);
  const payload = Buffer.from(JSON.stringify({ sub: 'user_imageowner', exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const cookie = `titans_whop_session=${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  let eligible = true; const calls = [];
  const server = createAuthServer({ baseUrl: 'https://titansagency.co', whopSessionSecret: secret,
    whopApiKey: 'test', aiProductId: 'prod_ai', exclusiveProductId: 'prod_exclusive' }, {
    fetchFn: async () => Response.json({ has_access: eligible }),
    imageService: { state: async user => { calls.push(user); return { credits: 15 }; }, start: async user => ({ id: randomUUID(), user }) }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/image-api`;
  try {
    assert.equal((await fetch(`${base}/state`)).status, 401);
    const state = await fetch(`${base}/state`, { headers: { cookie } });
    assert.equal(state.status, 200); assert.equal(state.headers.get('cache-control'), 'no-store');
    assert.deepEqual(calls, ['user_imageowner']);
    eligible = false;
    assert.equal((await fetch(`${base}/state`, { headers: { cookie } })).status, 403);
    eligible = true;
    const headers = { cookie, origin: 'https://evil.example', 'content-type': 'application/json', 'x-titans-images': '1' };
    assert.equal((await fetch(`${base}/generations`, { method: 'POST', headers, body: '{}' })).status, 403);
    headers.origin = 'https://titansagency.co';
    const generated = await fetch(`${base}/generations`, { method: 'POST', headers, body: JSON.stringify({ userId: 'user_attacker' }) });
    assert.equal(generated.status, 202); assert.equal((await generated.json()).data.user, 'user_imageowner');
    delete headers['x-titans-images'];
    assert.equal((await fetch(`${base}/generations`, { method: 'POST', headers, body: '{}' })).status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
