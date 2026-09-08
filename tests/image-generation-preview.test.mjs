import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { runGeneration, getSnapshot } from '../ops/image-preview/worker.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'titans-image-preview-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
// Minimal PNG header fixture; these tests do not call a paid API.
function png() {
  const bytes = Buffer.alloc(32);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
  bytes.write('IHDR', 12); bytes.writeUInt32BE(1024, 16); bytes.writeUInt32BE(1536, 20);
  return bytes;
}
const prompt = 'A natural portrait photograph of a fictional adult creator.';
test('rechecks an intent completed by another process immediately before lock acquisition', async t => {
  const root = fixture(t); const id = randomUUID(); let calls = 0;
  const originalOpen = fs.openSync;
  t.mock.method(fs, 'openSync', (path, ...args) => {
    if (path === join(root, 'generation.lock')) {
      fs.writeFileSync(join(root, `${id}.json`), JSON.stringify({ id, hash: createHash('sha256').update(prompt).digest('hex'), status: 'succeeded', createdAt: Date.now() }));
    }
    return originalOpen(path, ...args);
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  const job = await runGeneration(root, { id, prompt }, { apiKey: 'test-only', fetchImpl: async () => { calls++; throw Error('should_not_call'); } });
  assert.equal(job.status, 'succeeded'); assert.equal(calls, 0);
});
test('saves one result, fixes provider settings, and replays duplicate intent without spending', async t => {
  const root = fixture(t); const id = randomUUID(); let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/images/generations');
    assert.deepEqual(JSON.parse(options.body), { model: 'gpt-image-2', prompt, quality: 'high', size: '1024x1536', n: 1, output_format: 'png' });
    return new Response(JSON.stringify({ data: [{ b64_json: png().toString('base64') }], usage: { output_tokens: 5500, input_tokens_details: { text_tokens: 30, image_tokens: 0 } } }));
  };
  const job = await runGeneration(root, { id, prompt }, { apiKey: 'test-only', fetchImpl });
  assert.equal(job.status, 'succeeded');
  assert.deepEqual(readFileSync(join(root, `${id}.png`)), png());
  await runGeneration(root, { id, prompt }, { apiKey: 'test-only', fetchImpl });
  assert.equal(calls, 1);
  await assert.rejects(runGeneration(root, { id, prompt: prompt + ' Changed.' }, { fetchImpl }), /intent_conflict/);
  assert.equal(getSnapshot(root).attemptsRemaining, 4);
  assert.equal(JSON.stringify(getSnapshot(root)).includes(prompt), false);
});
test('serializes simultaneous clicks and blocks ambiguous outcomes without retry', async t => {
  const root = fixture(t); let release;
  const first = runGeneration(root, { id: randomUUID(), prompt }, { apiKey: 'test-only', fetchImpl: () => new Promise(resolve => { release = resolve; }) });
  await assert.rejects(runGeneration(root, { id: randomUUID(), prompt }, { apiKey: 'test-only' }), /busy/);
  release(new Response('{}', { status: 500 }));
  assert.equal((await first).status, 'unknown');
  await assert.rejects(runGeneration(root, { id: randomUUID(), prompt }, { apiKey: 'test-only' }), /needs_review/);
});
test('confirmed failures are sanitized and all attempts count toward the preview limit', async t => {
  const root = fixture(t);
  for (let i = 0; i < 5; i++) {
    const result = await runGeneration(root, { id: randomUUID(), prompt }, { apiKey: 'test-only', fetchImpl: async () => new Response('{"error":{"message":"SECRET"}}', { status: 400 }) });
    assert.equal(result.status, 'failed');
    assert.equal(JSON.stringify(result).includes('SECRET'), false);
  }
  await assert.rejects(runGeneration(root, { id: randomUUID(), prompt }, { apiKey: 'test-only' }), /preview_limit/);
});
test('rejects invalid prompt or identifier before provider access', async t => {
  const root = fixture(t);
  for (const input of [{ id: '../bad', prompt }, { id: randomUUID(), prompt: '' }, { id: randomUUID(), prompt: 'x'.repeat(4001) }]) {
    await assert.rejects(runGeneration(root, input), /invalid_input/);
  }
  assert.equal(getSnapshot(root).attemptsRemaining, 5);
});

test('selfie uses the saved original as its only reference and preserves both images', async t => {
  const root = fixture(t), sourceId = randomUUID(), id = randomUUID();
  const success = () => new Response(JSON.stringify({ data: [{ b64_json: png().toString('base64') }] }));
  await runGeneration(root, { id: sourceId, prompt }, { apiKey: 'test-only', fetchImpl: success });
  let calls = 0;
  const input = { id, kind: 'selfie', sourceId, accessory: 'studs' };
  const fetchImpl = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.images, [{ image_url: `data:image/png;base64,${png().toString('base64')}` }]);
    assert.equal(body.model, 'gpt-image-2'); assert.equal(body.quality, 'high');
    assert.equal(body.size, '1024x1536'); assert.equal(body.n, 1);
    assert.match(body.prompt, /same person/); assert.match(body.prompt, /pores/);
    assert.match(body.prompt, /iris/); assert.match(body.prompt, /eyebrow/);
    assert.match(body.prompt, /stud earrings/);
    assert.equal(body.input_fidelity, undefined);
    return success();
  };
  const job = await runGeneration(root, input, { apiKey: 'test-only', fetchImpl });
  assert.equal(job.status, 'succeeded'); assert.equal(job.kind, 'selfie'); assert.equal(job.sourceId, sourceId);
  assert.deepEqual(readFileSync(join(root, `${sourceId}.png`)), png());
  assert.deepEqual(readFileSync(join(root, `${id}.png`)), png());
  await runGeneration(root, input, { fetchImpl }); assert.equal(calls, 1);
  await assert.rejects(runGeneration(root, { ...input, accessory: 'preserve' }), /intent_conflict/);
  assert.equal(getSnapshot(root).attemptsRemaining, 3);
  await assert.rejects(runGeneration(root, { ...input, id: randomUUID(), sourceId: id }, { apiKey: 'test-only', fetchImpl }), /invalid_source/);
  assert.equal(calls, 1); assert.equal(getSnapshot(root).attemptsRemaining, 3);
});

test('invalid selfie sources and options cannot spend an attempt or call the provider', async t => {
  const root = fixture(t);
  for (const input of [
    { kind: 'selfie', sourceId: '../file', accessory: 'preserve' },
    { kind: 'selfie', sourceId: randomUUID(), accessory: 'custom prompt injection' },
    { kind: 'other', prompt },
    { kind: 'selfie', sourceId: randomUUID(), accessory: 'preserve' }
  ]) await assert.rejects(runGeneration(root, { id: randomUUID(), ...input }, { apiKey: 'test-only', fetchImpl: () => assert.fail('Must not call API') }), /invalid_(input|source)/);
  assert.equal(getSnapshot(root).attemptsRemaining, 5);
});
