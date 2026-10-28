'use strict';
// check-actr-s1-capture-target-derivation.js -- TDD tests for actr-s1
// (2026-10-28-auto-capture-target-resolution).
// Story: artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): selector parity. Deliberately NO page.goto(...) in this
// fixture -- Task 2 of this story adds real goto-scanning, and a fixture
// that happens to contain a goto would stop asserting url:null once that
// capability lands, coupling this test's correctness to a later task's
// scope. This fixture asserts the selector-only case on its own terms.
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC1)\nwithAuth('does the thing', async ({ page }) => {\n  const el = page.locator('.actr-target');\n});\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.deepStrictEqual(result, { acId: 'AC1', url: null, selector: '.actr-target' }, 'expected the full capture target shape with the AC id preserved and url null since this fixture has no goto at all');
    pass('AC1 (unit): derives the selector correctly');
  } catch (e) { fail('AC1 (unit): derives the selector correctly', e); }
})();

// AC4 (unit): no AC tag match anywhere -> null, never a throw
(function () {
  const { deriveCaptureTargetFromSpec } = require('../src/utils/capture-target-derivation');
  try {
    const fixtureSpec = `// fixture.spec.js (actr-fixture AC9)\nconst el = page.locator('.unrelated');\n`;
    const result = deriveCaptureTargetFromSpec(fixtureSpec, 'AC1');
    assert.strictEqual(result, null, 'expected null when the AC id is not named in the spec file at all');
    pass('AC4 (unit): returns null when the spec file does not name the AC at all');
  } catch (e) { fail('AC4 (unit): returns null when the spec file does not name the AC at all', e); }
})();

console.log(`\n[actr-s1-capture-target-derivation] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
