import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, fsyncSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const LIMIT = 5;
export function validateInput(input) {
  if (!input || !UUID.test(input.id) || typeof input.prompt !== 'string' || input.prompt.trim().length < 10 || input.prompt.length > 4000) throw Error('invalid_input');
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
  const { id, status, createdAt, finishedAt, usage, message } = job;
  return { id, status, createdAt, finishedAt, usage, message };
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
  const hash = createHash('sha256').update(input.prompt).digest('hex');
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
    job = { id: input.id, hash, status: 'running', createdAt: Date.now() };
    save(path, JSON.stringify(job));
    try {
      const response = await fetchImpl('https://api.openai.com/v1/images/generations', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(300000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-image-2', prompt: input.prompt, quality: 'high', size: '1024x1536', n: 1, output_format: 'png' })
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
        if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) !== 1024 || bytes.readUInt32BE(20) !== 1536) throw Error('invalid_image');
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
