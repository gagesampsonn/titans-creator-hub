import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

test('a rejected image request keeps its error after refreshing an earlier successful photo', async () => {
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      id, attributes: {}, handlers: {}, content: {},
      textContent: id === 'imagePromptOutput' ? 'A completed adult portrait prompt.' : '',
      checked: id === 'flow-consent', disabled: false,
      classList: { toggle() {} },
      addEventListener(name, callback) { this.handlers[name] = callback; },
      append() {}, after() {}, scrollIntoView() {}, showModal() {}, close() {},
      getAttribute(name) { return this.attributes[name] ?? null; },
    });
    return nodes.get(id);
  }
  const oldId = randomUUID();
  const state = {
    credits: 14, generationEnabled: true, salesEnabled: false, packs: [],
    jobs: [{ id: oldId, kind: 'original', state: 'succeeded', imageUrl: `/image-api/images/${oldId}` }],
  };
  let requests = 0, stateReads = 0, createdElements = 0;
  const context = vm.createContext({
    document: { getElementById: element, createElement: () => element(`created-${++createdElements}`) },
    fetch: async (path, options) => {
      if (path === '/image-api/state') {
        stateReads++;
        return Response.json({ data: state });
      }
      if (path === '/assets/image-builder-panel.html') return new Response('<section>First-party test template</section>');
      assert.equal(path, '/image-api/generations');
      assert.equal(options.method, 'POST');
      assert.notEqual(JSON.parse(options.body).id, oldId);
      requests++;
      return Response.json({ error: 'invalid_reference' }, { status: 400 });
    },
    AbortSignal, TextEncoder, URL, Intl, crypto: globalThis.crypto,
    MutationObserver: class { observe() {} },
    clearTimeout() {}, setTimeout() {},
  });
  const code = await readFile(new URL('../assets/image-builder.js', import.meta.url), 'utf8');
  // Explicitly await initialization instead of racing its fire-and-forget bootstrap.
  vm.runInContext(code.replace(/initialize\(\)\.catch\([\s\S]*$/, ''), context);
  await vm.runInContext('initialize()', context);
  assert.equal(element('flow-generate').disabled, false);

  await element('flow-generate').handlers.click();

  assert.equal(requests, 1);
  assert.equal(stateReads, 2, 'reconcile the account before allowing another submission');
  assert.match(element('flow-status').textContent, /PNG, JPG or WebP/);
  assert.doesNotMatch(element('flow-status').textContent, /Your photo is ready/);
  assert.equal(element('flow-credits').textContent, 14);
});
