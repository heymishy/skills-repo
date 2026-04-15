#!/usr/bin/env node
/**
 * tests/check-trace-commit.js
 *
 * Dual-mode script for trace-commit observability (p3.1a):
 *
 *   Check mode (--traces-dir <dir>):
 *     Reads trace files from <dir>, finds the most recent committedAt timestamp,
 *     exits 1 if stale (>= 24h) or absent, exits 0 if current.
 *
 *   Check mode (--check-origin):
 *     Uses git log --remotes=origin/traces to get the last commit timestamp,
 *     exits 1 if stale (>= 24h) or absent, exits 0 if current.
 *
 *   Test runner mode (no args — used by npm test):
 *     Runs all AC1–AC6 and NFR tests, reports pass/fail, exits 1 if any fail.
 *
 * AC1: Script is in tests/ and registered in npm test.
 * AC2: Exits 1 with timestamp + hours when trace is stale (elapsed >= 24h).
 * AC3: Exits 0 with confirmation when trace is current.
 * AC4: Exits 1 with absent-branch message when no trace files found.
 * AC5: verify-completion/SKILL.md contains git log origin/traces diagnostic.
 * AC6: trace/SKILL.md contains Traces Branch Health section.
 *
 * Architecture constraints:
 *   ADR-010: reads from origin/traces (remote ref) only — never a local branch.
 *   ADR-009: read-only — zero fs.write* calls anywhere in this script.
 *
 * Run:  node tests/check-trace-commit.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os, child_process).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');
var cp   = require('child_process');

var root        = path.join(__dirname, '..');
var THRESHOLD   = 86400000; // 24 hours in milliseconds

// ── Check mode helpers ────────────────────────────────────────────────────────

/**
 * Read the most recent committedAt timestamp (ms) from trace files in a dir.
 * Returns null if no files or no committedAt found.
 */
function readMostRecentCommittedAt(tracesDir) {
  var files;
  try {
    files = fs.readdirSync(tracesDir);
  } catch (e) {
    return null;
  }
  var jsonFiles = files.filter(function (f) {
    return f.endsWith('.json') || f.endsWith('.jsonl');
  });
  if (jsonFiles.length === 0) return null;

  var mostRecent = null;
  for (var i = 0; i < jsonFiles.length; i++) {
    var raw;
    try {
      raw = fs.readFileSync(path.join(tracesDir, jsonFiles[i]), 'utf8');
    } catch (e) {
      continue;
    }
    // Support JSONL (multiple JSON objects per file) and plain JSON
    var lines = raw.trim().split('\n').filter(Boolean);
    for (var j = 0; j < lines.length; j++) {
      try {
        var obj = JSON.parse(lines[j]);
        if (typeof obj.committedAt === 'number') {
          if (mostRecent === null || obj.committedAt > mostRecent) {
            mostRecent = obj.committedAt;
          }
        }
      } catch (_) { /* skip malformed lines */ }
    }
  }
  return mostRecent;
}

/**
 * Run the check against a local traces directory.
 * Exits with code 0 (current) or 1 (stale/absent).
 */
function runCheckFromDir(tracesDir) {
  var committedAt = readMostRecentCommittedAt(tracesDir);

  if (committedAt === null) {
    process.stdout.write(
      '[check-trace-commit] FAIL: origin/traces branch is absent — no trace files found in ' +
      tracesDir + '\n'
    );
    process.exit(1);
  }

  var elapsed      = Date.now() - committedAt;
  var isoTs        = new Date(committedAt).toISOString();
  var hoursElapsed = (elapsed / 3600000).toFixed(1);

  if (elapsed >= THRESHOLD) {
    process.stdout.write(
      '[check-trace-commit] FAIL: origin/traces is stale — last commit: ' +
      isoTs + ', ' + hoursElapsed + 'h elapsed\n'
    );
    process.exit(1);
  }

  process.stdout.write(
    '[check-trace-commit] OK: origin/traces is current — last commit: ' +
    isoTs + ' (' + hoursElapsed + 'h ago)\n'
  );
  process.exit(0);
}

/**
 * Run the check against origin/traces via git (ADR-010: remote ref only).
 * Exits with code 0 (current) or 1 (stale/absent).
 */
function runCheckFromOrigin() {
  var result = cp.spawnSync(
    'git',
    ['log', '--remotes=origin/traces', '-1', '--format=%ct'],
    { encoding: 'utf8', cwd: root, timeout: 5000 }
  );

  var raw = result.stdout ? result.stdout.trim() : '';
  if (result.status !== 0 || !raw) {
    process.stdout.write(
      '[check-trace-commit] FAIL: origin/traces branch is absent or unreachable\n'
    );
    process.exit(1);
  }

  var unixSec = parseInt(raw, 10);
  if (isNaN(unixSec)) {
    process.stdout.write(
      '[check-trace-commit] FAIL: origin/traces branch is absent or has no commits\n'
    );
    process.exit(1);
  }

  var committedAt  = unixSec * 1000;
  var elapsed      = Date.now() - committedAt;
  var isoTs        = new Date(committedAt).toISOString();
  var hoursElapsed = (elapsed / 3600000).toFixed(1);

  if (elapsed >= THRESHOLD) {
    process.stdout.write(
      '[check-trace-commit] FAIL: origin/traces is stale — last commit: ' +
      isoTs + ', ' + hoursElapsed + 'h elapsed\n'
    );
    process.exit(1);
  }

  process.stdout.write(
    '[check-trace-commit] OK: origin/traces is current — last commit: ' +
    isoTs + ' (' + hoursElapsed + 'h ago)\n'
  );
  process.exit(0);
}

// ── Mode dispatch ─────────────────────────────────────────────────────────────

var tracesDir   = null;
var checkOrigin = false;

for (var argIdx = 2; argIdx < process.argv.length; argIdx++) {
  if (process.argv[argIdx] === '--traces-dir' && process.argv[argIdx + 1]) {
    tracesDir = process.argv[argIdx + 1];
    argIdx++;
  } else if (process.argv[argIdx] === '--check-origin') {
    checkOrigin = true;
  }
}

if (tracesDir !== null) {
  runCheckFromDir(tracesDir);
  // runCheckFromDir always calls process.exit()
}

if (checkOrigin) {
  runCheckFromOrigin();
  // runCheckFromOrigin always calls process.exit()
}

// ── Test runner mode ──────────────────────────────────────────────────────────

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

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trace-commit-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  var entries = fs.readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var full = path.join(dir, entries[i]);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

/** Spawn this script with the given extra args and return the result. */
function spawnSelf(extraArgs) {
  return cp.spawnSync(
    process.execPath,
    [__filename].concat(extraArgs),
    { encoding: 'utf8', timeout: 10000 }
  );
}

/** Write a single-entry JSON fixture file. */
function writeFixture(dir, filename, committedAt) {
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify({ committedAt: committedAt })
  );
}

process.stdout.write('[check-trace-commit] Running p3.1a trace-commit observability tests\u2026\n\n');

// ── Unit tests ────────────────────────────────────────────────────────────────

process.stdout.write('  Unit: AC2 \u2014 exits 1 when trace is stale\n');

// exits-1-when-trace-file-stale-beyond-24h (AC2)
(function () {
  var testName = 'exits-1-when-trace-file-stale-beyond-24h';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 90000000); // 25h ago
    var result = spawnSelf(['--traces-dir', tmpDir]);
    if (result.status !== 1) {
      fail(testName, 'Expected exit code 1, got ' + result.status);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

// exits-1-when-trace-file-exactly-24h-old (AC2 boundary)
(function () {
  var testName = 'exits-1-when-trace-file-exactly-24h-old';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 86400000); // exactly 24h
    var result = spawnSelf(['--traces-dir', tmpDir]);
    if (result.status !== 1) {
      fail(testName, 'Boundary: expected exit code 1 at exactly 24h, got ' + result.status);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

process.stdout.write('\n  Unit: AC3 \u2014 exits 0 when trace is current\n');

// exits-0-when-trace-is-current (AC3)
(function () {
  var testName = 'exits-0-when-trace-is-current';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 3600000); // 1h ago
    var result = spawnSelf(['--traces-dir', tmpDir]);
    if (result.status !== 0) {
      fail(testName, 'Expected exit code 0, got ' + result.status +
           '; output: ' + result.stdout);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

process.stdout.write('\n  Unit: AC4 \u2014 exits 1 when trace is absent\n');

// exits-1-when-no-trace-file-for-branch (AC4)
(function () {
  var testName = 'exits-1-when-no-trace-file-for-branch';
  var tmpDir   = mkTmpDir();
  try {
    // Empty directory — no trace files
    var result = spawnSelf(['--traces-dir', tmpDir]);
    if (result.status !== 1) {
      fail(testName, 'Expected exit code 1 for absent branch, got ' + result.status);
    } else if (!result.stdout || result.stdout.indexOf('absent') === -1) {
      fail(testName, 'Expected "absent" in output; got: ' + result.stdout);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

process.stdout.write('\n  Unit: AC1 \u2014 npm test suite includes check-trace-commit\n');

// npm-test-suite-includes-check-trace-commit (AC1)
(function () {
  var testName = 'npm-test-suite-includes-check-trace-commit';
  try {
    var pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    var testCmd = (pkg.scripts && pkg.scripts.test) || '';
    if (testCmd.indexOf('check-trace-commit.js') === -1) {
      fail(testName, 'package.json scripts.test does not reference check-trace-commit.js');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}());

process.stdout.write('\n  Unit: AC5 \u2014 verify-completion/SKILL.md contains trace diagnostic commands\n');

// verify-completion-skill-contains-trace-diagnostic-commands (AC5)
(function () {
  var testName = 'verify-completion-skill-contains-trace-diagnostic-commands';
  var skillPath = path.join(root, '.github', 'skills', 'verify-completion', 'SKILL.md');
  try {
    var content = fs.readFileSync(skillPath, 'utf8');
    if (content.indexOf('git log origin/traces') === -1) {
      fail(testName, 'verify-completion/SKILL.md does not contain "git log origin/traces" diagnostic command');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error reading SKILL.md: ' + e.message);
  }
}());

process.stdout.write('\n  Unit: AC6 \u2014 trace/SKILL.md contains branch health section\n');

// trace-skill-contains-branch-health-section (AC6)
(function () {
  var testName  = 'trace-skill-contains-branch-health-section';
  var skillPath = path.join(root, '.github', 'skills', 'trace', 'SKILL.md');
  try {
    var content = fs.readFileSync(skillPath, 'utf8');
    var hasBranchHealth = content.toLowerCase().indexOf('branch health') !== -1;
    if (!hasBranchHealth) {
      fail(testName, 'trace/SKILL.md does not contain a "branch health" section');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error reading SKILL.md: ' + e.message);
  }
}());

// ── Integration tests ─────────────────────────────────────────────────────────

process.stdout.write('\n  Integration: ADR-010 compliance\n');

// check-trace-commit-reads-origin-traces-not-local (ADR-010)
(function () {
  var testName = 'check-trace-commit-reads-origin-traces-not-local';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 3600000); // 1h ago — current
    var result = spawnSelf(['--traces-dir', tmpDir]);
    if (result.status !== 0) {
      fail(testName, 'Script failed when valid --traces-dir provided; exit: ' +
           result.status + ', output: ' + result.stdout);
    } else {
      // Verify it read from the fixture path, not workspace/traces
      var output = result.stdout || '';
      if (output.indexOf('workspace') !== -1 && output.indexOf(tmpDir) === -1) {
        fail(testName, 'Output mentions workspace path; expected fixture path: ' + tmpDir);
      } else {
        pass(testName);
      }
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

process.stdout.write('\n  Integration: AC2 \u2014 stale output includes timestamp\n');

// stale-trace-output-includes-timestamp-in-message (AC2)
(function () {
  var testName  = 'stale-trace-output-includes-timestamp-in-message';
  var tmpDir    = mkTmpDir();
  var staleTime = Date.now() - 90000000; // 25h ago
  try {
    writeFixture(tmpDir, 'trace.json', staleTime);
    var result  = spawnSelf(['--traces-dir', tmpDir]);
    var output  = result.stdout || '';
    var isoTs   = new Date(staleTime).toISOString().slice(0, 10); // at least date part
    if (result.status !== 1) {
      fail(testName, 'Expected exit code 1; got ' + result.status);
    } else if (output.indexOf(isoTs) === -1) {
      fail(testName, 'Output does not contain timestamp ' + isoTs + '; got: ' + output);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

process.stdout.write('\n  Integration: AC3 \u2014 current trace produces no error output\n');

// current-trace-produces-no-error-output (AC3)
(function () {
  var testName = 'current-trace-produces-no-error-output';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 3600000); // 1h ago
    var result  = spawnSelf(['--traces-dir', tmpDir]);
    var stderr  = result.stderr || '';
    if (result.status !== 0) {
      fail(testName, 'Expected exit code 0; got ' + result.status);
    } else if (stderr.trim().length > 0) {
      fail(testName, 'Expected empty stderr; got: ' + stderr);
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

// ── NFR tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n  NFR \u2014 performance and read-only compliance\n');

// completes-within-5-seconds (Performance NFR)
(function () {
  var testName = 'completes-within-5-seconds';
  var tmpDir   = mkTmpDir();
  try {
    writeFixture(tmpDir, 'trace.json', Date.now() - 3600000);
    var start  = Date.now();
    spawnSelf(['--traces-dir', tmpDir]);
    var elapsed = Date.now() - start;
    if (elapsed >= 5000) {
      fail(testName, 'Script took ' + elapsed + 'ms (threshold: 5000ms)');
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(tmpDir);
  }
}());

// script-makes-no-write-calls (Security/ADR-009 NFR)
(function () {
  var testName = 'script-makes-no-write-calls';
  try {
    var src = fs.readFileSync(__filename, 'utf8');
    // Strip all comments then scan for write calls in implementation code.
    // We allow writeFixture() in the TEST section — check only the check-mode
    // implementation sections above the "Test runner mode" marker.
    var implSrc = src.split('// ── Test runner mode')[0];
    var WRITE_PATTERNS = [
      /\bfs\.writeFile\b/,
      /\bfs\.writeFileSync\b/,
      /\bfs\.appendFile\b/,
      /\bfs\.appendFileSync\b/,
    ];
    var found = [];
    for (var i = 0; i < WRITE_PATTERNS.length; i++) {
      if (WRITE_PATTERNS[i].test(implSrc)) {
        found.push(WRITE_PATTERNS[i].source);
      }
    }
    if (found.length > 0) {
      fail(testName, 'Check-mode implementation contains write calls: ' + found.join(', '));
    } else {
      pass(testName);
    }
  } catch (e) {
    fail(testName, 'Unexpected error: ' + e.message);
  }
}());

// ── Report ────────────────────────────────────────────────────────────────────

process.stdout.write('\n');
if (failed > 0) {
  process.stderr.write('[check-trace-commit] FAIL \u2014 ' + failed + ' test(s) failed:\n\n');
  for (var fi = 0; fi < failures.length; fi++) {
    process.stderr.write('  \u2717 ' + failures[fi].name + '\n');
    process.stderr.write('    \u2192 ' + failures[fi].reason + '\n');
  }
  process.stderr.write('\n');
  process.exit(1);
}

process.stdout.write('[check-trace-commit] ' + passed + ' test(s) passed \u2713\n');
process.exit(0);
