'use strict';
// check-fpd-s5-close-the-real-capture-loop.js -- TDD tests for fpd-s5
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape
(function () {
  const { parseDodAcCoverage } = require('../src/utils/dod-parsing');
  const fixture = [
    '## AC Verification', '',
    '| AC | Verified by | Result |',
    '|----|--------------|--------|',
    '| AC1 — Step 1 three named options | T3.1, T3.2 | ✅ PASS |',
  ].join('\n');
  try {
    const rows = parseDodAcCoverage(fixture);
    assert.strictEqual(rows.length, 1, 'expected exactly one parsed row');
    assert.strictEqual(rows[0].acId, 'AC1');
    assert.strictEqual(rows[0].description, 'Step 1 three named options');
    assert.strictEqual(rows[0].evidence, 'T3.1, T3.2', 'expected evidence sourced from the Verified by column');
    assert.strictEqual(rows[0].satisfied, '✅ PASS', 'expected satisfied sourced from the Result column');
    assert.strictEqual(rows[0].verificationMethod, '', 'no equivalent column in this table shape');
    assert.strictEqual(rows[0].deviation, '', 'no equivalent column in this table shape');
    pass('AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape');
  } catch (e) { fail('AC1 (unit): parseDodAcCoverage parses "## AC Verification"', e); }
})();

console.log(`\n[fpd-s5-close-the-real-capture-loop] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
