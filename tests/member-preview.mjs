// Loopback-only browser fixtures. Run with: node tests/member-preview.mjs
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
const root = resolve(import.meta.dirname, "..");
const startedAt = Date.now();
http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname.startsWith("/__preview/")) {
    const mode = url.pathname.split("/")[2];
    if (!["ai", "exclusive", "none", "weekly", "expired", "error", "unauth"].includes(mode)) { res.writeHead(404).end(); return; }
    res.writeHead(302, { "Set-Cookie": `preview_member=${mode}; Path=/; SameSite=Lax`, Location: "/members/" }).end(); return;
  }
  if (url.pathname === "/auth/whop/member") {
    const mode = /preview_member=([a-z]+)/.exec(req.headers.cookie ?? "")?.[1] ?? "ai";
    if (["error", "unauth"].includes(mode)) { res.writeHead(mode === "error" ? 503 : 401, { "Content-Type": "application/json" }).end('{}'); return; }
    const exclusive = mode === "exclusive";
    const aiPurchased = ["ai", "expired"].includes(mode);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ data: { access: { ai: aiPurchased || exclusive, aiPurchased, exclusive, weekly: mode === "weekly" },
      offer: mode === "ai" && Date.now() < startedAt + 600000 ? { expiresAt: startedAt + 600000 } : null,
      serverTime: Date.now(), upgradeCsrf: "preview-only" } })); return;
  }
  if (url.pathname === "/auth/whop/upgrade") { res.writeHead(503, { "Content-Type": "application/json" }).end('{}'); return; }
  const file = resolve(root, `.${decodeURIComponent(url.pathname)}`, url.pathname.endsWith("/") ? "index.html" : "");
  if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end("Not found"); return; }
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp" };
  res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(8876, "127.0.0.1", () => console.log("Member preview: http://127.0.0.1:8876/__preview/ai"));
