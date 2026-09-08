import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production image client never imports mock credits or sample images', async () => {
  const code = await readFile(new URL('../assets/image-builder.js', import.meta.url), 'utf8');
  const panel = await readFile(new URL('../assets/image-builder-panel.html', import.meta.url), 'utf8');
  assert.doesNotMatch(code + panel, /__demo|createDemoSession|MOCK CHECKOUT|saved test|Demo photo/i);
  assert.match(code, /\/image-api\/generations/);
  assert.match(code, /credentials: 'same-origin'/);
  assert.match(code, /x-titans-images/);
  assert.match(panel, /flow-consent/);
  assert.doesNotMatch(code, /OPENAI_API_KEY|sk-proj-/);
});
