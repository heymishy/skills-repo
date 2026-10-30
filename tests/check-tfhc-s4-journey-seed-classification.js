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
// must carry that endpoint's own explicit verdict.
function getEndpointBlock(text, name) {
  var re = new RegExp('###\\s*\\d+\\.[^\\n]*`[^`]*' + escapeRegExp(name) + '[^`]*`[\\s\\S]*?(?=\\n###\\s|\\n##\\s|$)');
  var m = text.match(re);
  return m ? m[0] : null;
}

var artefactText = fs.existsSync(ARTEFACT_PATH) ? fs.readFileSync(ARTEFACT_PATH, 'utf8') : null;

test('AC1: classification artefact exists', function() {
  assert.ok(artefactText !== null, 'expected ' + ARTEFACT_REPO_REL_PATH + ' to exist');
});

test('AC1: all 5 endpoints each have their own heading block with an explicit Redundant/Legitimately-different verdict', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  ENDPOINTS.forEach(function(name) {
    var block = getEndpointBlock(artefactText, name);
    assert.ok(block, 'expected a "### N. `' + name + '`" heading block in the artefact');
    assert.ok(/\*\*Verdict:\*\*\s*(Redundant|Legitimately different|Legitimate)/i.test(block),
      'expected endpoint "' + name + '" to carry an explicit **Verdict:** line, not just be named');
  });
});

test('AC2: any endpoint marked Redundant has a specific fast-follow (named other endpoint + caller count), never a vague note', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  var redundantEndpoints = ENDPOINTS.filter(function(name) {
    var block = getEndpointBlock(artefactText, name);
    return block && /\*\*Verdict:\*\*\s*Redundant\b/i.test(block);
  });
  if (redundantEndpoints.length === 0) {
    return; // trivially satisfied -- AC3's test covers the "zero redundant" branch instead
  }
  redundantEndpoints.forEach(function(name) {
    var block = getEndpointBlock(artefactText, name);
    var hasOtherEndpointNamed = ENDPOINTS.some(function(other) { return other !== name && block.indexOf(other) !== -1; });
    var hasCallerCount = /\b\d+\s*callers?\b/i.test(block);
    assert.ok(hasOtherEndpointNamed, 'redundant verdict for "' + name + '" must name the specific other endpoint it is redundant with');
    assert.ok(hasCallerCount, 'redundant verdict for "' + name + '" must name a real caller count, not a vague note');
  });
});

test('AC3: artefact explicitly closes the question when no endpoint is found redundant', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  var anyRedundant = ENDPOINTS.some(function(name) {
    var block = getEndpointBlock(artefactText, name);
    return block && /\*\*Verdict:\*\*\s*Redundant\b/i.test(block);
  });
  if (anyRedundant) {
    return; // AC2's test covers the "at least one redundant" branch instead
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
