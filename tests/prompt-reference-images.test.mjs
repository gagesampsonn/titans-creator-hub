import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

function builder(route = "prompt") {
  const html = readFileSync(new URL(`../${route}/index.html`, import.meta.url), "utf8");
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: "", textContent: "", hidden: true, events: {}, classList: { add() {}, remove() {} }, addEventListener(event, callback) { this.events[event] = callback; }, closest() { return this; } });
    return elements.get(id);
  };
  const reset = () => { element("mode").value = "person"; element("strictness").value = "strict"; element("referenceImageCount").value = "1"; element("extra").value = ""; };
  reset();
  element("promptForm").reset = reset;
  const definitions = html.slice(html.indexOf("    const modeCopy ="), html.indexOf("    buildImagePrompt(true);", html.indexOf("    const modeCopy =")));
  const logic = html.slice(html.indexOf("    function invalidatePrompt()"), html.indexOf('    document.querySelectorAll("[data-jump]")'));
  const copied = [];
  vm.runInNewContext(definitions + logic, { document: { getElementById: element }, copyText: text => copied.push(text) });
  return { element, copied, generate() { element("promptForm").events.submit({ preventDefault() {} }); return element("promptOutput").textContent; } };
}

test("one image retains the existing single-reference prompt", () => {
  const page = builder();
  const text = page.generate();
  assert.match(text, /@Video1/);
  assert.match(text, /@Image1/);
  assert.doesNotMatch(text, /@Image2|supporting views/);
});

test("two through six images are named explicitly across every replacement mode", () => {
  for (const route of ["prompt", "generator"]) for (const mode of ["person", "clothing", "vehicle", "product", "background", "other"]) for (const count of [2, 3, 6]) {
    const page = builder(route);
    page.element("referenceImageCount").value = String(count);
    page.element("mode").value = mode;
    page.element("extra").value = mode === "other" ? "the wall clock" : "";
    const text = page.generate();
    for (let index = 1; index <= count; index++) assert.ok(text.includes(`@Image${index}`));
    assert.ok(!text.includes(`@Image${count + 1}`));
    assert.match(text, /@Image1 as the primary visual reference/);
    assert.match(text, /supporting views of the same/);
    assert.match(text, /@Video1/);
    if (mode === "background") assert.doesNotMatch(text, /perspective, environment, background/);
  }
});

test("changing the count clears stale output, refreshes attachment help and reset returns to one", async () => {
  const page = builder();
  page.generate();
  page.element("referenceImageCount").value = "2";
  page.element("referenceImageCount").events.change();
  assert.equal(page.element("promptResult").hidden, true);
  assert.equal(page.element("promptOutput").textContent, "");
  assert.match(page.element("referenceImageHint").textContent, /@Image1 and @Image2/);
  assert.match(page.element("promptReferenceNote").textContent, /Image2/);
  const text = page.generate();
  await page.element("copyBtn").events.click();
  assert.equal(page.copied[0], text);
  page.element("resetBtn").events.click();
  assert.equal(page.element("referenceImageCount").value, "1");
  assert.doesNotMatch(page.generate(), /@Image2/);
});

test("malformed and out-of-range counts cannot generate nonexistent reference tags", () => {
  for (const count of ["0", "7", "-1", "2.5", "1000000", "<script>", ""]) {
    const page = builder(); page.element("referenceImageCount").value = count;
    assert.doesNotMatch(page.generate(), /@Image2/);
  }
});
