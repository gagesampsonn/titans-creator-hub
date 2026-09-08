import test from 'node:test';
import assert from 'node:assert/strict';
import { openImageRuntime } from './image-runtime.mjs';
import { stopAuthServer } from './server.mjs';

test('production images are opt-in and refuse incomplete private configuration', async () => {
  assert.deepEqual(await openImageRuntime({}, {}), {});
  assert.deepEqual(await openImageRuntime({ TITANS_IMAGES_ENABLED: '1' }, {}), {});
  await assert.rejects(openImageRuntime({ TITANS_IMAGES_ENABLED: 'true' }, {}), /image_configuration_missing/);
});

test('shutdown waits for admitted HTTP requests before closing the image ledger', async () => {
  let finishHttp, imageClosed = false;
  const server = { close: callback => { finishHttp = callback; } };
  const stopping = stopAuthServer(server, { close: async () => { imageClosed = true; } });
  await Promise.resolve();
  assert.equal(imageClosed, false);
  finishHttp();
  await stopping;
  assert.equal(imageClosed, true);
});
