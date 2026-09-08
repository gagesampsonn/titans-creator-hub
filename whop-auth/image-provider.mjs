import sharp from 'sharp';
import { createHash } from 'node:crypto';

export const IMAGE_UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const accessories = Object.freeze({
  preserve: 'Keep the original accessories exactly as shown. Do not add new jewelry.',
  studs: 'Add discreet small stud earrings with realistic reflections and placement. Keep other accessories unchanged.',
  hoops: 'Add discreet small hoop earrings with realistic reflections and placement. Keep other accessories unchanged.'
});
function selfiePrompt(accessory) {
  return `Create a hyper-realistic close-up smartphone selfie of the same person in the supplied original reference photo. Preserve identity, apparent age, facial structure, skin tone, eye color, hairline, hairstyle, facial hair and distinctive features. Do not beautify, reshape, age or replace the person. Frame the full face, ears and upper shoulders, with the face filling most of the portrait and both eyes clearly in focus. Use natural eye-level perspective without wide-angle distortion, relaxed expression, soft window light and a softly blurred background consistent with the original. Reveal realistic facial pores, subtle peach fuzz, fine skin texture, natural tonal variation, individual eyebrow hairs, eyelashes, detailed iris texture in the original eye color, moist eye highlights and natural lip texture. Keep details anatomically plausible: no exaggerated pores, artificial sharpness, waxy skin, beauty filters, plastic smoothing or CGI appearance. ${accessories[accessory]} This is an additional identity reference for a video workflow, not a collage or a crop of the original. One photographic image only, no text, logos or watermark.`;
}
async function sanitizeReference(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > 8 * 1024 * 1024) throw Error('invalid_reference');
  try {
    const source = sharp(bytes, { limitInputPixels: 4096 * 4096, failOn: 'warning' });
    const meta = await source.metadata();
    if (!['png', 'jpeg', 'webp'].includes(meta.format) || meta.width > 4096 || meta.height > 4096 ||
      (meta.pages ?? 1) !== 1) throw Error('invalid_reference');
    return await source.rotate().resize({ width: 1024, height: 1536, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer();
  } catch { throw Error('invalid_reference'); }
}
export async function prepareImageRequest(input, { originalBytes } = {}) {
  if (!input || !IMAGE_UUID.test(input.id)) throw Error('invalid_request');
  const kind = input.kind ?? 'original';
  let prompt, reference;
  if (kind === 'selfie') {
    if (!IMAGE_UUID.test(input.sourceId) || input.sourceId === input.id || !Object.hasOwn(accessories, input.accessory)) throw Error('invalid_source');
    prompt = selfiePrompt(input.accessory);
    reference = await sanitizeReference(originalBytes);
  } else {
    if (kind !== 'original' || typeof input.prompt !== 'string' || input.prompt.trim().length < 10 || Buffer.byteLength(input.prompt) > 4000) throw Error('invalid_prompt');
    prompt = input.prompt.trim();
    if (input.reference !== undefined && input.reference !== null) {
      if (typeof input.reference !== 'string' || input.reference.length > 11184812 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(input.reference) || input.reference.length % 4 !== 0) throw Error('invalid_reference');
      reference = await sanitizeReference(Buffer.from(input.reference, 'base64'));
    }
  }
  const referenceHash = reference ? createHash('sha256').update(reference).digest('hex') : null;
  const hash = createHash('sha256').update(JSON.stringify({ kind, prompt, sourceId: kind === 'selfie' ? input.sourceId : null, referenceHash })).digest('hex');
  return { id: input.id, kind, prompt, reference, hash, sourceId: kind === 'selfie' ? input.sourceId : null };
}
export async function generatePhoto(input, { apiKey, fetchFn = fetch } = {}) {
  if (!apiKey) throw Error('generation_not_configured');
  const body = { model: 'gpt-image-2', prompt: input.prompt, quality: 'high', size: '1024x1536', n: 1, output_format: 'png' };
  if (input.reference) body.images = [{ image_url: `data:image/jpeg;base64,${input.reference.toString('base64')}` }];
  try {
    const response = await fetchFn(`https://api.openai.com/v1/images/${input.reference ? 'edits' : 'generations'}`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!response.ok) {
      await response.body?.cancel();
      return { state: [400, 401, 403, 404, 422, 429].includes(response.status) ? 'failed' : 'unknown' };
    }
    let size = 0; const chunks = [];
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 24 * 1024 * 1024) throw Error('response_limit');
      chunks.push(chunk);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const b64 = value?.data?.[0]?.b64_json;
    if (value?.data?.length !== 1 || typeof b64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw Error('invalid_output');
    const bytes = Buffer.from(b64, 'base64');
    const image = sharp(bytes, { limitInputPixels: 1024 * 1536, failOn: 'warning' });
    const meta = await image.metadata();
    if (meta.format !== 'png' || meta.width !== 1024 || meta.height !== 1536 || (meta.pages ?? 1) !== 1) throw Error('invalid_output');
    await image.raw().toBuffer(); // Validate complete decoding, not just an untrusted header.
    const tokens = [value.usage?.input_tokens_details?.text_tokens, value.usage?.input_tokens_details?.image_tokens, value.usage?.output_tokens];
    const validUsage = tokens.every(n => Number.isSafeInteger(n) && n >= 0 && n < 1000000);
    const usage = validUsage ? { textTokens: tokens[0], imageTokens: tokens[1], outputTokens: tokens[2] } : null;
    // Standard rates checked 2026-09-08. Missing usage stays conservatively budgeted.
    const costMicros = validUsage ? tokens[0] * 5 + tokens[1] * 8 + tokens[2] * 30 : 250000;
    return { state: 'succeeded', bytes, usage, costMicros };
  } catch { return { state: 'unknown' }; }
}
