import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));

test('homepage connects Titans to its co-founder with factual organization markup', () => {
  const organization = schemas.find(schema => schema['@type'] === 'Organization');
  assert.ok(organization, 'Organization markup is present');
  assert.equal(organization.name, 'TikTok Titans');
  assert.equal(organization.url, 'https://titansagency.co/');
  assert.equal(organization.founder['@type'], 'Person');
  assert.equal(organization.founder.name, 'Gage Sampson');
  assert.equal(organization.founder.url, 'https://gagesampson.com/');
  assert.equal(organization.founder.jobTitle, 'Co-founder');
  const paths = schemas.find(schema => schema['@type'] === 'ItemList');
  assert.deepEqual(paths.itemListElement.map(item => item.url), ['https://titansagency.co/titans/', 'https://titansagency.co/ai/']);
});

test('co-founder mention is visible once in the footer, not a new sales section', () => {
  const body = html.split('<body>')[1];
  const main = body.split('</main>')[0];
  assert.equal((body.match(/Gage Sampson/g) || []).length, 1);
  assert.ok(!main.includes('Gage Sampson'));
  assert.ok(body.includes('Co-founded by <a href="https://gagesampson.com/">Gage Sampson</a>.'));
  assert.ok(html.includes('<title>TikTok Titans | Choose TikTok Shop or Titans AI</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://titansagency.co/" />'));
});
