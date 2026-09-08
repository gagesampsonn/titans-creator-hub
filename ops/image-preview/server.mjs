import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { validateInput } from './worker.mjs';

function createSshBridge() {
  let child = null, buffer = '', retryAfter = 0;
  const pending = new Map();
  function disconnect() {
    child = null; buffer = ''; retryAfter = Date.now() + 60000;
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('bridge_unavailable')); }
    pending.clear();
  }
  const bridge = input => new Promise((resolveResult, reject) => {
    if (!child && Date.now() < retryAfter) { reject(Error('bridge_unavailable')); return; }
    if (!child) {
      child = spawn('ssh', ['-T', '-i', 'C:/Users/gages/.ssh/titans_contabo', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=2', 'root@85.239.242.45', 'node /opt/titans-image-preview/worker.mjs --serve'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', chunk => {
        buffer += chunk;
        if (buffer.length > 34 * 1024 * 1024) { child?.kill(); return; }
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
          try {
            const result = JSON.parse(line), item = pending.get(result.requestId);
            if (!item) continue;
            clearTimeout(item.timer); pending.delete(result.requestId);
            result.error ? item.reject(Error('operation_failed')) : item.resolve(Buffer.from(result.result, 'base64'));
          } catch { child?.kill(); }
        }
      });
      child.stderr.resume(); child.stdin.on('error', () => {});
      child.on('error', disconnect); child.on('close', disconnect);
    }
    const requestId = randomUUID();
    const timer = setTimeout(() => { pending.delete(requestId); reject(Error('bridge_timeout')); }, input.action === 'generate' ? 330000 : 20000);
    pending.set(requestId, { resolve: resolveResult, reject, timer });
    child.stdin.write(JSON.stringify({ requestId, input }) + '\n');
  });
  bridge.close = () => child?.kill();
  return bridge;
}

export function createPreviewServer({ bridge = createSshBridge() } = {}) {
  const assets = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
  let active = null; let bridgeWarning = null;
  const server = http.createServer(async (req, res) => {
    const port = server.address().port;
    const host = req.headers.host;
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(host)) { send(403, { error: 'Invalid preview host.' }); return; }
    try {
      const url = new URL(req.url, `http://${host}`);
      if (req.method === 'GET' && assets.has(url.pathname)) {
        const [name, type] = assets.get(url.pathname);
        res.writeHead(200, { 'Content-Type': type }).end(readFileSync(join(import.meta.dirname, name))); return;
      }
      if (req.method === 'GET' && url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        const state = JSON.parse((await bridge({ action: 'state' })).toString('utf8'));
        send(200, { ...state, active, bridgeWarning }); return;
      }
      if (req.method === 'GET' && /^\/api\/images\/[a-f0-9-]{36}$/.test(url.pathname)) {
        const image = await bridge({ action: 'image', id: url.pathname.split('/').at(-1) });
        res.setHeader('Content-Type', 'image/png');
        if (url.searchParams.has('download')) res.setHeader('Content-Disposition', 'attachment; filename="titans-image.png"');
        res.writeHead(200).end(image); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/generations') {
        if (req.headers.origin !== `http://${host}`) { send(403, { error: 'Open the preview directly to generate.' }); return; }
        if (req.headers['content-type'] !== 'application/json') { send(415, { error: 'JSON required.' }); return; }
        if (active || bridgeWarning) { send(409, { error: 'A request is active or needs review. No additional request was sent.' }); return; }
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 20000) { send(413, { error: 'Prompt is too large.' }); return; } }
        let input;
        try { input = JSON.parse(body); validateInput(input); } catch { send(400, { error: 'Enter a valid prompt or select a saved original and a supported selfie accessory option.' }); return; }
        if (active || bridgeWarning) { send(409, { error: 'A request is active or needs review. No additional request was sent.' }); return; }
        active = input.id;
        const intent = input.kind === 'selfie' ? { kind: 'selfie', sourceId: input.sourceId, accessory: input.accessory } : { prompt: input.prompt };
        bridge({ action: 'generate', id: input.id, ...intent }).catch(() => {
          bridgeWarning = 'The test connection needs review. No automatic retry was sent.';
        }).finally(() => { active = null; });
        send(202, { id: input.id }); return;
      }
      send(404, { error: 'Not found.' });
    } catch { send(503, { error: 'The private test connection is unavailable. No automatic generation retry was sent.' }); }
  });
  server.on('close', () => bridge.close?.());
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(8891, '127.0.0.1', () => console.log('Titans image preview: http://127.0.0.1:8891/'));
}
