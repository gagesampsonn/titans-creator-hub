import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../checkout/complete/index.html", import.meta.url), "utf8");
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];

function checkout(search) {
  const elements = new Map();
  const redirects = [];
  vm.runInNewContext(script, {
    URLSearchParams,
    window: { location: { search, replace: (path) => redirects.push(path) } },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { removeAttribute() {} });
        return elements.get(id);
      },
    },
  });
  return { elements, redirects };
}

test("Exclusive completion opens the protected course for both Whop return formats", () => {
  for (const query of ["?product=exclusive", "?product=exclusive&status=success"]) {
    const { redirects, elements } = checkout(query);
    assert.deepEqual(redirects, ["/exclusive/course/"]);
    assert.equal(elements.get("access-link").href, "/exclusive/course/");
  }
});

test("failed or canceled payments retain the retry path", () => {
  const { redirects, elements } = checkout("?product=exclusive&status=error");
  assert.deepEqual(redirects, []);
  assert.equal(elements.get("product-link").href, "/exclusive/");
  assert.equal(elements.get("product-link").textContent, "Return to checkout");
});

test("unknown status and product cannot trigger a redirect", () => {
  for (const query of ["?product=exclusive&status=pending", "?product=unknown&status=success", "?product=__proto__", ""]) {
    assert.deepEqual(checkout(query).redirects, []);
  }
});

test("AI and Weekly retain their existing product destinations", () => {
  const ai = checkout("?product=ai&status=success");
  assert.deepEqual(ai.redirects, []);
  assert.equal(ai.elements.get("access-link").href, "/auth/whop/login?next=%2Fprompt%2F");
  const weekly = checkout("?product=weekly&status=success");
  assert.deepEqual(weekly.redirects, []);
  assert.equal(weekly.elements.get("product-link").href, "/weekly/");
});
