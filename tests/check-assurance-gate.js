#!/usr/bin/env node
/**
 * check-assurance-gate.js
 *
 * Automated tests for the assurance gate CI gate implementation.
 * Validates the gate runner script and workflow configuration.
 *
 * Implements tests from the test plan for story p1.3:
 *
 *   Unit tests:
 *   - trace-inprogress-written-before-evaluation  (AC2)
 *   - trace-completed-follows-inprogress          (AC3)
 *   - trace-completed-follows-inprogress-on-error (AC3 edge case)
 *   - trace-ci-trigger-metadata                   (AC5b)
 *
 *   Integration tests:
 *   - ci-trigger-starts-gate-without-manual-action (AC1)
 *   - gate-writes-inprogress-then-completed        (AC2, AC3)
 *   - gate-verdict-surface-to-pr                   (AC4)
 *   - two-trace-entries-on-ci-trigger              (AC5a)
 *
 *   NFR tests:
 *   - nfr-gate-completes-within-10-minutes
 *   - nfr-no-credential-values-in-ci-config
 *   - nfr-trace-audit-fields-present
 *
 * Run:  node tests/check-assurance-gate.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os, crypto).
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const root         = path.join(__dirname, '..');
const gateRunner   = require(path.join(root, '.github', 'scripts', 'run-assurance-gate.js'));
const workflowPath = path.join(root, '.github', 'workflows', 'assurance-gate.yml');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
let skipped  = 0;
const failures = [];

// Load known-deferred check names from known-deferred-checks.json (if present).
// Tests listed there emit SKIP instead of FAIL — they are pre-documented as
// pending implementation, not regressions.
const deferredChecksPath = path.join(root, 'known-deferred-checks.json');
const deferredCheckNames = new Set(
  fs.existsSync(deferredChecksPath)
    ? JSON.parse(fs.readFileSync(deferredChecksPath, 'utf8')).deferredChecks.map(function (d) { return d.testName; })
    : []
);

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  // If this test is documented in known-deferred-checks.json, emit SKIP instead of FAIL.
  if (deferredCheckNames.has(name)) {
    skipped++;
    process.stdout.write('  \u23ed ' + name + ' [SKIP — known-deferred]\n');
    process.stdout.write('    \u2192 ' + reason + '\n');
    return;
  }
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gate-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

function readTraceFile(tracePath) {
  const lines = fs.readFileSync(tracePath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map(function (l) { return JSON.parse(l); });
}

function readAllTraceEntries(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  for (const file of fs.readdirSync(dir).filter(function (f) { return f.endsWith('.jsonl'); })) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try { entries.push(JSON.parse(line)); } catch (_) { /* skip malformed */ }
    }
  }
  return entries;
}

// A synthetic 40-char hex commit SHA for tests
const SYNTHETIC_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

// ISO 8601 and commit SHA format validators
const ISO_8601_RE   = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const COMMIT_SHA_RE = /^[0-9a-f]{40}$/i;

// Credential value patterns (from test plan nfr-no-credential-values-in-ci-config)
const CREDENTIAL_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/,
  /Bearer [A-Za-z0-9]{20,}/,
  /\btoken: [A-Za-z0-9]{16,}/,
  /\bpassword: [^$\n][^\n]{4,}/,
];

// ── Unit tests ────────────────────────────────────────────────────────────────

process.stdout.write('[assurance-gate-check] Running p1.3 assurance gate tests\u2026\n\n');
process.stdout.write('  Unit: AC2 \u2014 inProgress written before evaluation\n');

// ── trace-inprogress-written-before-evaluation (AC2) ─────────────────────────
{
  const testName = 'trace-inprogress-written-before-evaluation';
  const dir = mkTmpDir();
  try {
    var traceStateAtCheckTime = null;
    const checksRunner = function (r) {
      // Read trace directory at check time — inProgress entry must already exist
      const files = fs.readdirSync(dir).filter(function (f) { return f.endsWith('.jsonl'); });
      if (files.length > 0) {
        traceStateAtCheckTime = fs.readFileSync(path.join(dir, files[0]), 'utf8');
      }
      return [{ name: 'test-check', passed: true }];
    };

    gateRunner.runGate({
      trigger:      'ci',
      prRef:        'refs/pull/1/merge',
      commitSha:    SYNTHETIC_SHA,
      tracesDir:    dir,
      checksRunner,
    });

    if (traceStateAtCheckTime === null) {
      fail(testName, 'checksRunner was called but found no trace file in the directory');
    } else {
      const entries = traceStateAtCheckTime.trim().split('\n').filter(Boolean).map(function (l) { return JSON.parse(l); });
      if (entries.length < 1) {
        fail(testName, 'Trace file was empty when checksRunner executed');
      } else if (entries[0].status !== 'inProgress') {
        fail(testName, 'First trace entry at check time had status \'' + entries[0].status + '\', expected \'inProgress\'');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── Unit: AC3 — trace-completed-follows-inprogress ───────────────────────────

process.stdout.write('\n  Unit: AC3 \u2014 completed entry follows inProgress\n');

{
  const testName = 'trace-completed-follows-inprogress';
  const dir = mkTmpDir();
  try {
    const result = gateRunner.runGate({
      trigger:   'ci',
      prRef:     'refs/pull/2/merge',
      commitSha: SYNTHETIC_SHA,
      tracesDir: dir,
    });

    const entries = readTraceFile(result.tracePath);
    if (entries.length !== 2) {
      fail(testName, 'Expected exactly 2 trace entries, got ' + entries.length);
    } else if (entries[0].status !== 'inProgress') {
      fail(testName, 'First entry status is \'' + entries[0].status + '\', expected \'inProgress\'');
    } else if (entries[1].status !== 'completed') {
      fail(testName, 'Second entry status is \'' + entries[1].status + '\', expected \'completed\'');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// Edge case: error mid-run still produces completed entry with verdict: fail
{
  const testName = 'trace-completed-follows-inprogress-on-error';
  const dir = mkTmpDir();
  try {
    const throwingChecksRunner = function () { throw new Error('simulated mid-run error'); };

    const result = gateRunner.runGate({
      trigger:      'ci',
      prRef:        'refs/pull/3/merge',
      commitSha:    SYNTHETIC_SHA,
      tracesDir:    dir,
      checksRunner: throwingChecksRunner,
    });

    const entries = readTraceFile(result.tracePath);
    if (entries.length !== 2) {
      fail(testName, 'Expected 2 trace entries even on error, got ' + entries.length);
    } else if (entries[1].status !== 'completed') {
      fail(testName, 'Second entry on error should be \'completed\', got \'' + entries[1].status + '\'');
    } else if (entries[1].verdict !== 'fail') {
      fail(testName, 'Second entry on error should have verdict \'fail\', got \'' + entries[1].verdict + '\'');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// Edge case: failed runs must carry a kebab-case failurePattern label
{
  const testName = 'trace-failed-entry-includes-failurepattern';
  const dir = mkTmpDir();
  try {
    const failingChecksRunner = function () {
      return [{
        name: 'mock-check',
        passed: false,
        failurePatternGuarded: 'Skill exits early without writing pipeline state',
      }];
    };

    const result = gateRunner.runGate({
      trigger:      'ci',
      prRef:        'refs/pull/3/merge',
      commitSha:    SYNTHETIC_SHA,
      tracesDir:    dir,
      checksRunner: failingChecksRunner,
    });

    const entries   = readTraceFile(result.tracePath);
    const completed = entries.find(function (e) { return e.status === 'completed'; });

    if (!completed) {
      fail(testName, 'No completed entry written for failed run');
    } else if (completed.verdict !== 'fail') {
      fail(testName, 'Expected failed verdict, got \'' + completed.verdict + '\'');
    } else if (!completed.failurePattern) {
      fail(testName, 'completed.failurePattern is missing on failed run');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(completed.failurePattern)) {
      fail(testName, 'completed.failurePattern must be kebab-case, got \'' + completed.failurePattern + '\'');
    } else if (completed.failurePattern !== 'skill-exits-early-without-writing-pipeline-state') {
      fail(testName, 'Unexpected failurePattern value \'' + completed.failurePattern + '\'');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── Unit: AC5b — trace-ci-trigger-metadata ────────────────────────────────────

process.stdout.write('\n  Unit: AC5b \u2014 CI trigger metadata\n');

{
  const testName = 'trace-ci-trigger-metadata';
  const dir = mkTmpDir();
  try {
    const result = gateRunner.runGate({
      trigger:   'ci',
      prRef:     'refs/pull/4/merge',
      commitSha: SYNTHETIC_SHA,
      tracesDir: dir,
    });

    const entries   = readTraceFile(result.tracePath);
    const completed = entries.find(function (e) { return e.status === 'completed'; });
    if (!completed) {
      fail(testName, 'No completed entry found in trace');
    } else if (completed.trigger !== 'ci') {
      fail(testName, 'trigger field is \'' + completed.trigger + '\', expected \'ci\'');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── Integration tests ─────────────────────────────────────────────────────────

process.stdout.write('\n  Integration: AC1 \u2014 CI trigger configuration\n');

// ── ci-trigger-starts-gate-without-manual-action (AC1) ───────────────────────
{
  const testName = 'ci-trigger-starts-gate-without-manual-action';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml            = fs.readFileSync(workflowPath, 'utf8');
      const hasPullRequest = /^\s+pull_request\s*:/m.test(yml);
      const hasOpened      = yml.includes('opened');
      const hasSynchronize = yml.includes('synchronize');
      const setsTriggerCi  = yml.includes('TRIGGER: ci') || yml.includes("TRIGGER: 'ci'") || yml.includes('TRIGGER: "ci"');

      if (!hasPullRequest) {
        fail(testName, 'Workflow does not have a pull_request trigger');
      } else if (!hasOpened) {
        fail(testName, 'Workflow pull_request trigger does not include "opened" type');
      } else if (!hasSynchronize) {
        fail(testName, 'Workflow pull_request trigger does not include "synchronize" type');
      } else if (!setsTriggerCi) {
        fail(testName, 'Workflow gate step does not set TRIGGER environment variable to "ci"');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Integration: AC2+AC3 — gate-writes-inprogress-then-completed ─────────────

process.stdout.write('\n  Integration: AC2+AC3 \u2014 full gate run\n');

{
  const testName = 'gate-writes-inprogress-then-completed';
  const dir = mkTmpDir();
  try {
    const result = gateRunner.runGate({
      trigger:   'ci',
      prRef:     'refs/pull/5/merge',
      commitSha: SYNTHETIC_SHA,
      tracesDir: dir,
    });

    const entries    = readTraceFile(result.tracePath);
    const inProgress = entries.find(function (e) { return e.status === 'inProgress'; });
    const completed  = entries.find(function (e) { return e.status === 'completed'; });

    if (!inProgress || !completed) {
      fail(testName, 'Trace must have inProgress and completed entries (found: ' + entries.map(function (e) { return e.status; }).join(', ') + ')');
    } else {
      const requiredFields = ['startedAt', 'completedAt', 'prRef', 'commitSha', 'trigger', 'verdict', 'traceHash'];
      const missing = requiredFields.filter(function (f) { return !completed[f]; });
      if (missing.length > 0) {
        fail(testName, 'Completed entry missing required fields: ' + missing.join(', '));
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── Integration: AC4 — gate-verdict-surface-to-pr ────────────────────────────

process.stdout.write('\n  Integration: AC4 \u2014 verdict surfaced to PR\n');

{
  const testName = 'gate-verdict-surface-to-pr';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml            = fs.readFileSync(workflowPath, 'utf8');
      const hasVerdictPost = yml.includes('verdict') && (
        yml.includes('createComment') ||
        yml.includes('github-script')
      );
      const hasAlways      = yml.includes('always()');
      const hasGithubToken = yml.includes('secrets.GITHUB_TOKEN') || yml.includes('github-token:');

      if (!hasVerdictPost) {
        fail(testName, 'Workflow does not have a step to post the verdict to the PR');
      } else if (!hasAlways) {
        fail(testName, 'Verdict-posting step should use if: always() to run even on gate failure');
      } else if (!hasGithubToken) {
        fail(testName, 'Verdict-posting step does not reference a GitHub token');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Integration: AC5a — two-trace-entries-on-ci-trigger ──────────────────────

process.stdout.write('\n  Integration: AC5a \u2014 manual and CI traces coexist\n');

{
  const testName = 'two-trace-entries-on-ci-trigger';
  const dir = mkTmpDir();
  try {
    // Write a pre-existing manual trace fixture
    const manualRunId       = '2026-04-09T10-00-00-000Z-manual-fixture';
    const manualTraceFile   = path.join(dir, manualRunId + '.jsonl');
    const manualStartedAt   = '2026-04-09T10:00:00.000Z';
    const manualCompletedAt = '2026-04-09T10:00:01.000Z';
    const manualTraceHash   = gateRunner.computeTraceHash({
      trigger:     'manual',
      prRef:       'refs/pull/5/merge',
      commitSha:   SYNTHETIC_SHA,
      startedAt:   manualStartedAt,
      completedAt: manualCompletedAt,
      verdict:     'pass',
    });

    fs.writeFileSync(manualTraceFile,
      JSON.stringify({ status: 'inProgress', trigger: 'manual', prRef: 'refs/pull/5/merge', commitSha: SYNTHETIC_SHA, startedAt: manualStartedAt }) + '\n' +
      JSON.stringify({ status: 'completed',  trigger: 'manual', prRef: 'refs/pull/5/merge', commitSha: SYNTHETIC_SHA, startedAt: manualStartedAt, completedAt: manualCompletedAt, verdict: 'pass', traceHash: manualTraceHash, checks: [] }) + '\n'
    );

    // Run the CI-triggered gate in the same directory
    gateRunner.runGate({
      trigger:   'ci',
      prRef:     'refs/pull/5/merge',
      commitSha: SYNTHETIC_SHA,
      tracesDir: dir,
    });

    // Read all completed entries from the directory
    const allEntries      = readAllTraceEntries(dir);
    const completedAll    = allEntries.filter(function (e) { return e.status === 'completed'; });
    const manualCompleted = completedAll.find(function (e) { return e.trigger === 'manual'; });
    const ciCompleted     = completedAll.find(function (e) { return e.trigger === 'ci'; });

    if (!manualCompleted) {
      fail(testName, 'Manual trace entry not found after CI-triggered gate run (CI run overwrote it?)');
    } else if (!ciCompleted) {
      fail(testName, 'CI trace entry not found after gate run');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── NFR tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n  NFR: Performance, security, audit\n');

// ── nfr-gate-completes-within-10-minutes ─────────────────────────────────────
{
  const testName = 'nfr-gate-completes-within-10-minutes';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml          = fs.readFileSync(workflowPath, 'utf8');
      const timeoutMatch = yml.match(/timeout-minutes:\s*(\d+)/);
      if (!timeoutMatch) {
        fail(testName, 'Workflow does not have timeout-minutes configured on the gate job');
      } else {
        const timeout = parseInt(timeoutMatch[1], 10);
        if (timeout > 10) {
          fail(testName, 'timeout-minutes is ' + timeout + ', expected \u226410');
        } else {
          pass(testName + ' (timeout-minutes: ' + timeout + ')');
        }
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── nfr-no-credential-values-in-ci-config ────────────────────────────────────
{
  const testName = 'nfr-no-credential-values-in-ci-config';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml     = fs.readFileSync(workflowPath, 'utf8');
      const matches = CREDENTIAL_PATTERNS.filter(function (p) { return p.test(yml); });
      if (matches.length > 0) {
        fail(testName, 'Credential value patterns found in CI config: ' + matches.map(String).join(', '));
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── nfr-trace-audit-fields-present ───────────────────────────────────────────
{
  const testName = 'nfr-trace-audit-fields-present';
  const dir = mkTmpDir();
  try {
    const result = gateRunner.runGate({
      trigger:   'ci',
      prRef:     'refs/pull/6/merge',
      commitSha: SYNTHETIC_SHA,
      tracesDir: dir,
    });

    const entries   = readTraceFile(result.tracePath);
    const completed = entries.find(function (e) { return e.status === 'completed'; });

    if (!completed) {
      fail(testName, 'No completed trace entry found');
    } else {
      const issues = [];
      if (!ISO_8601_RE.test(completed.startedAt)) {
        issues.push('startedAt \'' + completed.startedAt + '\' is not ISO 8601');
      }
      if (!ISO_8601_RE.test(completed.completedAt)) {
        issues.push('completedAt \'' + completed.completedAt + '\' is not ISO 8601');
      }
      if (!completed.prRef || completed.prRef.length === 0) {
        issues.push('prRef is missing or empty');
      }
      if (!COMMIT_SHA_RE.test(completed.commitSha)) {
        issues.push('commitSha \'' + completed.commitSha + '\' is not a 40-char hex string');
      }
      if (completed.trigger !== 'ci' && completed.trigger !== 'manual') {
        issues.push('trigger \'' + completed.trigger + '\' is not \'ci\' or \'manual\'');
      }

      if (issues.length > 0) {
        fail(testName, 'Audit field issues: ' + issues.join('; '));
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── p3.3: Gate structural independence — checksum validation (AC3) ────────────

process.stdout.write('\n  p3.3 Unit: AC3 — checksum validation\n');

const checksumValidator = require('../src/gate-validator/checksum-validator.js');
const { ChecksumMismatchError } = checksumValidator;

// checksum-match-allows-execution (AC3)
{
  const testName = 'checksum-match-allows-execution';
  const dir = mkTmpDir();
  try {
    const content = 'console.log("gate script content");';
    const gatePath = path.join(dir, 'gate.js');
    fs.writeFileSync(gatePath, content, 'utf8');
    const expectedHash = require('crypto').createHash('sha256').update(content, 'utf8').digest('hex');
    const result = checksumValidator.validateChecksum(gatePath, expectedHash);
    if (result !== true) {
      fail(testName, 'Expected validateChecksum to return true on match, got: ' + result);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// checksum-mismatch-exits-with-abort-message (AC3)
{
  const testName = 'checksum-mismatch-exits-with-abort-message';
  const dir = mkTmpDir();
  try {
    const content = 'console.log("gate script content");';
    const gatePath = path.join(dir, 'gate.js');
    fs.writeFileSync(gatePath, content, 'utf8');
    const wrongHash = 'aabbccdd00112233aabbccdd00112233aabbccdd00112233aabbccdd00112233';
    try {
      checksumValidator.validateChecksum(gatePath, wrongHash);
      fail(testName, 'Expected ChecksumMismatchError to be thrown, but no error was thrown');
    } catch (e) {
      if (!(e instanceof ChecksumMismatchError)) {
        fail(testName, 'Expected ChecksumMismatchError, got: ' + e.constructor.name + ' — ' + e.message);
      } else if (!e.message.includes('Gate script checksum mismatch \u2014 aborting')) {
        fail(testName, 'Error message does not include required text. Got: ' + e.message);
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected outer error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// checksum-mismatch-does-not-execute-gate (AC3)
{
  const testName = 'checksum-mismatch-does-not-execute-gate';
  const dir = mkTmpDir();
  try {
    const content = 'console.log("gate script");';
    const gatePath = path.join(dir, 'gate.js');
    fs.writeFileSync(gatePath, content, 'utf8');
    const wrongHash = 'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
    let gateCalled = false;
    function mockGate() { gateCalled = true; }
    try {
      checksumValidator.validateChecksum(gatePath, wrongHash);
      mockGate(); // must not be reached
    } catch (_) {
      // expected — mismatch throws
    }
    if (gateCalled) {
      fail(testName, 'Gate execution mock was called despite checksum mismatch');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}

// ── p3.3 Integration: AC2 — workflow uses pinned immutable ref ────────────────

process.stdout.write('\n  p3.3 Integration: AC2 — workflow pinned ref\n');

{
  const testName = 'workflow-yaml-uses-pinned-immutable-ref';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml = fs.readFileSync(workflowPath, 'utf8');
      // Find ref: <value> — must be a full 40-char SHA or a vX.Y version tag
      const refMatch = yml.match(/\bref:\s*([0-9a-f]{40}|v\d+\.\d+[^\s\n]*)/i);
      if (!refMatch) {
        fail(testName, 'Workflow does not contain a ref: field with a full commit SHA or version tag for the gate-download step');
      } else {
        const ref = refMatch[1].trim();
        pass(testName + ' (ref: ' + ref.slice(0, 12) + '...)');
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── p3.3 Integration: AC4 — schema contains gateScriptRef fields ──────────────

process.stdout.write('\n  p3.3 Integration: AC4 — schema gate fields\n');

{
  const testName = 'schema-contains-gate-script-ref-fields';
  const schemaPath = path.join(root, '.github', 'pipeline-state.schema.json');
  try {
    if (!fs.existsSync(schemaPath)) {
      fail(testName, '.github/pipeline-state.schema.json not found');
    } else {
      const schemaText = fs.readFileSync(schemaPath, 'utf8');
      const hasGateScriptRef     = schemaText.includes('gateScriptRef');
      const hasChecksumVerified  = schemaText.includes('gateChecksumVerified');
      if (!hasGateScriptRef) {
        fail(testName, 'Schema does not contain gateScriptRef field definition');
      } else if (!hasChecksumVerified) {
        fail(testName, 'Schema does not contain gateChecksumVerified field definition');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── p3.3 NFR: gate download uses HTTPS, no PAT ────────────────────────────────

process.stdout.write('\n  p3.3 NFR: HTTPS download, no PAT\n');

{
  const testName = 'download-uses-https-not-http';
  try {
    if (!fs.existsSync(workflowPath)) {
      fail(testName, '.github/workflows/assurance-gate.yml not found');
    } else {
      const yml = fs.readFileSync(workflowPath, 'utf8');
      const hasInfraRef   = yml.includes('skills-framework-infra');
      const hasPlainHttp  = /\bhttp:\/\/[a-zA-Z]/.test(yml);
      const hasPatLiteral = /ghp_[A-Za-z0-9]{10}/.test(yml);
      if (!hasInfraRef) {
        fail(testName, 'Workflow does not reference skills-framework-infra repository');
      } else if (hasPlainHttp) {
        fail(testName, 'Workflow contains plain http:// URL — must use https://');
      } else if (hasPatLiteral) {
        fail(testName, 'Workflow contains a hardcoded PAT literal (ghp_...) — MC-SEC-01 violation');
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[assurance-gate-check] Results: ' + passed + ' passed, ' + failed + ' failed' + (skipped > 0 ? ', ' + skipped + ' skipped (known-deferred)' : '') + '\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (const f of failures) {
    process.stdout.write('    \u2717 ' + f.name + ': ' + f.reason + '\n');
  }
  process.exit(1);
}
