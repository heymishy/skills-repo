#!/usr/bin/env node
/**
 * check-bitbucket-dc-auth.test.js
 *
 * Tests for story p3.1d: Resolve permanently-skipped Bitbucket DC auth tests.
 * Implements the Option B (manual test record) test path.
 *
 * Active tests (Option B):
 *   - U4-B: smoke-tests.md exists and contains all 4 auth test names
 *   - U5-B: each of the 4 entries has all 5 required fields
 *   - U6-B: 4 entries are independently parseable
 *   - U7-B: check-bitbucket-dc.js has // MANUAL: see smoke-tests.md annotation
 *           for each of the 4 auth test sections
 *   - U8:   decisions.md contains DEC-P3-001 with Option B rationale
 *
 * OPTION-NOT-CHOSEN tests (Option A — deferred per DEC-P3-001):
 *   - U1-A, U2-A, U3-A: not implemented — Option A is deferred
 *
 * Run:  node tests/check-bitbucket-dc-auth.test.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');

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

// ── Paths ─────────────────────────────────────────────────────────────────────

var smokeTestsPath  = path.join(__dirname, 'smoke-tests.md');
var dcCheckPath     = path.join(__dirname, 'check-bitbucket-dc.js');
var decisionsPath   = path.join(root, 'artefacts', '2026-04-14-skills-platform-phase3', 'decisions.md');

var AUTH_TEST_NAMES = ['app-password', 'OAuth', 'SSH key', 'PAT'];

process.stdout.write('[bitbucket-dc-auth-test] Running p3.1d Option B tests\u2026\n\n');

// ── U4-B: smoke-tests.md exists and contains all 4 auth test names ────────────

process.stdout.write('  Option B \u2014 U4-B: smoke-tests.md presence and auth test entries\n');

{
  var testName = 'U4-B-smoke-tests-md-exists-with-all-4-auth-names';
  if (!fs.existsSync(smokeTestsPath)) {
    fail(testName, 'tests/smoke-tests.md does not exist');
  } else {
    var smokeContent = fs.readFileSync(smokeTestsPath, 'utf8');
    var missing = AUTH_TEST_NAMES.filter(function (name) {
      return smokeContent.indexOf(name) === -1;
    });
    if (missing.length > 0) {
      fail(testName, 'smoke-tests.md is missing auth test entries for: ' + missing.join(', '));
    } else {
      pass(testName);
    }
  }
}

// ── U5-B: each entry has all 5 required fields ────────────────────────────────

process.stdout.write('\n  Option B \u2014 U5-B: each entry has all 5 required fields\n');

// Parse smoke-tests.md into per-test blocks keyed by auth test name.
// Each block is the text between one auth test heading and the next.
function parseSmokeTestEntries(content) {
  var entries = {};
  AUTH_TEST_NAMES.forEach(function (name) {
    // Find the heading line that contains this test name
    var startIdx = content.indexOf(name);
    if (startIdx === -1) { return; }
    // Take the text from that point up to the next ## heading or end of file
    var afterStart = content.slice(startIdx);
    var nextHeading = afterStart.slice(1).search(/^##\s/m);
    var block = nextHeading === -1
      ? afterStart
      : afterStart.slice(0, nextHeading + 1);
    entries[name] = block;
  });
  return entries;
}

if (fs.existsSync(smokeTestsPath)) {
  var smokeContent = smokeContent || fs.readFileSync(smokeTestsPath, 'utf8');
  var entries      = parseSmokeTestEntries(smokeContent);

  AUTH_TEST_NAMES.forEach(function (authName) {
    var tName = 'U5-B-fields-present-' + authName.replace(/\s+/g, '-').toLowerCase();
    var block = entries[authName];
    if (!block) {
      fail(tName, 'No entry found in smoke-tests.md for: ' + authName);
      return;
    }

    var fieldFailures = [];

    // Field 1: test name — the auth name itself must appear
    if (block.indexOf(authName) === -1) {
      fieldFailures.push('test name field missing');
    }

    // Field 2: ISO 8601 date (YYYY-MM-DD)
    if (!/\d{4}-\d{2}-\d{2}/.test(block)) {
      fieldFailures.push('ISO 8601 date field missing');
    }

    // Field 3: result field (SKIP, pass, or fail — case-insensitive)
    if (!/\b(SKIP|pass|fail)\b/i.test(block)) {
      fieldFailures.push('result field (SKIP/pass/fail) missing');
    }

    // Field 4: runner identity — a non-empty value after "Runner" label
    if (!/Runner\b[^|]*\|\s*\S/.test(block) && !/Runner.*:\s*\S/.test(block)) {
      fieldFailures.push('runner identity field missing or empty');
    }

    // Field 5: Docker dependency note — must mention "Docker" or "docker"
    if (!/[Dd]ocker/.test(block)) {
      fieldFailures.push('Docker dependency note missing');
    }

    if (fieldFailures.length > 0) {
      fail(tName, 'Entry for "' + authName + '" missing fields: ' + fieldFailures.join('; '));
    } else {
      pass(tName);
    }
  });
}

// ── U6-B: 4 entries are independently parseable ───────────────────────────────

process.stdout.write('\n  Option B \u2014 U6-B: 4 entries are independently parseable\n');

{
  var testName = 'U6-B-four-entries-independently-parseable';
  if (!fs.existsSync(smokeTestsPath)) {
    fail(testName, 'tests/smoke-tests.md does not exist');
  } else {
    var smokeContent = smokeContent || fs.readFileSync(smokeTestsPath, 'utf8');
    var entries      = parseSmokeTestEntries(smokeContent);
    var foundCount   = AUTH_TEST_NAMES.filter(function (n) { return !!entries[n]; }).length;
    if (foundCount < 4) {
      fail(testName, 'Only ' + foundCount + ' of 4 auth test entries are independently parseable');
    } else {
      pass(testName);
    }
  }
}

// ── U7-B: check-bitbucket-dc.js has // MANUAL: see smoke-tests.md ────────────

process.stdout.write('\n  Option B \u2014 U7-B: check-bitbucket-dc.js has MANUAL annotations\n');

{
  var testName = 'U7-B-check-bitbucket-dc-has-manual-annotations';
  if (!fs.existsSync(dcCheckPath)) {
    fail(testName, 'tests/check-bitbucket-dc.js does not exist');
  } else {
    var dcContent    = fs.readFileSync(dcCheckPath, 'utf8');
    var manualCount  = (dcContent.match(/\/\/ MANUAL: see smoke-tests\.md/g) || []).length;
    if (manualCount < 4) {
      fail(testName,
        '// MANUAL: see smoke-tests.md appears only ' + manualCount + ' time(s) in check-bitbucket-dc.js — expected at least 4 (one per auth test section)');
    } else {
      pass(testName);
    }
  }
}

// ── U8: decisions.md contains DEC-P3-001 with Option B rationale ─────────────

process.stdout.write('\n  Common \u2014 U8: decisions.md has DEC-P3-001 with Option B rationale\n');

{
  var testName = 'U8-decisions-md-has-dec-p3-001-option-b';
  if (!fs.existsSync(decisionsPath)) {
    fail(testName, 'artefacts/2026-04-14-skills-platform-phase3/decisions.md does not exist');
  } else {
    var decisionsContent = fs.readFileSync(decisionsPath, 'utf8');
    var hasDec       = decisionsContent.indexOf('DEC-P3-001') !== -1;
    var hasOptionB   = decisionsContent.indexOf('Option B') !== -1;
    var hasRationale = decisionsContent.indexOf('Rationale') !== -1 ||
                       decisionsContent.indexOf('rationale') !== -1;
    if (!hasDec) {
      fail(testName, 'decisions.md does not contain DEC-P3-001');
    } else if (!hasOptionB) {
      fail(testName, 'decisions.md does not mention Option B');
    } else if (!hasRationale) {
      fail(testName, 'decisions.md does not contain a rationale statement');
    } else {
      pass(testName);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[bitbucket-dc-auth-test] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
  }
  process.exit(1);
}
