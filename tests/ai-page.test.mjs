import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../ai/index.html', import.meta.url), 'utf8');

test('scrolling examples into view never starts playback on phones or desktops', () => {
  for (const mobile of [true, false]) {
    let plays = 0;
    const videos = ['source', 'result'].map(kind => ({ dataset: { showcaseVideo: kind },
      play() { plays++; return Promise.resolve(); }, pause() {} }));
    const callbacks = [];
    const context = vm.createContext({ document: { hidden: false, querySelectorAll: () => videos, addEventListener() {} },
      window: { matchMedia: query => ({ matches: query.includes('max-width') && mobile, addEventListener() {} }) },
      IntersectionObserver: class { constructor(callback) { callbacks.push(callback); } observe() {} } });
    for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      if (script[1].trim()) vm.runInContext(script[1], context);
    }
    for (const callback of callbacks) {
      callback(videos.map(target => ({ target, isIntersecting: true })));
      callback(videos.map(target => ({ target, isIntersecting: false })));
      callback(videos.map(target => ({ target, isIntersecting: true })));
    }
    assert.equal(plays, 0, `Scrolling must not play video (mobile=${mobile})`);
  }
});

test('all three examples require explicit play and support inline playback', () => {
  const videos = [...html.matchAll(/<video\b([^>]*)>/g)];
  assert.equal(videos.length, 3);
  for (const [, attrs] of videos) {
    assert.ok(/\bcontrols\b/.test(attrs));
    assert.ok(/\bplaysinline\b/.test(attrs));
    assert.ok(/\bwebkit-playsinline\b/.test(attrs));
    assert.ok(!/\bautoplay\b/.test(attrs));
  }
});

test('AI offer accurately describes included tools and separates Exclusive benefits', () => {
  const copy = html.replace(/\s+/g, ' ');
  for (const phrase of ['15 lifetime photo credits', 'Image generation', 'Close-up selfies',
    'AI-only Discord', 'Affiliate Center', 'TikTok and Instagram', 'Full step-by-step guide']) {
    assert.ok(copy.includes(phrase), `Missing benefit: ${phrase}`);
  }
  assert.ok(copy.includes('Each new photo or selfie uses one credit'));
  assert.ok(copy.includes('Higgsfield and other third-party video tools are separate'));
  assert.ok(copy.includes('does not include the main Titans community'));
  assert.ok(!copy.includes('does not include Titans Discord'));
  assert.ok(copy.includes('plan_bJeNjIIJAtzSR'));
  assert.ok(copy.includes('$29.99 one-time'));
});
