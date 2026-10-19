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

console.log(`\n[rpca-s2-selector-derivation-from-e2e-specs] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
