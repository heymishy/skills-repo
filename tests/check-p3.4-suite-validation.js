#!/usr/bin/env node
/**
 * tests/check-p3.4-suite-validation.js
 *
 * Automated tests for p3.4 eval anti-gaming controls:
 *   scripts/validate-suite-entry.js  — traceId + failurePattern validation (AC1, AC2, AC5)
 *   src/improvement-agent/suite-proposal.js — proposal staging path (AC3)
 *
 * AC coverage:
 *   AC1  — validation-fails-on-missing-trace-id
 *   AC1  — validation-fails-on-missing-failure-pattern
 *   AC2  — validation-fails-on-trace-id-file-not-found
 *   AC2  — validation-passes-with-valid-trace-id-and-file
 *   AC2  — path-traversal-blocked (security)
 *   AC3  — improvement-agent-proposal-written-to-proposals-not-suite
 *   AC3  — improvement-agent-proposal-contains-required-fields
 *   AC4  — no-automated-promotion-code-exists (code scan)
 *   AC5  — grandfathered-entries-pass-validation
 *
 * Run: node tests/check-p3.4-suite-validation.js
 * Used: npm test
 *
 * Zero external npm dependencies — plain Node.js (fs, os, path) only.
 */
'use strict';

var fs   = require('fs');
var os   = require('os');
var path = require('path');

var root         = path.join(__dirname, '..');
var validator    = require(path.join(root, 'scripts', 'validate-suite-entry.js'));
var suiteProposal = require(path.join(root, 'src', 'improvement-agent', 'suite-proposal.js'));

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

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'p3.4-test-'));
}

function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ── AC1: Missing required fields ─────────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] AC1 \u2014 missing required fields\n');

// validation-fails-on-missing-trace-id
(function () {
  var name = 'validation-fails-on-missing-trace-id';
  var dir  = mkTmpDir();
  try {
    var entry  = { failurePattern: 'some-failure', description: 'test entry without traceId' };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (result.valid) {
      fail(name, 'Expected valid: false for entry without traceId, got valid: true');
    } else {
      var mentionsTraceId = result.errors.some(function (e) {
        return e.toLowerCase().indexOf('traceid') !== -1;
      });
      if (!mentionsTraceId) {
        fail(name, 'Error messages do not mention traceId. Got: ' + result.errors.join('; '));
      } else {
        pass(name);
      }
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// validation-fails-on-missing-failure-pattern
(function () {
  var name = 'validation-fails-on-missing-failure-pattern';
  var dir  = mkTmpDir();
  try {
    // Create a trace file so traceId resolves successfully
    var tracesDir = path.join(dir, 'workspace', 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    fs.writeFileSync(path.join(tracesDir, 'test-trace.jsonl'), '{}', 'utf8');

    var entry  = { traceId: 'test-trace.jsonl', description: 'test entry without failurePattern' };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (result.valid) {
      fail(name, 'Expected valid: false for entry without failurePattern, got valid: true');
    } else {
      var mentionsPattern = result.errors.some(function (e) {
        return e.toLowerCase().indexOf('failurepattern') !== -1;
      });
      if (!mentionsPattern) {
        fail(name, 'Error messages do not mention failurePattern. Got: ' + result.errors.join('; '));
      } else {
        pass(name);
      }
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC2: traceId file resolution ──────────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] AC2 \u2014 traceId file resolution\n');

// validation-fails-on-trace-id-file-not-found
(function () {
  var name = 'validation-fails-on-trace-id-file-not-found';
  var dir  = mkTmpDir();
  try {
    var entry  = { traceId: 'missing-trace.jsonl', failurePattern: 'test-pattern', description: 'test' };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (result.valid) {
      fail(name, 'Expected valid: false when trace file does not exist, got valid: true');
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// validation-passes-with-valid-trace-id-and-file
(function () {
  var name = 'validation-passes-with-valid-trace-id-and-file';
  var dir  = mkTmpDir();
  try {
    var tracesDir = path.join(dir, 'workspace', 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    fs.writeFileSync(path.join(tracesDir, 'real-trace.jsonl'), '{}', 'utf8');

    var entry  = { traceId: 'real-trace.jsonl', failurePattern: 'test-pattern', description: 'test' };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (!result.valid) {
      fail(name, 'Expected valid: true for entry with valid traceId and file. Errors: ' + result.errors.join('; '));
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// path-traversal-blocked
(function () {
  var name = 'path-traversal-blocked';
  var dir  = mkTmpDir();
  try {
    var entry  = { traceId: '../etc/passwd', failurePattern: 'test-pattern', description: 'traversal test' };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (result.valid) {
      fail(name, 'Expected valid: false for traceId with path traversal (..), got valid: true');
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC3: Proposal staging path ────────────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] AC3 \u2014 proposal staging path\n');

// improvement-agent-proposal-written-to-proposals-not-suite
(function () {
  var name = 'improvement-agent-proposal-written-to-proposals-not-suite';
  var dir  = mkTmpDir();
  try {
    var proposalsDir  = path.join(dir, 'proposals');
    var suiteJsonPath = path.join(dir, 'suite.json');

    suiteProposal.writeSuiteProposal(
      { traceId: 'test-trace', failurePattern: 'test-pattern', justification: 'test justification' },
      { proposalsDir: proposalsDir, proposalId: 'test-001' }
    );

    var expectedPath = path.join(proposalsDir, 'suite-additions', 'test-001.json');
    if (!fs.existsSync(expectedPath)) {
      fail(name, 'Proposal file not found at expected path: ' + expectedPath);
    } else if (fs.existsSync(suiteJsonPath)) {
      fail(name, 'suite.json was written — proposals must NOT be promoted automatically (AC4)');
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// improvement-agent-proposal-contains-required-fields
(function () {
  var name = 'improvement-agent-proposal-contains-required-fields';
  var dir  = mkTmpDir();
  try {
    var proposalsDir = path.join(dir, 'proposals');
    var proposalData = {
      traceId:        'trace-2026-04-20.jsonl',
      failurePattern: 'skill-skipped-silently',
      justification:  'Agent self-reported skipping /test-plan without reading the skill file',
    };

    var result  = suiteProposal.writeSuiteProposal(proposalData, { proposalsDir: proposalsDir });
    var written = JSON.parse(fs.readFileSync(result.filePath, 'utf8'));

    var missingFields = ['traceId', 'failurePattern', 'justification'].filter(function (f) {
      return !written[f];
    });
    if (missingFields.length > 0) {
      fail(name, 'Proposal JSON missing required fields: ' + missingFields.join(', '));
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC4: No automated promotion code ─────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] AC4 \u2014 no automated promotion code\n');

// no-automated-promotion-code-exists
(function () {
  var name = 'no-automated-promotion-code-exists';
  try {
    var agentDir   = path.join(root, 'src', 'improvement-agent');
    var suiteScript = path.join(root, 'scripts', 'validate-suite-entry.js');

    // Collect improvement agent .js source files (exclude test files)
    var filesToScan = fs.readdirSync(agentDir)
      .filter(function (f) { return f.endsWith('.js') && !f.endsWith('.test.js'); })
      .map(function (f) { return path.join(agentDir, f); });
    filesToScan.push(suiteScript);

    // Patterns indicating auto-promotion from suite-additions → suite.json
    var promotionPatterns = [
      /suite-additions.*suite\.json/,
      /suite\.json.*suite-additions/,
      /promote.*suite/i,
    ];

    var foundPromotion = false;
    var foundIn        = '';
    outer: for (var i = 0; i < filesToScan.length; i++) {
      var content = fs.readFileSync(filesToScan[i], 'utf8');
      for (var j = 0; j < promotionPatterns.length; j++) {
        if (promotionPatterns[j].test(content)) {
          foundPromotion = true;
          foundIn = path.basename(filesToScan[i]) + ' matches ' + promotionPatterns[j].toString();
          break outer;
        }
      }
    }

    if (foundPromotion) {
      fail(name, 'Found potential auto-promotion code: ' + foundIn);
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  }
}());

// ── AC5: Grandfathered entries ────────────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] AC5 \u2014 grandfathered entries\n');

// grandfathered-entries-pass-validation
(function () {
  var name = 'grandfathered-entries-pass-validation';
  var dir  = mkTmpDir();
  try {
    // Pre-existing entries are marked with _grandfathered: true and have no traceId/failurePattern
    var entry = {
      taskId:         's-benefit-metric',
      description:    'Legacy scenario without traceId or failurePattern',
      _grandfathered: true,
    };
    var result = validator.validateEntry(entry, { workspaceRoot: dir });
    if (!result.valid) {
      fail(name, 'Grandfathered entries must pass validation. Errors: ' + result.errors.join('; '));
    } else {
      pass(name);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[p3.4-suite-validation] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  failures.forEach(function (f) {
    process.stdout.write('  FAIL: ' + f.name + ' \u2014 ' + f.reason + '\n');
  });
  process.exit(1);
}
