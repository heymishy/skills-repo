'use strict';
// check-rpca-s1-hotfix1-path-guard.js -- TDD tests for rpca-s1-hotfix1
// (2026-10-19-real-playback-capture-automation).
// Short-track fix found at rpca-s1's own /definition-of-done: the CLI's own
// featureSlug argument (process.argv[2]) flowed into buildScreenshotPath with
// no validation, deviating from the NFR profile's own committed path-traversal
// guard convention (web-ui-patterns.md).
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): a traversal attempt in the feature slug is rejected
(function () {
  const { buildScreenshotPath } = require('../scripts/playback-capture');
  try {
    let threw = null;
    try { buildScreenshotPath('../../etc/passwd', 's1', 'AC1'); }
    catch (e) { threw = e; }
    assert.ok(threw, 'expected buildScreenshotPath to throw for a traversal attempt');
    assert.ok(/outside|traversal|repo root/i.test(threw.message), 'expected the error to name the real problem');
    pass('AC1 (unit): a traversal attempt in the feature slug is rejected');
  } catch (e) { fail('AC1 (unit): a traversal attempt in the feature slug is rejected', e); }
})();

// AC2 (unit): a legitimate feature slug still resolves correctly
(function () {
  const { buildScreenshotPath } = require('../scripts/playback-capture');
  try {
    const result = buildScreenshotPath('2026-10-11-journey-cx-redesign', 's1', 'AC1');
    assert.strictEqual(result, 'artefacts/2026-10-11-journey-cx-redesign/playback/s1/screenshots/AC1.png', 'expected the same path as before the guard was added');
    pass('AC2 (unit): a legitimate feature slug still resolves correctly');
  } catch (e) { fail('AC2 (unit): a legitimate feature slug still resolves correctly', e); }
})();

console.log(`\n[rpca-s1-hotfix1-path-guard] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
