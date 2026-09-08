import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createImageService } from './image-service.mjs';

function fixture({ duplicate = false, storageFailure = false } = {}) {
  const events = []; let state = 'reserved';
  const ledger = {
    ensureAllowance: async () => {},
    reserve: async input => ({ created: !duplicate, job: { id: input.id, kind: 'original', state } }),
    finish: async (id, next) => { events.push(next); state = next; },
    job: async () => null,
  };
  const storage = { save: async () => { events.push('storage'); if (storageFailure) throw Error('disk'); } };
  const provider = async () => { events.push('provider'); return { state: 'succeeded', bytes: Buffer.from('photo'), costMicros: 170000 }; };
  return { events, service: createImageService({ ledger, storage, apiKey: 'test-only', provider }) };
}
test('image service claims once, saves first, then deducts the reserved credit', async () => {
  const { service, events } = fixture();
  await service.start('user_test', { id: randomUUID(), prompt: 'A fictional adult portrait.', consent: 'images-v1' });
  await service.drain();
  assert.deepEqual(events, ['running', 'provider', 'storage', 'succeeded']);
});
test('duplicate requests never call OpenAI again and storage failures retain the reservation', async () => {
  const previous = fixture({ duplicate: true });
  await previous.service.start('user_test', { id: randomUUID(), prompt: 'A fictional adult portrait.', consent: 'images-v1' });
  await previous.service.drain(); assert.deepEqual(previous.events, []);
  const failure = fixture({ storageFailure: true });
  await failure.service.start('user_test', { id: randomUUID(), prompt: 'A fictional adult portrait.', consent: 'images-v1' });
  await failure.service.drain();
  assert.deepEqual(failure.events, ['running', 'provider', 'storage', 'unknown']);
});
test('selfies cannot load another member source and generation requires consent', async () => {
  const { service, events } = fixture();
  await assert.rejects(service.start('user_test', { id: randomUUID(), kind: 'selfie', sourceId: randomUUID(), accessory: 'preserve', consent: 'images-v1' }), /source_unavailable/);
  await assert.rejects(service.start('user_test', { id: randomUUID(), prompt: 'A fictional adult portrait.' }), /consent_required/);
  assert.deepEqual(events, []);
});

test('recovery cannot release a reservation claimed by another worker after the status snapshot', async () => {
  const id = randomUUID();
  const stale = { id, kind: 'original', state: 'reserved', updated_at: new Date(Date.now() - 700000) };
  let current = { ...stale };
  const ledger = {
    ensureAllowance: async () => {}, list: async () => [stale],
    finish: async (_id, next, options) => {
      if (options?.expectedState && current.state !== options.expectedState) return current;
      current = { ...current, state: next }; return current;
    },
    account: async () => ({ balance: 15, available: current.state === 'failed' ? 15 : 14 }),
    settings: async () => ({ generation_enabled: true }), packs: async () => []
  };
  const storage = { receipt: async () => { current = { ...current, state: 'running' }; throw Error('no receipt yet'); } };
  const service = createImageService({ ledger, storage, apiKey: 'test' });
  const result = await service.state('user_test');
  assert.equal(result.credits, 14);
  assert.equal(result.jobs[0].state, 'running');
});

test('polling an uncertain request preserves its admin recovery eligibility', async () => {
  const job = { id: randomUUID(), kind: 'original', state: 'unknown', updated_at: new Date(Date.now() - 700000) };
  let writes = 0;
  const ledger = { ensureAllowance: async () => {}, list: async () => [job],
    finish: async () => { writes++; return job; }, account: async () => ({ balance: 15, available: 14 }),
    settings: async () => ({ generation_enabled: true }), packs: async () => [] };
  const service = createImageService({ ledger, storage: { receipt: async () => { throw Error('missing'); } }, apiKey: 'test' });
  await service.state('user_test');
  await service.state('user_test');
  assert.equal(writes, 0, 'Unknown status polling must not reset updated_at');
});
