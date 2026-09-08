import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, lstatSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { installImageKey, verifyAndInstallImageKey } from "../ops/install-image-key.mjs";

test("replacement verifies with OpenAI before changing only the selected key", async t => {
  const directory = mkdtempSync(join(tmpdir(), "titans-key-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "test.env");
  const oldKey = `sk-test-${"a".repeat(64)}`;
  const newKey = `sk-test-${"b".repeat(64)}`;
  const before = `OTHER_SETTING=preserved\nOPENAI_API_KEY=${oldKey}\nLAST=yes\n`;
  writeFileSync(path, before);
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(verifyAndInstallImageKey(path, newKey, {
      replace: true, fetchImpl: async () => new Response("", { status })
    }), /verification failed/);
    assert.equal(readFileSync(path, "utf8"), before);
  }
  await verifyAndInstallImageKey(path, newKey, { replace: true, fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/models/gpt-image-2");
    assert.equal(options.headers.Authorization, `Bearer ${newKey}`);
    assert.equal(options.redirect, "error");
    assert.equal(readFileSync(path, "utf8"), before);
    return new Response("{}", { status: 200 });
  } });
  assert.equal(readFileSync(path, "utf8"), before.replace(oldKey, newKey));
});

test("secure key setup preserves existing configuration and refuses accidental replacement", t => {
  const directory = mkdtempSync(join(tmpdir(), "titans-key-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "test.env");
  const before = "WHOP_APP_ID=test\nOTHER_SETTING=preserved\n";
  writeFileSync(path, before);
  const dummyKey = `sk-test-${"a".repeat(64)}`;
  installImageKey(path, dummyKey);
  assert.equal(readFileSync(path, "utf8"), `${before}OPENAI_API_KEY=${dummyKey}\n`);
  if (process.platform !== "win32") assert.equal(lstatSync(path).mode & 0o777, 0o600);
  assert.equal(existsSync(`${path}.image-key-next`), false);
  assert.throws(() => installImageKey(path, dummyKey), /already configured/);
  assert.equal(readFileSync(path, "utf8"), `${before}OPENAI_API_KEY=${dummyKey}\n`);
});

test("invalid key input cannot inject environment variables or alter the target", t => {
  const directory = mkdtempSync(join(tmpdir(), "titans-key-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "test.env");
  writeFileSync(path, "UNCHANGED=yes\n");
  for (const input of ["", "short", `sk-${"a".repeat(50)}\nOTHER=x`, `sk-${"a".repeat(301)}`]) {
    assert.throws(() => installImageKey(path, input), /Invalid key format/);
    assert.equal(readFileSync(path, "utf8"), "UNCHANGED=yes\n");
  }
});
