import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, fsyncSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const LIMIT = 5;
const ACCESSORIES = Object.freeze({
  preserve: 'Keep the original accessories exactly as shown. Do not add new jewelry.',
  studs: 'Add a discreet pair of small stud earrings with realistic metal reflections and natural placement. Keep other accessories unchanged.',
  hoops: 'Add a discreet pair of small hoop earrings with realistic metal reflections and natural placement. Keep other accessories unchanged.'
});
function selfiePrompt(accessory) {
  return `Create a hyper-realistic close-up smartphone selfie of the same person in the supplied original reference photo. Preserve their identity, apparent age, facial structure, skin tone, eye color, hairline, hairstyle, facial hair and distinctive features. Do not beautify, reshape, age or replace the person. Frame the full face, ears and upper shoulders, with the face filling most of the portrait and both eyes clearly in focus. Use a natural eye-level perspective without wide-angle distortion, relaxed expression, soft window light and a softly blurred background consistent with the original. Reveal realistic facial pores, subtle peach fuzz, fine skin texture, natural tonal variation, individual eyebrow hairs, eyelashes, detailed iris texture in the original eye color, moist eye highlights and natural lip texture. Keep all detail anatomically plausible and proportionate: no exaggerated pores, artificial sharpness, waxy skin, beauty filters, plastic smoothing or CGI appearance. ${ACCESSORIES[accessory]} This is an additional identity reference for a video workflow, not a collage or a crop of the original. One photographic image only, no text, logos or watermark.`;
}
export function validateInput(input) {
  if (!input || !UUID.test(input.id)) throw Error('invalid_input');
  if (input.kind === 'selfie') {
    if (!UUID.test(input.sourceId) || input.id === input.sourceId || !Object.hasOwn(ACCESSORIES, input.accessory)) throw Error('invalid_input');
  } else if ((input.kind !== undefined && input.kind !== 'original') || typeof input.prompt !== 'string' || input.prompt.trim().length < 10 || input.prompt.length > 4000) throw Error('invalid_input');
}
function validPng(bytes) {
  return bytes.length >= 24 && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.readUInt32BE(16) === 1024 && bytes.readUInt32BE(20) === 1536;
}
function originalReference(root, sourceId) {
  try {
    const source = JSON.parse(readFileSync(join(root, `${sourceId}.json`), 'utf8'));
    if (source.status !== 'succeeded' || (source.kind && source.kind !== 'original')) throw Error('invalid_source');
    const bytes = readFileSync(join(root, `${sourceId}.png`));
    if (bytes.length > 14 * 1024 * 1024 || !validPng(bytes)) throw Error('invalid_source');
    return { image_url: `data:image/png;base64,${bytes.toString('base64')}` };
  } catch { throw Error('invalid_source'); }
}
function save(path, value) {
  const fd = openSync(`${path}.next`, 'w', 0o600);
  try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(`${path}.next`, path);
  if (process.platform !== 'win32') {
    const directory = openSync(dirname(path), 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
}
function publicJob(job) {
  const { id, status, createdAt, finishedAt, usage, message, kind = 'original', sourceId, accessory } = job;
  return { id, status, createdAt, finishedAt, usage, message, kind, sourceId, accessory };
}
export function getSnapshot(root) {
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const jobs = readdirSync(root).filter(name => UUID.test(name.replace(/\.json$/, '')) && name.endsWith('.json'))
    .map(name => JSON.parse(readFileSync(join(root, name), 'utf8'))).sort((a, b) => b.createdAt - a.createdAt);
  return { jobs: jobs.map(publicJob), attemptsRemaining: Math.max(0, LIMIT - jobs.length), attemptLimit: LIMIT };
}
export async function runGeneration(root, input, { apiKey, fetchImpl = fetch } = {}) {
  validateInput(input);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const path = join(root, `${input.id}.json`);
  const kind = input.kind || 'original';
  const prompt = kind === 'selfie' ? selfiePrompt(input.accessory) : input.prompt;
  const hash = createHash('sha256').update(kind === 'selfie' ? JSON.stringify({ kind, sourceId: input.sourceId, prompt }) : prompt).digest('hex');
  if (existsSync(path)) {
    const previous = JSON.parse(readFileSync(path, 'utf8'));
    if (previous.hash !== hash) throw Error('intent_conflict');
    return publicJob(previous);
  }
  const lock = join(root, 'generation.lock');
  let fd;
  try { fd = openSync(lock, 'wx', 0o600); } catch { throw Error('busy'); }
  let job;
  try {
    // Another process may have completed this intent between the first check and our lock.
    if (existsSync(path)) {
      const previous = JSON.parse(readFileSync(path, 'utf8'));
      if (previous.hash !== hash) throw Error('intent_conflict');
      return publicJob(previous);
    }
    const state = getSnapshot(root);
    if (state.jobs.some(item => ['running', 'unknown'].includes(item.status))) throw Error('needs_review');
    if (!state.attemptsRemaining) throw Error('preview_limit');
    if (!apiKey) throw Error('not_configured');
    const body = { model: 'gpt-image-2', prompt, quality: 'high', size: '1024x1536', n: 1, output_format: 'png' };
    // Resolve only our saved original before claiming a paid attempt. No user URLs or paths.
    if (kind === 'selfie') body.images = [originalReference(root, input.sourceId)];
    job = { id: input.id, hash, kind, status: 'running', createdAt: Date.now(), ...(kind === 'selfie' ? { sourceId: input.sourceId, accessory: input.accessory } : {}) };
    save(path, JSON.stringify(job));
    try {
      const response = await fetchImpl(`https://api.openai.com/v1/images/${kind === 'selfie' ? 'edits' : 'generations'}`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        await response.body?.cancel();
        job.status = [400, 401, 403, 404, 422, 429].includes(response.status) ? 'failed' : 'unknown';
        job.message = job.status === 'failed' ? 'OpenAI did not complete this request. Ask Gage to check the test setup or try a different prompt.' : 'The outcome is uncertain. New generation is paused for review; do not retry.';
      } else {
        const chunks = []; let size = 0;
        for await (const chunk of response.body) {
          size += chunk.length;
          if (size > 24 * 1024 * 1024) throw Error('response_too_large');
          chunks.push(chunk);
        }
        const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const b64 = result?.data?.[0]?.b64_json;
        if (typeof b64 !== 'string' || result.data.length !== 1) throw Error('invalid_result');
        const bytes = Buffer.from(b64, 'base64');
        if (!validPng(bytes)) throw Error('invalid_image');
        save(join(root, `${input.id}.png`), bytes);
        const usage = result.usage;
        const numbers = [usage?.input_tokens_details?.text_tokens, usage?.input_tokens_details?.image_tokens, usage?.output_tokens];
        if (numbers.every(value => Number.isSafeInteger(value) && value >= 0)) {
          job.usage = { textTokens: numbers[0], imageTokens: numbers[1], outputTokens: numbers[2] };
        }
        job.status = 'succeeded';
      }
    } catch {
      job.status = 'unknown';
      job.message = 'The request was interrupted or its result could not be saved. Generation is paused for review; do not retry.';
    }
    job.finishedAt = Date.now();
    save(path, JSON.stringify(job));
    return publicJob(job);
  } finally { closeSync(fd); unlinkSync(lock); }
}

async function execute(input) {
  const root = '/var/lib/titans-image-preview';
  if (input.action === 'state') return Buffer.from(JSON.stringify(getSnapshot(root)));
  if (input.action === 'image' && UUID.test(input.id)) {
    const job = JSON.parse(readFileSync(join(root, `${input.id}.json`), 'utf8'));
    if (job.status !== 'succeeded') throw Error('not_ready');
    return readFileSync(join(root, `${input.id}.png`));
  }
  if (input.action === 'generate') {
    const apiKey = parseEnv(readFileSync('/opt/titans-whop-auth/whop-auth.env', 'utf8')).OPENAI_API_KEY;
    return Buffer.from(JSON.stringify(await runGeneration(root, input, { apiKey })));
  }
  throw Error('invalid_input');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--serve')) {
  // Private RPC over one authenticated SSH stdio connection; no TCP listener.
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on('line', async line => {
    let envelope;
    try {
      if (Buffer.byteLength(line) > 22000) throw Error('invalid_input');
      envelope = JSON.parse(line);
      if (!UUID.test(envelope.requestId)) throw Error('invalid_input');
      const result = await execute(envelope.input);
      process.stdout.write(JSON.stringify({ requestId: envelope.requestId, result: result.toString('base64') }) + '\n');
    } catch {
      if (UUID.test(envelope?.requestId)) process.stdout.write(JSON.stringify({ requestId: envelope.requestId, error: 'operation_failed' }) + '\n');
    }
  });
} else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const chunks = []; let size = 0;
    for await (const chunk of process.stdin) { size += chunk.length; if (size > 20000) throw Error('invalid_input'); chunks.push(chunk); }
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    process.stdout.write(await execute(input));
  } catch { process.stderr.write('Image preview operation did not complete. No credentials or provider error text logged.\n'); process.exitCode = 1; }
}
