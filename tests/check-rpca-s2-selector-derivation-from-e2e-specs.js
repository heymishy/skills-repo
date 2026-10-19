'use strict';
// check-rpca-s2-selector-derivation-from-e2e-specs.js -- TDD tests for rpca-s2
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): derives a selector from a real-shaped E2E spec fixture
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  try {
    const fixtureSpec = `'use strict';\n// fixture-spec.spec.js -- E2E for X (rpca-fixture-story AC1)\nconst { withAuth } = require('./fixtures/auth');\nwithAuth('does the thing', async ({ page }) => {\n  await page.goto('/fixture');\n  const el = page.locator('.fixture-selector');\n  await expect(el).toBeVisible();\n});\n`;
    const result = deriveSelectorFromSpec(fixtureSpec, 'AC1');
    assert.deepStrictEqual(result, { acId: 'AC1', selector: '.fixture-selector' }, 'expected the AC id and the nearest following locator selector');
    pass('AC1 (unit): derives a selector from a real-shaped E2E spec fixture');
  } catch (e) { fail('AC1 (unit): derives a selector from a real-shaped E2E spec fixture', e); }
})();

// AC1 (unit): returns null when the spec file does not name the AC at all
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  try {
    const fixtureSpec = `// fixture-spec.spec.js -- E2E for X (rpca-fixture-story AC9)\nconst el = page.locator('.unrelated');\n`;
    const result = deriveSelectorFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result, null, 'expected null when the AC id is not named in the spec file at all');
    pass('AC1 (unit): returns null when the spec file does not name the AC at all');
  } catch (e) { fail('AC1 (unit): returns null when the spec file does not name the AC at all', e); }
})();

// AC2 (unit): falls back to the manual file when no E2E match exists
(function () {
  const { loadManualFallback } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture', 'playback', 'rpca-fixture-story');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixturePath = path.join(fixtureDir, 'selectors-manual.json');
  fs.writeFileSync(fixturePath, JSON.stringify({ AC2: { url: '/fixture', selector: '.fixture' } }));
  try {
    const result = loadManualFallback('rpca-s2-test-fixture', 'rpca-fixture-story', 'AC2');
    assert.deepStrictEqual(result, { url: '/fixture', selector: '.fixture' }, 'expected the exact fallback entry for AC2');
    pass('AC2 (unit): falls back to the manual file when no E2E match exists');
  } catch (e) { fail('AC2 (unit): falls back to the manual file when no E2E match exists', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture'), { recursive: true, force: true }); }
})();

// AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)
(function () {
  const { loadManualFallback } = require('../scripts/playback-capture');
  try {
    const result = loadManualFallback('no-such-feature-slug-rpca-s2-test', 'no-such-story', 'AC1');
    assert.strictEqual(result, null, 'expected null, not a throw, when the fallback file does not exist');
    pass('AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)');
  } catch (e) { fail('AC2 (unit): returns null when selectors-manual.json does not exist (normal case, not an error)', e); }
})();

// AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry
(function () {
  const { buildCaptureList } = require('../scripts/playback-capture');
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  try {
    const result = buildCaptureList('no-such-feature-slug-rpca-s2-test', 'no-such-story', ['AC9'], []);
    assert.deepStrictEqual(result.captured, [], 'expected no entries captured for an AC in neither source');
    assert.strictEqual(result.skipped, 1, 'expected exactly one AC skipped');
    assert.ok(warnings.some(w => w.includes('AC9')), 'expected a warning naming the specific skipped AC id');
    pass("AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry");
  } catch (e) { fail("AC3 (unit): skips with a named warning, doesn't crash, when neither source has an entry", e); }
  finally { console.warn = originalWarn; }
})();

console.log(`\n[rpca-s2-selector-derivation-from-e2e-specs] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
