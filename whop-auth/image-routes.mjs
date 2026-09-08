import { IMAGE_UUID } from './image-provider.mjs';

const errors = {
  authentication_required: 401, access_required: 403, invalid_origin: 403,
  invalid_request: 400, invalid_prompt: 400, invalid_reference: 400, invalid_source: 400,
  consent_required: 400, source_unavailable: 404, image_not_found: 404,
  request_conflict: 409, request_in_progress: 409, capacity_limit: 429, rate_limit: 429,
  credits_exhausted: 402, spend_limit: 503, generation_paused: 503, generation_not_configured: 503,
  body_limit: 413, invalid_json: 400, invalid_content_type: 415,
  storage_capacity: 503,
  credit_sales_paused: 503, checkout_pending_review: 409, invalid_signature: 400,
  payment_mismatch: 409, invalid_payment: 400, invalid_money: 400
};
function send(res, status, value, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(Buffer.isBuffer(value) ? value : JSON.stringify(value));
}
async function readInput(req, raw = false) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) throw Error('invalid_content_type');
  const limit = raw ? 262144 : 11200000;
  if (Number(req.headers['content-length']) > limit) throw Error('body_limit');
  let size = 0; const chunks = [];
  const timeout = setTimeout(() => req.destroy(), 30000);
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) throw Error('body_limit');
      chunks.push(chunk);
    }
    try {
      const text = Buffer.concat(chunks).toString('utf8');
      if (raw) return text;
      const input = JSON.parse(text);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('invalid_json');
      return input;
    } catch { throw Error('invalid_json'); }
  } finally { clearTimeout(timeout); }
}
export function createImageHandler({ service, billing, authorize, origin }) {
  let uploads = 0;
  return async (req, res, url) => {
    try {
      if (!service) { send(res, 404, { error: 'images_unavailable' }); return; }
      if (req.method === 'POST' && url.pathname === '/image-api/whop-webhook' && billing) {
        send(res, 200, { data: await billing.webhook(await readInput(req, true), req.headers) }); return;
      }
      const userId = await authorize(req);
      if (req.method === 'GET' && url.pathname === '/image-api/state') {
        send(res, 200, { data: await service.state(userId) }); return;
      }
      const id = url.pathname.startsWith('/image-api/images/') ? url.pathname.slice('/image-api/images/'.length) : null;
      if (req.method === 'GET' && IMAGE_UUID.test(id)) {
        const image = await service.image(userId, id);
        send(res, 200, image, { 'Content-Type': 'image/png', 'Content-Length': image.length,
          'Content-Disposition': `${url.searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="titans-${id}.png"` }); return;
      }
      if (req.method === 'POST' && url.pathname === '/image-api/generations') {
        if (req.headers.origin !== origin || req.headers['x-titans-images'] !== '1') throw Error('invalid_origin');
        if (uploads >= 2) throw Error('capacity_limit');
        uploads++;
        try { send(res, 202, { data: await service.start(userId, await readInput(req)) }); }
        finally { uploads--; }
        return;
      }
      if (req.method === 'POST' && url.pathname === '/image-api/checkout' && billing) {
        if (req.headers.origin !== origin || req.headers['x-titans-images'] !== '1') throw Error('invalid_origin');
        send(res, 200, { data: await billing.checkout(userId, await readInput(req)) }); return;
      }
      send(res, 404, { error: 'not_found' });
    } catch (error) {
      const code = Object.hasOwn(errors, error?.message) ? error.message : 'images_unavailable';
      send(res, errors[code] ?? 503, { error: code });
    }
  };
}
