import { lstatSync, readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Invoked over SSH with the secret on stdin, never in shell arguments or logs.
export function installImageKey(envPath, key, { replace = false } = {}) {
  if (typeof key !== "string" || !/^sk-[A-Za-z0-9_-]{40,300}$/.test(key)) throw Error("Invalid key format");
  if (!lstatSync(envPath).isFile()) throw Error("Environment target must be a regular file");
  const existing = readFileSync(envPath, "utf8");
  const definitions = existing.match(/^[\t ]*(?:export[\t ]+)?OPENAI_API_KEY[\t ]*=/gm) || [];
  if (definitions.length && !replace) throw Error("An image key is already configured; no changes made");
  if (definitions.length > 1) throw Error("Ambiguous key configuration; no changes made");
  // Replacement is deliberately limited to the single-line format this helper writes.
  const keyLine = /^[\t ]*(?:export[\t ]+)?OPENAI_API_KEY[\t ]*=sk-[A-Za-z0-9_-]+[\t ]*(?=\r?$)/m;
  if (definitions.length && !keyLine.test(existing)) throw Error("Unsupported key configuration; no changes made");
  const updated = definitions.length ? existing.replace(keyLine, `OPENAI_API_KEY=${key}`)
    : `${existing.replace(/\s*$/, "")}\nOPENAI_API_KEY=${key}\n`;
  const staged = `${envPath}.image-key-next`;
  const fd = openSync(staged, "wx", 0o600);
  try {
    writeFileSync(fd, updated);
    fsyncSync(fd);
  } finally { closeSync(fd); }
  renameSync(staged, envPath);
  if (process.platform !== "win32") {
    const directory = openSync(dirname(envPath), "r");
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
}

export async function verifyAndInstallImageKey(envPath, key, { replace = false, fetchImpl = fetch } = {}) {
  if (typeof key !== "string" || !/^sk-[A-Za-z0-9_-]{40,300}$/.test(key)) throw Error("Invalid key format");
  let accepted = false;
  try {
    const response = await fetchImpl("https://api.openai.com/v1/models/gpt-image-2", {
      headers: { Authorization: `Bearer ${key}` }, redirect: "error", signal: AbortSignal.timeout(15000)
    });
    accepted = response.status === 200;
    await response.body?.cancel();
  } catch { /* Provider errors can contain credentials; never expose them. */ }
  if (!accepted) throw Error("OpenAI key verification failed; saved configuration unchanged");
  installImageKey(envPath, key, { replace });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.getuid?.() !== 0) throw Error("Root required");
    if (process.argv.slice(2).some(arg => arg !== "--replace")) throw Error("Unknown option");
    const chunks = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 512) throw Error("Input too large");
      chunks.push(chunk);
    }
    await verifyAndInstallImageKey("/opt/titans-whop-auth/whop-auth.env", Buffer.concat(chunks).toString("utf8").trim(), {
      replace: process.argv.includes("--replace")
    });
    process.stdout.write("OpenAI authentication and gpt-image-2 access verified. Backend key installed. No images generated or services restarted.\n");
  } catch {
    process.stderr.write("Key installation did not complete. No key value was logged. Ask Codex to check the setup.\n");
    process.exitCode = 1;
  }
}
