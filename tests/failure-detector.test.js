#!/usr/bin/env node
/**
 * failure-detector.test.js
 *
 * Unit tests for p3.1c AC3/AC4: anti-overfitting counter separation in
 * failure-detector.js (checkAntiOverfitting Path A).
 *
 * Tests:
 *   U6 — add-1-remove-1-blocked:        add 1 check, remove 1 check → gate returns passed:false
 *   U7 — separate-counts-in-output:     result contains separate pass/added/removed fields
 *                                        and reason string includes "pass:", "added:", "removed:" labels
 *   U8 — add-1-remove-0-passes:         add 1 check, remove 0 → gate returns passed:true
 *
 * Run:  node tests/failure-detector.test.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root         = path.join(__dirname, '..');
var detectorPath = path.join(root, 'src', 'improvement-agent', 'failure-detector.js');
var fixturesDir  = path.join(root, 'tests', 'fixtures', 'proposal-scenarios');

// ── Guards ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(detectorPath)) {
  process.stderr.write('[failure-detector-test] FATAL: failure-detector.js not found at ' + detectorPath + '\n');
  process.exit(1);
}

var detector           = require(detectorPath);
var checkAntiOverfitting = detector.checkAntiOverfitting;

if (typeof checkAntiOverfitting !== 'function') {
  process.stderr.write('[failure-detector-test] FATAL: checkAntiOverfitting not exported from failure-detector.js\n');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function loadFixture(filename) {
  var fixturePath = path.join(fixturesDir, filename);
  if (!fs.existsSync(fixturePath)) {
    throw new Error('Fixture not found: ' + fixturePath);
  }
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n[failure-detector-test] p3.1c AC3/AC4 — anti-overfitting counter separation\n');

// U6 — add-1-remove-1 → gate blocks (passed: false)
(function testAddOneRemoveOneBlocked() {
  var fixture;
  try {
    fixture = loadFixture('add-one-remove-one.json');
  } catch (e) {
    fail('U6-add-1-remove-1-blocked', e.message);
    return;
  }

  var result = checkAntiOverfitting(fixture.proposal, fixture.windowTraces);

  if (result.passed !== false) {
    fail('U6-add-1-remove-1-blocked',
      'Gate must return passed:false when 1 check is removed, even if 1 check is added (net zero). ' +
      'Got passed=' + result.passed);
  } else {
    pass('U6-add-1-remove-1-blocked');
  }
}());

// U7 — output contains separate pass/added/removed fields and labelled reason string
(function testSeparateCountsInOutput() {
  var fixture;
  try {
    fixture = loadFixture('add-one-remove-one.json');
  } catch (e) {
    fail('U7-separate-counts-in-output', e.message);
    return;
  }

  var result = checkAntiOverfitting(fixture.proposal, fixture.windowTraces);

  // Check separate numeric fields exist on the result
  if (typeof result.addedCount !== 'number') {
    fail('U7-separate-counts-addedCount-field',
      'result.addedCount must be a number; got ' + typeof result.addedCount);
  } else if (result.addedCount !== 1) {
    fail('U7-separate-counts-addedCount-field',
      'result.addedCount must be 1 for add-one-remove-one fixture; got ' + result.addedCount);
  } else {
    pass('U7-separate-counts-addedCount-field');
  }

  if (typeof result.removedCount !== 'number') {
    fail('U7-separate-counts-removedCount-field',
      'result.removedCount must be a number; got ' + typeof result.removedCount);
  } else if (result.removedCount !== 1) {
    fail('U7-separate-counts-removedCount-field',
      'result.removedCount must be 1 for add-one-remove-one fixture; got ' + result.removedCount);
  } else {
    pass('U7-separate-counts-removedCount-field');
  }

  if (typeof result.passCount !== 'number') {
    fail('U7-separate-counts-passCount-field',
      'result.passCount must be a number; got ' + typeof result.passCount);
  } else {
    pass('U7-separate-counts-passCount-field');
  }

  // Check that reason string contains the labelled lines: "added:", "removed:", "pass:"
  var reason = result.reason || '';

  if (reason.indexOf('added:') === -1) {
    fail('U7-separate-counts-reason-has-added-label',
      'result.reason must contain "added:" label; got: "' + reason + '"');
  } else {
    pass('U7-separate-counts-reason-has-added-label');
  }

  if (reason.indexOf('removed:') === -1) {
    fail('U7-separate-counts-reason-has-removed-label',
      'result.reason must contain "removed:" label; got: "' + reason + '"');
  } else {
    pass('U7-separate-counts-reason-has-removed-label');
  }

  if (reason.indexOf('pass:') === -1) {
    fail('U7-separate-counts-reason-has-pass-label',
      'result.reason must contain "pass:" label; got: "' + reason + '"');
  } else {
    pass('U7-separate-counts-reason-has-pass-label');
  }
}());

// U8 — add-1-remove-0 → gate passes (passed: true)
(function testAddOneRemoveZeroPasses() {
  var fixture;
  try {
    fixture = loadFixture('add-one-remove-zero.json');
  } catch (e) {
    fail('U8-add-1-remove-0-passes', e.message);
    return;
  }

  var result = checkAntiOverfitting(fixture.proposal, fixture.windowTraces);

  if (result.passed !== true) {
    fail('U8-add-1-remove-0-passes',
      'Gate must return passed:true when only checks are added (0 removed). ' +
      'Got passed=' + result.passed + ', reason=' + result.reason);
  } else {
    pass('U8-add-1-remove-0-passes');
  }

  if (result.addedCount !== 1) {
    fail('U8-add-1-remove-0-addedCount',
      'result.addedCount must be 1 for add-one-remove-zero fixture; got ' + result.addedCount);
  } else {
    pass('U8-add-1-remove-0-addedCount');
  }

  if (result.removedCount !== 0) {
    fail('U8-add-1-remove-0-removedCount',
      'result.removedCount must be 0 for add-one-remove-zero fixture; got ' + result.removedCount);
  } else {
    pass('U8-add-1-remove-0-removedCount');
  }
}());

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[failure-detector-test] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
  }
  process.exit(1);
}
