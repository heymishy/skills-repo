#!/usr/bin/env node
/**
 * check-trace-registry.js
 *
 * Automated tests for the cross-team trace registry (p3.7).
 *
 * Tests from the test plan:
 *
 *   Integration tests (AC1, AC3, AC4 — CI workflow):
 *   - aggregation-workflow-uses-separate-schedule-trigger
 *   - aggregation-workflow-uses-read-only-token
 *   - aggregation-output-path-follows-schema
 *
 *   Unit tests (AC2, AC5 — getTraces):
 *   - getTraces-module-exists
 *   - getTraces-exports-function
 *
 * Run:  node tests/check-trace-registry.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) { console.log('  ✓ ' + name); passed++; }
function fail(name, reason) {
  console.error('  ✗ ' + name);
  console.error('      ' + reason);
  failed++;
  failures.push(name + ': ' + reason);
}

var workflowPath = path.join(root, '.github', 'workflows', 'trace-aggregation.yml');
var modulePath   = path.join(root, 'src', 'trace-registry', 'getTraces.js');

// ── Test: workflow has separate schedule trigger (AC3 + AC4) ─────────────────
(function test_schedule_trigger() {
  var name = 'aggregation-workflow-uses-separate-schedule-trigger';
  if (!fs.existsSync(workflowPath)) {
    fail(name, '.github/workflows/trace-aggregation.yml not found');
    return;
  }
  var content = fs.readFileSync(workflowPath, 'utf8');
  var hasSchedule = /^\s*schedule\s*:/m.test(content);
  var hasCron     = /cron\s*:/i.test(content);
  // Must NOT have pull_request or push as triggers (ADR-009 — separate trigger)
  var hasPrTrigger   = /^\s+pull_request\s*:/m.test(content);
  var hasPushTrigger = /^\s+push\s*:/m.test(content);

  if (hasSchedule && hasCron && !hasPrTrigger && !hasPushTrigger) {
    pass(name);
  } else if (!hasSchedule) {
    fail(name, 'Workflow does not have a schedule: trigger');
  } else if (!hasCron) {
    fail(name, 'Workflow schedule does not include a cron expression');
  } else if (hasPrTrigger) {
    fail(name, 'Workflow includes pull_request trigger — violates ADR-009 (must use separate trigger)');
  } else if (hasPushTrigger) {
    fail(name, 'Workflow includes push trigger — violates ADR-009 (must use separate trigger)');
  }
})();

// ── Test: workflow uses read-only token (AC4 / ADR-009) ──────────────────────
(function test_read_only_token() {
  var name = 'aggregation-workflow-uses-read-only-token';
  if (!fs.existsSync(workflowPath)) {
    fail(name, '.github/workflows/trace-aggregation.yml not found');
    return;
  }
  var content = fs.readFileSync(workflowPath, 'utf8');
  var hasPermissions = /^\s*permissions\s*:/m.test(content);
  var hasReadContents = /contents\s*:\s*read/i.test(content);
  var hasWriteContents = /contents\s*:\s*write/i.test(content);

  if (hasPermissions && hasReadContents && !hasWriteContents) {
    pass(name);
  } else if (!hasPermissions) {
    fail(name, 'Workflow is missing a permissions: block (ADR-009 requires explicit permissions)');
  } else if (!hasReadContents) {
    fail(name, 'Workflow does not set contents: read in permissions block');
  } else if (hasWriteContents) {
    fail(name, 'Workflow sets contents: write — must be read-only (ADR-009)');
  }
})();

// ── Test: aggregation output path follows schema (AC1) ───────────────────────
(function test_output_path_schema() {
  var name = 'aggregation-output-path-follows-schema';
  if (!fs.existsSync(workflowPath)) {
    fail(name, '.github/workflows/trace-aggregation.yml not found');
    return;
  }
  var content = fs.readFileSync(workflowPath, 'utf8');
  // Workflow must write to platform/traces/[squadId]/[storySlug].jsonl
  var hasOutputPath = /platform\/traces/.test(content);
  var hasJsonl      = /\.jsonl/.test(content);
  if (hasOutputPath && hasJsonl) {
    pass(name);
  } else if (!hasOutputPath) {
    fail(name, 'Workflow does not reference platform/traces/ output path');
  } else {
    fail(name, 'Workflow does not reference .jsonl output format');
  }
})();

// ── Test: getTraces module exists ─────────────────────────────────────────────
(function test_module_exists() {
  var name = 'getTraces-module-exists';
  if (fs.existsSync(modulePath)) {
    pass(name);
  } else {
    fail(name, 'src/trace-registry/getTraces.js not found');
  }
})();

// ── Test: getTraces exports function ─────────────────────────────────────────
(function test_exports_function() {
  var name = 'getTraces-exports-function';
  if (!fs.existsSync(modulePath)) {
    fail(name, 'src/trace-registry/getTraces.js not found');
    return;
  }
  try {
    var m = require(modulePath);
    if (typeof m.getTraces === 'function') {
      pass(name);
    } else {
      fail(name, 'getTraces is not exported as a function; exports: ' + Object.keys(m).join(', '));
    }
  } catch (e) {
    fail(name, 'Failed to require getTraces.js: ' + e.message);
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('check-trace-registry: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(function (f) { console.error('  - ' + f); });
  process.exit(1);
}
