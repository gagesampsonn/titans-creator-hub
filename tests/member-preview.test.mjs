import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

test("preview respects an independent loopback port and serves affiliate POST fixtures", async t => {
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL("member-preview.mjs", import.meta.url))], {
    env: { ...process.env, TITANS_PREVIEW_PORT: String(port) }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error("preview_start_timeout")), 5000);
    t.after(() => clearTimeout(timeout));
    child.once("error", reject);
    child.once("exit", () => reject(Error("preview_exited_before_ready")));
    child.stdout.once("data", data => { assert.match(String(data), new RegExp(`127\\.0\\.0\\.1:${port}/`)); clearTimeout(timeout); resolve(); });
  });
  const response = await fetch(`http://127.0.0.1:${port}/auth/whop/affiliates`, { method: "POST" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.preview, true);
});
