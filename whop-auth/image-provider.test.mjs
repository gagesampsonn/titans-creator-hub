import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { prepareImageRequest, generatePhoto } from './image-provider.mjs';

test('reference inputs are bounded, decoded, resized and metadata stripped', async () => {
  const png = await sharp({ create: { width: 2048, height: 3072, channels: 3, background: '#345678' } }).png().toBuffer();
  const request = await prepareImageRequest({ id: randomUUID(), kind: 'original', prompt: 'A picture is taken of a: fictional adult.', reference: png.toString('base64') });
  const meta = await sharp(request.reference).metadata();
  assert.equal(meta.width, 1024); assert.equal(meta.height, 1536);
  assert.equal(meta.exif, undefined); assert.equal(meta.format, 'jpeg');
  await assert.rejects(prepareImageRequest({ id: randomUUID(), prompt: 'a'.repeat(4001) }), /invalid_prompt/);
  await assert.rejects(prepareImageRequest({ id: randomUUID(), prompt: 'Valid fictional person', reference: Buffer.from('<svg/>').toString('base64') }), /invalid_reference/);
});

test('OpenAI settings are backend owned; an edit includes only sanitized reference data', async () => {
  const image = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: '#123456' } }).png().toBuffer();
  const input = await prepareImageRequest({ id: randomUUID(), prompt: 'Fictional adult portrait for a reference', reference: image.toString('base64'), model: 'untrusted', n: 50 });
  const result = await generatePhoto(input, { apiKey: 'test-key-not-real', fetchFn: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gpt-image-2'); assert.equal(body.quality, 'high');
    assert.equal(body.size, '1024x1536'); assert.equal(body.n, 1);
    assert.match(body.images[0].image_url, /^data:image\/jpeg;base64,/);
    return Response.json({ data: [{ b64_json: image.toString('base64') }], usage: {
      input_tokens_details: { text_tokens: 236, image_tokens: 1536 }, output_tokens: 5488 } });
  } });
  assert.equal(result.state, 'succeeded'); assert.equal(result.costMicros, 178108);
  assert.deepEqual(result.bytes, image);
});

test('uncertain API results are not retried or reported as a confirmed failure', async () => {
  const input = await prepareImageRequest({ id: randomUUID(), prompt: 'A fictional adult portrait.' });
  let calls = 0;
  const result = await generatePhoto(input, { apiKey: 'test-only', fetchFn: async () => { calls++; throw Error('contains secret detail'); } });
  assert.equal(calls, 1); assert.deepEqual(result, { state: 'unknown' });
  const rejected = await generatePhoto(input, { apiKey: 'test-only', fetchFn: async () => new Response('private error', { status: 400 }) });
  assert.deepEqual(rejected, { state: 'failed' });
});
