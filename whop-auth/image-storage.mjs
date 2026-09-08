import { mkdir, open, link, unlink, readFile, stat, statfs } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { IMAGE_UUID } from './image-provider.mjs';

export function createImageStorage(directory, { capacity = statfs } = {}) {
  if (typeof directory !== 'string' || !directory.length) throw Error('storage_required');
  const root = resolve(directory);
  function path(id, suffix) {
    if (!IMAGE_UUID.test(id)) throw Error('invalid_image_id');
    return join(root, `${id}.${suffix}`);
  }
  async function syncDirectory() {
    if (process.platform === 'win32') return;
    const fd = await open(root, 'r');
    try { await fd.sync(); } finally { await fd.close(); }
  }
  async function saveOnce(destination, bytes) {
    const temporary = `${destination}.next`;
    const fd = await open(temporary, 'wx', 0o600);
    try { await fd.writeFile(bytes); await fd.sync(); } finally { await fd.close(); }
    // Atomic publication without overwriting any previous completed image.
    await link(temporary, destination);
    await syncDirectory();
    await unlink(temporary);
  }
  async function image(id) {
    const target = path(id, 'png');
    if ((await stat(target)).size > 18 * 1024 * 1024) throw Error('image_limit');
    return readFile(target);
  }
  return {
    async ensureCapacity() {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const disk = await capacity(root);
      if (Number(disk.bavail) * Number(disk.bsize) < 2 * 1024 ** 3) throw Error('storage_capacity');
    },
    async save(id, { bytes, usage, costMicros }) {
      if (!Buffer.isBuffer(bytes) || bytes.length > 18 * 1024 * 1024 || !Number.isSafeInteger(costMicros) || costMicros < 0) throw Error('invalid_image_result');
      await mkdir(root, { recursive: true, mode: 0o700 });
      await saveOnce(path(id, 'png'), bytes);
      await saveOnce(path(id, 'receipt.json'), JSON.stringify({ id, usage, costMicros,
        sha256: createHash('sha256').update(bytes).digest('hex') }));
    },
    image,
    async removeExpired(id) {
      for (const suffix of ['png','receipt.json','png.next','receipt.json.next']) {
        try { await unlink(path(id, suffix)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      await syncDirectory();
    },
    async receipt(id) {
      const target = path(id, 'receipt.json');
      if ((await stat(target)).size > 32768) throw Error('invalid_receipt');
      const receipt = JSON.parse(await readFile(target, 'utf8'));
      if (receipt.id !== id || !Number.isSafeInteger(receipt.costMicros) || receipt.costMicros < 0 ||
        receipt.sha256 !== createHash('sha256').update(await image(id)).digest('hex')) throw Error('invalid_receipt');
      return receipt;
    }
  };
}
