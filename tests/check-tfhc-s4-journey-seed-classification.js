'use strict';
// tests/check-tfhc-s4-journey-seed-classification.js -- tfhc-s4
//
// Structural self-check for the journey-seed-endpoint classification
// artefact (read-only investigation story -- no production code changes).
// Verifies AC1-AC4 from
// artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md
// against the artefact's own text -- NOT the classification's substantive
// correctness, which is a human-review gap documented in that test plan's
// own Test Gaps and Risks table.

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var ARTEFACT_REPO_REL_PATH = 'artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md';
var ARTEFACT_PATH = path.resolve(__dirname, '..', ARTEFACT_REPO_REL_PATH);
var BENEFIT_METRIC_PATH = path.resolve(__dirname, '../artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md');

var ENDPOINTS = [
  'seed-approval-journey',
  'seed-board-journey',
  'seed-actr-s2-journey',
  'seed-ppc-s5-journey',
  'seed-journey-gate-session'
];

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS] ' + name); }
  catch (err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + err.message); }
}

function escapeRegExp(s) { return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

// Extracts the "### N. `endpoint-name` ..." heading block up to the next
// "### " or "## " heading (or end of file) -- this is the one block that
// must carry that endpoint's own explicit verdict. The opening match is
// anchored to a line start (start-of-string or just after a "\n") via a
// non-capturing lookaround-equivalent prefix, but that prefix itself is
// excluded from the returned block by capturing only the "###..." portion.
function getEndpointBlock(text, name) {
  var re = new RegExp('(?:^|\\n)(###\\s*\\d+\\.[^\\n]*`[^`]*' + escapeRegExp(name) + '[^`]*`[\\s\\S]*?)(?=\\n###\\s|\\n##\\s|$)');
  var m = text.match(re);
  return m ? m[1] : null;
}

// Shared predicate for "which endpoints carry an explicit Redundant verdict"
// -- used by both AC2 (which endpoints need a fast-follow check) and AC3
// (whether the zero-redundant closing statement is the applicable branch).
function getRedundantEndpointNames(text) {
  return ENDPOINTS.filter(function(name) {
    var block = getEndpointBlock(text, name);
    return block && /\*\*Verdict:\*\*\s*Redundant\b/i.test(block);
  });
}

var artefactText = fs.existsSync(ARTEFACT_PATH) ? fs.readFileSync(ARTEFACT_PATH, 'utf8') : null;
var redundantEndpointNames = artefactText ? getRedundantEndpointNames(artefactText) : [];

test('AC1: classification artefact exists', function() {
  assert.ok(artefactText !== null, 'expected ' + ARTEFACT_REPO_REL_PATH + ' to exist');
});

// Split into one test() per endpoint so a failure on one endpoint doesn't
// abort the loop and hide failures on the remaining endpoints.
ENDPOINTS.forEach(function(name) {
  test('AC1: ' + name + ' has an explicit verdict', function() {
    assert.ok(artefactText, 'artefact must exist for this check');
    var block = getEndpointBlock(artefactText, name);
    assert.ok(block, 'expected a "### N. `' + name + '`" heading block in the artefact');
    assert.ok(/\*\*Verdict:\*\*\s*(Redundant|Legitimately different|Legitimate)/i.test(block),
      'expected endpoint "' + name + '" to carry an explicit **Verdict:** line, not just be named');
  });
});

if (redundantEndpointNames.length === 0) {
  test('AC2: no endpoint marked Redundant, so the fast-follow check is trivially satisfied', function() {
    assert.ok(artefactText, 'artefact must exist for this check');
    // Nothing further to check -- AC3's test covers the "zero redundant" branch instead.
  });
} else {
  // Split into one test() per redundant endpoint so a failure on one
  // doesn't abort the loop and hide failures on the remaining ones.
  redundantEndpointNames.forEach(function(name) {
    test('AC2: ' + name + ' redundant verdict names a specific other endpoint with a tied caller count', function() {
      var block = getEndpointBlock(artefactText, name);
      assert.ok(block, 'expected a "### N. `' + name + '`" heading block in the artefact');

      var otherEndpoint = null;
      ENDPOINTS.forEach(function(other) {
        if (!otherEndpoint && other !== name && block.indexOf(other) !== -1) {
          otherEndpoint = other;
        }
      });
      assert.ok(otherEndpoint, 'redundant verdict for "' + name + '" must name the specific other endpoint it is redundant with');

      // Require the caller-count number to appear near the named other
      // endpoint's own reference (same sentence/line), not merely anywhere
      // in the block -- an unrelated stray number elsewhere in the block
      // must not satisfy this check.
      var idx = block.indexOf(otherEndpoint);
      var windowStart = Math.max(0, idx - 150);
      var windowEnd = Math.min(block.length, idx + otherEndpoint.length + 150);
      var window = block.slice(windowStart, windowEnd);
      assert.ok(/\b\d+\s*callers?\b/i.test(window),
        'redundant verdict for "' + name + '" must name a real caller count near its reference to "' + otherEndpoint + '", not a vague note elsewhere in the block');
    });
  });
}

test('AC3: artefact explicitly closes the question when no endpoint is found redundant', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  if (getRedundantEndpointNames(artefactText).length > 0) {
    return; // AC2's test(s) cover the "at least one redundant" branch instead
  }
  assert.ok(/no endpoint was found redundant/i.test(artefactText) && /no further action required/i.test(artefactText),
    'expected an explicit closing statement ("no endpoint was found redundant ... no further action required") when zero endpoints are marked redundant');
});

test('AC4: benefit-metric.md Metric 4 references the classification artefact\'s real path', function() {
  var benefitMetricText = fs.readFileSync(BENEFIT_METRIC_PATH, 'utf8');
  var metric4Match = benefitMetricText.match(/### Metric 4:[\s\S]*?(?=\n### |\n---|$)/);
  assert.ok(metric4Match, 'expected a "### Metric 4:" section in benefit-metric.md');
  assert.ok(metric4Match[0].indexOf(ARTEFACT_REPO_REL_PATH) !== -1,
    'expected Metric 4 to reference the exact artefact path: ' + ARTEFACT_REPO_REL_PATH);
  assert.ok(fs.existsSync(ARTEFACT_PATH), 'the referenced artefact must actually exist on disk');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
