#!/usr/bin/env node
/**
 * failure-detector.integration.test.js
 *
 * Integration test for p3.1c AC3: end-to-end anti-overfitting gate evaluation.
 *
 * Test:
 *   I1 — integration-add-1-remove-1-exit-1-removal-in-output:
 *        Full proposal evaluation with add-1-remove-1 fixture.
 *        Gate must block (passed:false), exit 1 semantics, and output must
 *        contain removal count information.
 *
 * Run:  node tests/failure-detector.integration.test.js
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
  process.stderr.write('[failure-detector-integration-test] FATAL: failure-detector.js not found at ' + detectorPath + '\n');
  process.exit(1);
}

var detector           = require(detectorPath);
var checkAntiOverfitting = detector.checkAntiOverfitting;

if (typeof checkAntiOverfitting !== 'function') {
  process.stderr.write('[failure-detector-integration-test] FATAL: checkAntiOverfitting not exported\n');
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

// ── Integration test ──────────────────────────────────────────────────────────

console.log('\n[failure-detector-integration-test] p3.1c AC3 — end-to-end anti-overfitting gate\n');

// I1 — full end-to-end evaluation: add-1-remove-1 → exit 1 semantics + removal in output
(function testIntegrationAddOneRemoveOne() {
  var fixturePath = path.join(fixturesDir, 'add-one-remove-one.json');
  if (!fs.existsSync(fixturePath)) {
    fail('I1-integration-add-1-remove-1-exit-1', 'Fixture not found: ' + fixturePath);
    return;
  }

  var fixture      = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  var proposal     = fixture.proposal;
  var windowTraces = fixture.windowTraces;

  // Invoke the anti-overfitting gate directly — this is the authoritative function
  // called by runAgent internally. We test it at this level to isolate the counter
  // logic without needing external file-system state.
  var gateResult = checkAntiOverfitting(proposal, windowTraces);

  // Gate must block (passed: false) — exit 1 semantics
  if (gateResult.passed !== false) {
    fail('I1-integration-add-1-remove-1-exit-1',
      'Integration: gate must block (passed:false) for add-1-remove-1 proposal. ' +
      'Got passed=' + gateResult.passed);
  } else {
    pass('I1-integration-add-1-remove-1-exit-1');
  }

  // Removal count must be present and > 0 in the output
  if (typeof gateResult.removedCount !== 'number' || gateResult.removedCount < 1) {
    fail('I1-integration-add-1-remove-1-removal-count-in-output',
      'Integration: gateResult.removedCount must be >= 1; got ' + gateResult.removedCount);
  } else {
    pass('I1-integration-add-1-remove-1-removal-count-in-output');
  }

  // Addition count must also be reported separately
  if (typeof gateResult.addedCount !== 'number') {
    fail('I1-integration-add-1-remove-1-added-count-in-output',
      'Integration: gateResult.addedCount must be a number; got ' + typeof gateResult.addedCount);
  } else {
    pass('I1-integration-add-1-remove-1-added-count-in-output');
  }

  // The reason/output string must mention the removal
  var outputStr = gateResult.reason || '';
  if (outputStr.indexOf('remov') === -1) {
    fail('I1-integration-add-1-remove-1-removal-mentioned-in-stdout',
      'Integration: gate result reason must reference removal; got: "' + outputStr + '"');
  } else {
    pass('I1-integration-add-1-remove-1-removal-mentioned-in-stdout');
  }
}());

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[failure-detector-integration-test] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
  }
  process.exit(1);
}
