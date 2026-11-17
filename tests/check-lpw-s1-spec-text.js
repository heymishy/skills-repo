'use strict';
// lpw-s1 T4 (AC4, AC5) -- the stale text found in the local Playwright specs stays fixed. Reads the specs as text.
// Plain Node script. Run: node tests/check-lpw-s1-spec-text.js
// Story: artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s1-make-the-local-playwright-suite-trustworthy.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const e2e = path.resolve(__dirname, 'e2e');
function read(f) { return fs.readFileSync(path.join(e2e, f), 'utf8').replace(/\r\n/g, '\n'); }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T4a no spec expects the redirect to land on localhost:3000 (the test server runs on 3999)', function () {
  const bad = fs.readdirSync(e2e).filter(function (f) { return /\.spec\.(js|ts)$/.test(f); }).filter(function (f) {
    return /toMatch\(\/[^)]*localhost:3000/.test(read(f));
  });
  assert.deepStrictEqual(bad, [], 'specs still expecting localhost:3000: ' + bad.join(', '));
});

test('T4b the shell nav locator resolves to one element in wuce23, wuce24 and wuce25 (the page has two navs)', function () {
  ['wuce23-skill-launcher-landing.spec.js', 'wuce24-guided-question-form.spec.js', 'wuce25-session-commit-result.spec.js'].forEach(function (f) {
    const t = read(f);
    assert.ok(!/page\.locator\('nav'\);/.test(t), f + ' still uses the bare page.locator(\'nav\') that matches two elements');
    assert.ok(/page\.locator\('nav'\)\.first\(\)/.test(t), f + ' lost its nav assertion');
  });
});

test('T4c the diagram focus-trap check compares element identity, not tag/id/class (csd-s2 AC4)', function () {
  const t = read('csd-s2-canvas-diagram-rendering.spec.js');
  assert.ok(/__focusUid/.test(t), 'focus walk does not record an element identity');
  assert.ok(/prev\.uid === cur\.uid/.test(t), 'the repeat check does not compare the identity');
  assert.ok(!/prev\.tag === cur\.tag && prev\.id === cur\.id && prev\.cls === cur\.cls/.test(t), 'the old tag/id/class comparison is back');
});

test('T4d every spec that seeds a journey takes its CSRF token from the page that embeds one and opts out of default stages', function () {
  const seeders = fs.readdirSync(e2e).filter(function (f) { return /\.spec\.js$/.test(f) && /post\('\/journeys'/.test(read(f)); });
  assert.ok(seeders.length >= 8, 'expected at least the 8 journey-seeding specs, found ' + seeders.length);
  seeders.forEach(function (f) {
    const t = read(f);
    assert.ok(!/request\.get\('\/'\)/.test(t), f + ' still reads its CSRF token from "/" (it redirects to /dashboard, which embeds none)');
    assert.ok(/request\.get\('\/customer-journeys'\)/.test(t), f + ' does not read the token from /customer-journeys');
    assert.ok(/seedDefaultStages: false/.test(t), f + ' does not opt out of the five default stages');
  });
});

test('T4e the shared repository fixture exists and the feature-starting specs use it (AC5)', function () {
  const fx = read('fixtures/product-repo.js');
  assert.ok(/\/test\/seed-product-repo/.test(fx) && /connectRepoToProduct/.test(fx), 'fixture missing');
  ['frsr-s1-feature-row-session-resume.spec.js', 'pnfc-s1-new-feature-choice.spec.js'].forEach(function (f) {
    assert.ok(/connectRepoToProduct\(/.test(read(f)), f + ' does not use the repository fixture');
  });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
