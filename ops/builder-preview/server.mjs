import http from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { composeCharacterUpgrade, upgradeRoot } from './character-upgrade.mjs';

const root = resolve(import.meta.dirname, '../..');
const samples = { original:'b97538f0-d0f2-4a60-9eba-b715561e5a38', selfie:'347ae7f3-3741-4890-bfd3-21e18e551717' };
const cache = new Map();
async function loadSavedSample(kind) {
  if (cache.has(kind)) return cache.get(kind);
  // Read only the two already-generated examples. Never forward a generation request.
  const response = await fetch(`http://127.0.0.1:8891/api/images/${samples[kind]}`, {redirect:'error',signal:AbortSignal.timeout(20000)});
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw Error('sample_unavailable');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > 9*1024*1024) throw Error('sample_too_large'); chunks.push(chunk); }
  const image = Buffer.concat(chunks); cache.set(kind,image); return image;
}
export function createBuilderPreview({ loadSample = loadSavedSample } = {}) {
  const html = composeCharacterUpgrade(readFileSync(join(root,'prompt/index.html'),'utf8'),readFileSync(join(upgradeRoot,'source.html'),'utf8'))
    .replace(/\r\n?/g,'\n') // HTML parsing normalizes newlines before checking inline script hashes.
    .replace('<script src="/assets/member-access.js" defer></script>', '')
    .replace('</head>', '<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/__demo/demo-style.css"><script type="module" src="/__demo/demo-app.js"></script></head>');
  const scriptHashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].filter(match => match[1].trim()).map(match => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  const files = new Map(['demo-app.js','demo-style.css','demo-model.mjs','panel.html'].map(name => [`/__demo/${name}`,join(import.meta.dirname,name)]));
  files.set('/__demo/character-library.js',join(upgradeRoot,'character-library.js'));
  files.set('/__demo/character-compatibility.js',join(upgradeRoot,'character-compatibility.js'));
  files.set('/__demo/character-summary.js',join(upgradeRoot,'character-summary.js'));
  const types = {'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4'};
  const server = http.createServer(async(req,res) => {
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' ${scriptHashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`);
    const host = req.headers.host;
    if (![`127.0.0.1:${server.address().port}`,`localhost:${server.address().port}`].includes(host)) { res.writeHead(403).end('Invalid preview host'); return; }
    if (req.method !== 'GET') { res.writeHead(405).end('Mock preview: no payments, uploads or API generation'); return; }
    try {
      const url = new URL(req.url,`http://${host}`);
      if (url.pathname === '/') { res.writeHead(302,{Location:'/prompt/#character-builder'}).end(); return; }
      if (url.pathname === '/prompt/') { res.writeHead(200,{'Content-Type':types['.html']}).end(html); return; }
      if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
      const kind = url.pathname.replace('/__demo/image/','');
      if (url.pathname.startsWith('/__demo/image/') && Object.hasOwn(samples,kind)) {
        const image = await loadSample(kind);
        if(url.searchParams.has('download')) res.setHeader('Content-Disposition',`attachment; filename="titans-demo-${kind}.png"`);
        res.writeHead(200,{'Content-Type':'image/png'}).end(image); return;
      }
      let path = files.get(url.pathname);
      if (!path && url.pathname.startsWith('/prompt/assets/')) {
        const candidate = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (candidate.startsWith(join(root,'prompt','assets')+sep) && types[extname(candidate)]) path = candidate;
      }
      if (!path || !existsSync(path) || !statSync(path).isFile()) { res.writeHead(404).end('Not found in this preview'); return; }
      res.writeHead(200,{'Content-Type':types[extname(path)]}); createReadStream(path).pipe(res);
    } catch { res.writeHead(503).end('Saved example is unavailable. Keep the image test preview running on port 8891.'); }
  });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) createBuilderPreview().listen(8892,'127.0.0.1',() => console.log('Combined Prompt Builder mock: http://127.0.0.1:8892/prompt/#character-builder'));
