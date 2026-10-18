'use strict';
// check-rpca-s1-cli-entrypoint-and-first-real-capture.js -- TDD tests for rpca-s1
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
(function () {
  const { buildScreenshotPath } = require('../scripts/playback-capture');
  try {
    const result = buildScreenshotPath('f1', 's1', 'AC1');
    assert.strictEqual(result, 'artefacts/f1/playback/s1/screenshots/AC1.png', 'expected the exact existing path convention');
    pass('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly');
  } catch (e) { fail('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly', e); }
})();

console.log(`\n[rpca-s1-cli-entrypoint-and-first-real-capture] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
