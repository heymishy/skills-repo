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

// AC4 (integration): a full multi-AC run reports correct capture/skip counts
(function () {
  const { buildCaptureList } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture-ac4', 'playback', 'rpca-fixture-story');
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(path.join(fixtureDir, 'selectors-manual.json'), JSON.stringify({ AC3: { url: '/fixture', selector: '.fixture-ac3' } }));
  try {
    const specFiles = [
      `// fixture-spec-1.spec.js -- E2E for X (rpca-fixture-story AC1)\nconst el = page.locator('.fixture-ac1');\n`,
      `// fixture-spec-2.spec.js -- E2E for Y (rpca-fixture-story AC2)\nconst el = page.locator('.fixture-ac2');\n`,
    ];
    const result = buildCaptureList('rpca-s2-test-fixture-ac4', 'rpca-fixture-story', ['AC1', 'AC2', 'AC3', 'AC4'], specFiles);
    assert.strictEqual(result.captured.length, 3, 'expected 3 ACs captured: AC1 + AC2 (E2E-derived), AC3 (manual fallback)');
    assert.strictEqual(result.skipped, 1, 'expected AC4 skipped (neither source)');
    assert.strictEqual(result.summary, '3 captured, 1 skipped', 'expected the exact summary string');
    assert.deepStrictEqual(result.captured.find(c => c.acId === 'AC1'), { acId: 'AC1', selector: '.fixture-ac1' });
    assert.deepStrictEqual(result.captured.find(c => c.acId === 'AC3'), { acId: 'AC3', url: '/fixture', selector: '.fixture-ac3' });
    pass('AC4 (integration): a full multi-AC run reports correct capture/skip counts');
  } catch (e) { fail('AC4 (integration): a full multi-AC run reports correct capture/skip counts', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s2-test-fixture-ac4'), { recursive: true, force: true }); }
})();

// rpca-s2-hotfix1 AC1 (unit): a shared multi-AC header no longer collapses every AC to the same selector
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  try {
    // Modelled directly on the real tests/e2e/jcx-s3-emotion-curve.spec.js shape --
    // one shared header naming all 3 ACs together, then separate test blocks each
    // with its own (ACn)-suffixed title and its own distinct locator.
    const fixtureSpec = `// fixture-jcx-shape.spec.js -- E2E coverage for AC1, AC2, AC3 of story\nwithAuth('does thing one (AC1)', async ({ page }) => {\n  await page.locator('.fixture-ac1-only').click();\n});\nwithAuth('does thing two (AC2)', async ({ page }) => {\n  await page.locator('.fixture-ac2-only').click();\n});\nwithAuth('does thing three (AC3)', async ({ page }) => {\n  await page.locator('.fixture-ac3-only').click();\n});\n`;
    const ac1 = deriveSelectorFromSpec(fixtureSpec, 'AC1');
    const ac2 = deriveSelectorFromSpec(fixtureSpec, 'AC2');
    const ac3 = deriveSelectorFromSpec(fixtureSpec, 'AC3');
    assert.deepStrictEqual(ac1, { acId: 'AC1', selector: '.fixture-ac1-only' }, 'expected AC1\'s own distinct selector');
    assert.deepStrictEqual(ac2, { acId: 'AC2', selector: '.fixture-ac2-only' }, 'expected AC2\'s own distinct selector, not AC1\'s');
    assert.deepStrictEqual(ac3, { acId: 'AC3', selector: '.fixture-ac3-only' }, 'expected AC3\'s own distinct selector, not AC1\'s');
    pass('rpca-s2-hotfix1 AC1 (unit): a shared multi-AC header no longer collapses every AC to the same selector');
  } catch (e) { fail('rpca-s2-hotfix1 AC1 (unit): a shared multi-AC header no longer collapses every AC to the same selector', e); }
})();

// rpca-s2-hotfix1 AC2 (unit): the existing single-AC-per-file convention still resolves correctly against the real file
(function () {
  const { deriveSelectorFromSpec } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  try {
    const content = fs.readFileSync(path.join(__dirname, 'e2e', 'fpd-s4-caption-sync.spec.js'), 'utf8');
    const result = deriveSelectorFromSpec(content, 'AC3');
    assert.deepStrictEqual(result, { acId: 'AC3', selector: '.playback-ac__video' }, 'expected the real fpd-s4 selector, unchanged from before the fix');
    pass('rpca-s2-hotfix1 AC2 (unit): the existing single-AC-per-file convention still resolves correctly against the real file');
  } catch (e) { fail('rpca-s2-hotfix1 AC2 (unit): the existing single-AC-per-file convention still resolves correctly against the real file', e); }
})();

console.log(`\n[rpca-s2-selector-derivation-from-e2e-specs] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
