import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '../..');
export function composeWorkflowPreview(source) {
  return source.replace(/\r\n?/g, '\n')
    .replace('<script src="/assets/member-access.js" defer></script>', '')
    .replace('<script type="module" src="/assets/image-builder.js"></script>', '')
    .replace(/    const resultVideos = [\s\S]*?\n    syncReferenceImageHelp\(\);/, '    syncReferenceImageHelp();')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/g, '<p>Walkthrough video remains available in the live guide.</p>')
    .replace(/<video\b/g, '<video controls')
    .replace('<body>', '<body class="workflow-preview"><aside class="wf-preview-note">LOCAL DESIGN PREVIEW · Images are simulated · No charges or account changes</aside>')
    .replace('</head>', '<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/__demo/demo-style.css"><link rel="stylesheet" href="/__workflow/workflow.css"><script type="module" src="/__workflow/workflow-app.js"></script><script type="module" src="/__demo/demo-app.js"></script></head>');
}
export function createWorkflowPreview() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
  const files = new Map();
  for (const name of ['workflow-app.js', 'workflow.css', 'stages.mjs']) files.set(`/__workflow/${name}`, join(import.meta.dirname, name));
  for (const name of ['demo-app.js', 'demo-style.css', 'demo-model.mjs', 'panel.html']) files.set(`/__demo/${name}`, join(root, 'ops/builder-preview', name));
  for (const name of ['character-library.js', 'character-compatibility.js', 'character-summary.js', 'character-controls.css']) files.set(`/prompt/${name}`, join(root, 'prompt', name));
  files.set('/assets/image-builder.css', join(root, 'assets/image-builder.css'));
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
    const port = server.address().port;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) return res.writeHead(403).end('Invalid local host');
    if (req.method !== 'GET') return res.writeHead(405).end('Local design preview: writes disabled');
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const html = composeWorkflowPreview(readFileSync(join(root, 'prompt/index.html'), 'utf8'));
      const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].filter(m => m[1].trim()).map(m => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
      res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'`);
      if (url.pathname === '/') return res.writeHead(302, { Location: '/prompt/' }).end();
      if (['/prompt/', '/generator/'].includes(url.pathname)) return res.writeHead(200, { 'Content-Type': types['.html'] }).end(html);
      if (url.pathname === '/responsive') {
        const width = Number(url.searchParams.get('width'));
        if (![320, 390, 768, 1024, 1440].includes(width)) return res.writeHead(400).end('Choose a supported width');
        return res.writeHead(200, { 'Content-Type': types['.html'] }).end(`<!doctype html><title>Workflow ${width}px review</title><style>body{margin:0;background:#252525;color:white;font:14px Arial}p{padding:8px}iframe{display:block;border:0;width:${width}px;height:900px;margin:auto;}</style><p>Local responsive review · ${width}px</p><iframe title="${width}px workflow preview" src="/prompt/"></iframe>`);
      }
      if (url.pathname === '/favicon.ico') return res.writeHead(204).end();
      if (['/__demo/image/original', '/__demo/image/selfie'].includes(url.pathname)) {
        // Only read the fixed, already-generated samples from the existing local mock.
        const response = await fetch(`http://127.0.0.1:8892${url.pathname}`, { signal: AbortSignal.timeout(25000), redirect: 'error' });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw Error('sample_unavailable');
        const chunks = []; let size = 0;
        for await (const chunk of response.body) { size += chunk.length; if (size > 9 * 1024 * 1024) throw Error('sample_too_large'); chunks.push(chunk); }
        if (url.searchParams.has('download')) res.setHeader('Content-Disposition', `attachment; filename="titans-preview-${url.pathname.endsWith('selfie') ? 'selfie' : 'original'}.png"`);
        return res.writeHead(200, { 'Content-Type': 'image/png' }).end(Buffer.concat(chunks));
      }
      let path = files.get(url.pathname);
      if (!path && url.pathname.startsWith('/prompt/assets/')) {
        const candidate = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (candidate.startsWith(join(root, 'prompt/assets') + sep) && types[extname(candidate)]) path = candidate;
      }
      if (!path || !existsSync(path) || !statSync(path).isFile()) return res.writeHead(404).end('Not part of this preview');
      res.writeHead(200, { 'Content-Type': types[extname(path)] }); createReadStream(path).pipe(res);
    } catch { res.writeHead(503).end('Saved sample unavailable; no generation or charge occurred.'); }
  });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) createWorkflowPreview().listen(8896, '127.0.0.1', () => console.log('Local workflow: http://127.0.0.1:8896/prompt/'));
