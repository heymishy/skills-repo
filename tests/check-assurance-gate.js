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
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
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

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[assurance-gate-check] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (const f of failures) {
    process.stdout.write('    \u2717 ' + f.name + ': ' + f.reason + '\n');
  }
  process.exit(1);
}
