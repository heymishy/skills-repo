#!/usr/bin/env node
/**
 * tests/check-compliance-report.js
 *
 * Integration tests for p3.13 — AC4:
 *   CI workflow YAML structure checks for .github/workflows/compliance-report.yml
 *
 * Tests:
 *   1. compliance-ci-job-uses-separate-schedule-trigger
 *      — workflow YAML has schedule: with monthly cron; no push/PR triggers
 *   2. compliance-ci-job-uses-read-only-token
 *      — permissions: block has contents: read; no write permissions
 *
 * Run: node tests/check-compliance-report.js
 * Used: npm test (via package.json chain)
 *
 * Zero external npm dependencies — plain Node.js (fs, path) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT         = path.join(__dirname, '..');
var WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'compliance-report.yml');

// ── Test harness ──────────────────────────────────────────────────────────────

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

// ── Load workflow YAML as text ────────────────────────────────────────────────

var workflowContent;
try {
  workflowContent = fs.readFileSync(WORKFLOW_PATH, 'utf8');
} catch (e) {
  process.stdout.write('\n[p3.13-compliance-report] ERROR: Cannot read workflow file: ' + WORKFLOW_PATH + '\n');
  process.stdout.write('  ' + e.message + '\n');
  process.stdout.write('[p3.13-compliance-report] Results: 0 passed, 2 failed\n');
  process.exit(1);
}

// ── Test 1: separate schedule trigger ────────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] AC4 \u2014 CI workflow structure\n');

(function () {
  var name = 'compliance-ci-job-uses-separate-schedule-trigger';

  // Must have schedule: trigger
  var hasSchedule = workflowContent.indexOf('schedule:') !== -1;
  // Must have a cron expression (monthly pattern: "0 0 1 * *" or similar)
  var hasCron = /cron:\s*['"]?[\d\s\*\/]+['"]?/.test(workflowContent);
  // Must NOT have push: trigger
  var hasPush = /^[\s]*push:/m.test(workflowContent);
  // Must NOT have pull_request: trigger
  var hasPullRequest = /^[\s]*pull_request:/m.test(workflowContent);

  if (hasSchedule && hasCron && !hasPush && !hasPullRequest) {
    pass(name);
  } else {
    var reasons = [];
    if (!hasSchedule)    reasons.push('missing schedule: trigger');
    if (!hasCron)        reasons.push('missing cron: expression');
    if (hasPush)         reasons.push('has push: trigger (must not)');
    if (hasPullRequest)  reasons.push('has pull_request: trigger (must not)');
    fail(name, reasons.join('; '));
  }
}());

// ── Test 2: read-only permissions ─────────────────────────────────────────────

(function () {
  var name = 'compliance-ci-job-uses-read-only-token';

  // Must have permissions: block
  var hasPermissions = workflowContent.indexOf('permissions:') !== -1;
  // Must have contents: read
  var hasContentsRead = /contents:\s*read/.test(workflowContent);
  // Must NOT have write permissions of any kind
  var hasWritePermission = /:\s*write/.test(workflowContent);

  if (hasPermissions && hasContentsRead && !hasWritePermission) {
    pass(name);
  } else {
    var reasons = [];
    if (!hasPermissions)   reasons.push('missing permissions: block');
    if (!hasContentsRead)  reasons.push('missing contents: read');
    if (hasWritePermission) reasons.push('has a write permission (must be read-only)');
    fail(name, reasons.join('; '));
  }
}());

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failures.length) {
  process.stdout.write('\nFailed tests:\n');
  failures.forEach(function (f) {
    process.stdout.write('  - ' + f.name + ': ' + f.reason + '\n');
  });
  process.exit(1);
}

process.exit(0);
