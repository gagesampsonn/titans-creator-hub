import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

test("approved resources link to and focus their exact reference; drafts and unsafe media stay hidden", async () => {
  class Node {
    constructor(tag = "div") { this.tag = tag; this.children = []; this.dataset = {}; this.attrs = {}; this.events = {}; }
    append(...children) { this.children.push(...children); }
    prepend(...children) { this.children.unshift(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attrs[key] = value; }
    addEventListener(key, fn) { this.events[key] = fn; }
    querySelector() { return this.counter ??= new Node(); }
    querySelectorAll(tag) { return this.children.flatMap(child => [...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag)]); }
    focus() { this.focused = true; }
    scrollIntoView() { this.scrolled = true; }
    pause() {}
  }
  const elements = new Map();
  const element = key => { if (!elements.has(key)) elements.set(key, new Node()); return elements.get(key); };
  const tabs = ["referenceVideos", "hooks", "scripts", "captions", "talkingPoints"].map(type => { const node = new Node("button"); node.dataset.toolkitTab = type; return node; });
  element("[data-toolkit-product]").value = "ai";
  const window = {};
  const catalog = { schemaVersion: 1,
    referenceVideos: ["first", "second"].map(id => ({ id, title: id, product: "ai", status: "approved", media: { kind: "external", url: "https://www.youtube.com/watch?v=test" } })),
    hooks: [{ id: "hook", title: "Test resource", text: "Approved test text", product: "ai", status: "approved", referenceId: "second" }, { id: "draft", title: "Draft", text: "Draft test text", product: "ai", status: "draft" }],
  };
  catalog.referenceVideos.push({ id: "unsafe", title: "Unsafe", product: "ai", status: "approved", media: { kind: "external", url: "javascript:alert(1)" } });
  vm.runInNewContext(readFileSync(new URL("../assets/affiliate-toolkit.js", import.meta.url), "utf8"), {
    window, URL, document: { querySelector: element, querySelectorAll: () => tabs, createElement: tag => new Node(tag) },
    fetch: async () => ({ ok: true, json: async () => catalog }),
  });
  const copied = [];
  await window.TitansToolkit.load([{ product: "ai", url: "https://titans.example/ai/?a=test" }], text => copied.push(text));
  const panels = element("[data-toolkit-panels]");
  assert.equal(panels.children.length, 2);
  tabs[1].events.click();
  assert.equal(panels.children.length, 1);
  const buttons = panels.querySelectorAll("button");
  buttons.find(button => button.textContent === "Copy").events.click();
  assert.equal(copied[0], "Approved test text");
  buttons.find(button => button.textContent === "View reference: second").events.click();
  assert.equal(panels.children.length, 2);
  assert.equal(panels.children[1].attrs["aria-label"], "second");
  assert.equal(panels.children[1].focused, true);
  assert.equal(panels.children[1].scrolled, true);
  assert.equal(panels.children[0].focused, undefined);
});
