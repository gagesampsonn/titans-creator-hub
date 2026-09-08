import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Caddy routes allow only bounded affiliate usernames and fixed product destinations", () => {
  const config = readFileSync(new URL("../ops/Caddyfile.referrals", import.meta.url), "utf8");
  const ai = new RegExp(config.match(/path_regexp titans_ai_ref (.+)/)[1]);
  const exclusive = new RegExp(config.match(/path_regexp titans_exclusive_ref (.+)/)[1]);
  for (const name of ["mitchschill", "real.member_1", "a-b"]) {
    for (const suffix of ["", "/"]) {
      assert.equal(ai.exec(`/r/${name}${suffix}`)?.[1], name);
      assert.equal(exclusive.exec(`/r/${name}/exclusive${suffix}`)?.[1], name);
    }
  }
  for (const path of ["/r/", "/r/a/other", "/r/a//exclusive", `/r/${"a".repeat(65)}`, "/r/a%2Fb", "/r/a?x=y"]) {
    assert.equal(ai.test(path) || exclusive.test(path), false);
  }
  assert.match(config, /redir @titans_ai_ref "\/ai\/\?a=\{re\.titans_ai_ref\.1\}" 302/);
  assert.match(config, /redir @titans_exclusive_ref "\/exclusive\/\?a=\{re\.titans_exclusive_ref\.1\}" 302/);
  assert.match(config, /respond "Referral link not found" 404/);
  const preview = readFileSync(new URL("./member-preview.mjs", import.meta.url), "utf8");
  assert.ok(preview.includes(ai.source));
  assert.ok(preview.includes(exclusive.source));
});
