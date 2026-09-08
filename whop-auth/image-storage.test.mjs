import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createImageStorage } from './image-storage.mjs';

test('private image and receipt are stored atomically with matching integrity hash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'titans-image-storage-test-'));
  try {
    const storage = createImageStorage(root);
    const id = randomUUID();
    await storage.save(id, { bytes: Buffer.from('test image bytes'), usage: null, costMicros: 250000 });
    assert.equal((await storage.image(id)).toString(), 'test image bytes');
    assert.equal((await storage.receipt(id)).costMicros, 250000);
    await assert.rejects(storage.image('../credentials'), /invalid_image_id/);
    await assert.rejects(storage.save(id, { bytes: Buffer.from('replace'), costMicros: 1 }), /EEXIST/);
    assert.equal((await readFile(join(root, `${id}.png`))).toString(), 'test image bytes');
  } finally { await rm(root, { recursive: true }); }
});

test('generation storage refuses low disk space before accepting an image', async () => {
  const root = await mkdtemp(join(tmpdir(), 'titans-image-capacity-test-'));
  try {
    const storage = createImageStorage(root, { capacity: async () => ({ bavail: 1, bsize: 4096 }) });
    await assert.rejects(storage.ensureCapacity(), /storage_capacity/);
  } finally { await rm(root, { recursive: true }); }
});
