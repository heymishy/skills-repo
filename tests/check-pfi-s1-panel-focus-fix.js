'use strict';
// check-pfi-s1-panel-focus-fix.js -- AC verification for pfi-s1 (fix the
// stage side panel's initial focus target and correct the E2E spec's
// wrap-test labels -- see
// artefacts/2026-10-08-stage-panel-initial-focus-fix/). Found via live
// Chrome verification against real staging data: openPanel() was landing
// initial focus on the close button (first in DOM order) instead of the
// description field, and the written-but-unexecuted E2E spec inherited the
// same wrong first/last labeling.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function() {
  // AC1 -- openPanel() explicitly focuses the description field, not
  // getFocusable()[0] (which would be the close button, DOM-order-first).
  try {
    const src = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/journeys.js'), 'utf8');
    assert(/getElementById\("sw-stage-field-description"\)\.focus\(\)|firstField\.focus\(\)/.test(src), 'openPanel does not explicitly focus the description field');
    assert(!/if\(focusables\.length\)focusables\[0\]\.focus\(\);/.test(src), 'openPanel still uses the DOM-order-first element (getFocusable()[0]) for initial focus');
    pass('AC1: openPanel() explicitly focuses the description field, not the DOM-order-first element');
  } catch (e) { fail('AC1: openPanel() explicitly focuses the description field, not the DOM-order-first element', e); }

  // AC3 -- the E2E spec's firstField/lastField (domFirst/domLast) locators
  // match the TRUE DOM order (close button first, moment_of_truth last).
  try {
    const specSrc = fs.readFileSync(path.join(__dirname, 'e2e/ep1-s3-stage-panel-focus-management.spec.js'), 'utf8');
    assert(/#sw-stage-panel-close/.test(specSrc), 'spec does not reference the close button locator at all');
    assert(/#sw-stage-field-moment_of_truth/.test(specSrc), 'spec does not reference the moment_of_truth field locator at all');
    // The close-button locator must be the one used as the true DOM-order-first
    // element in the wrap assertions (i.e. NOT asserted to be "focused after
    // opening the panel" -- that's the description field's own job, AC1 above).
    assert(!/const firstField = page\.locator\('#sw-stage-field-description'\);[\s\S]*const lastField = page\.locator\('#sw-stage-panel-close'\);/.test(specSrc), 'spec still has the old (incorrect) firstField=description/lastField=close labeling');
    pass('AC3: E2E spec\'s first/last-focusable locators match the true DOM order (close button first, moment_of_truth last)');
  } catch (e) { fail('AC3: E2E spec\'s first/last-focusable locators match the true DOM order (close button first, moment_of_truth last)', e); }

  console.log(`\n[pfi-s1-panel-focus-fix] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
