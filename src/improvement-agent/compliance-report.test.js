#!/usr/bin/env node
/**
 * src/improvement-agent/compliance-report.test.js
 *
 * Unit tests for p3.13 compliance monitoring report:
 *   src/improvement-agent/compliance-report.js
 *
 * AC coverage:
 *   AC1 — report-generated-with-correct-filename-format
 *   AC1 — report-filename-does-not-overwrite-previous-months (NFR)
 *   AC2 — report-contains-per-squad-fields
 *   AC3 — squad-above-gap-threshold-is-marked-fail
 *   AC3 — squad-at-gap-threshold-is-not-marked-fail
 *   AC5 — report-is-self-contained-with-context-fields
 *
 * Run: node src/improvement-agent/compliance-report.test.js
 * Used: npm test (via package.json chain)
 *
 * Zero external npm dependencies — plain Node.js (fs, os, path) only.
 */
'use strict';

var fs   = require('fs');
var os   = require('os');
var path = require('path');

var module_ = require('./compliance-report.js');
var generateComplianceReport = module_.generateComplianceReport;

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'p3.13-test-'));
}

function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ── Helper: build a controlled fixture trace set ──────────────────────────────

/**
 * Build a fake getTraces result.
 *
 * @param {object[]} squads  Array of { squadId, total, missingGateCount, missingT3m1Count }
 * @returns {object[]}  Flat array of trace entries tagged with _squadId
 */
function buildTraces(squads) {
  var entries = [];
  squads.forEach(function (squad) {
    for (var i = 0; i < squad.total; i++) {
      var isMissingGate = i < squad.missingGateCount;
      var isMissingT3m1 = i < (squad.missingT3m1Count || 0);
      entries.push({
        _squadId:         squad.squadId,
        storySlug:        squad.squadId + '-story-' + i,
        gateVerdict:      isMissingGate ? undefined : 'pass',
        standardsInjected: isMissingT3m1 ? undefined : true,
        watermarkResult:  isMissingT3m1 ? undefined : { pass: true, passRate: 0.9 },
        stalenessFlag:    false,
        sessionIdentity:  { sessionId: 'abc', agentType: 'copilot', startedAt: '2026-04-01T00:00:00Z' },
      });
    }
  });
  return entries;
}

// ── AC1: Correct filename format ──────────────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] AC1 \u2014 filename format\n');

(function () {
  var name = 'report-generated-with-correct-filename-format';
  var dir  = mkTmpDir();
  try {
    var traces = buildTraces([{ squadId: 'squad-alpha', total: 5, missingGateCount: 0 }]);
    generateComplianceReport({
      traces:     traces,
      outputDir:  dir,
      currentDate: new Date('2026-04-01T00:00:00Z'),
    });
    var expectedFile = path.join(dir, 'compliance-2026-04.md');
    if (fs.existsSync(expectedFile)) {
      pass(name);
    } else {
      var found = fs.readdirSync(dir).join(', ');
      fail(name, 'Expected compliance-2026-04.md; found: ' + (found || '(empty dir)'));
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── NFR: Monthly files not overwritten ───────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] NFR \u2014 no overwrite of previous months\n');

(function () {
  var name = 'report-filename-does-not-overwrite-previous-months';
  var dir  = mkTmpDir();
  try {
    var traces = buildTraces([{ squadId: 'squad-alpha', total: 5, missingGateCount: 0 }]);
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-03-01T00:00:00Z') });
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-04-01T00:00:00Z') });
    var marFile  = path.join(dir, 'compliance-2026-03.md');
    var aprFile  = path.join(dir, 'compliance-2026-04.md');
    if (fs.existsSync(marFile) && fs.existsSync(aprFile)) {
      pass(name);
    } else {
      fail(name, 'Expected both compliance-2026-03.md and compliance-2026-04.md. Found: ' + fs.readdirSync(dir).join(', '));
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC2: Per-squad fields ─────────────────────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] AC2 \u2014 per-squad report fields\n');

(function () {
  var name = 'report-contains-per-squad-fields';
  var dir  = mkTmpDir();
  try {
    var traces = buildTraces([
      { squadId: 'squad-compliant', total: 10, missingGateCount: 0, missingT3m1Count: 0 },
      { squadId: 'squad-failing',   total: 10, missingGateCount: 2, missingT3m1Count: 0 },
    ]);
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-04-01T00:00:00Z') });
    var content = fs.readFileSync(path.join(dir, 'compliance-2026-04.md'), 'utf8');

    var missingFields = [];
    if (content.indexOf('squad-compliant') === -1) missingFields.push('squadId(squad-compliant)');
    if (content.indexOf('squad-failing') === -1)   missingFields.push('squadId(squad-failing)');
    // All 6 per-squad field labels must appear at least once in the report
    if (content.toLowerCase().indexOf('trace count') === -1 &&
        content.toLowerCase().indexOf('tracecount') === -1)        missingFields.push('traceCount');
    if (content.toLowerCase().indexOf('gate verdict') === -1 &&
        content.toLowerCase().indexOf('gateverdict') === -1)        missingFields.push('gateVerdictsPresent');
    if (content.toLowerCase().indexOf('t3m1') === -1)               missingFields.push('t3m1FieldsPopulated');
    if (content.toLowerCase().indexOf('gap count') === -1 &&
        content.toLowerCase().indexOf('gapcount') === -1)           missingFields.push('gapCount');
    if (content.toLowerCase().indexOf('compliance status') === -1 &&
        content.toLowerCase().indexOf('compliancestatus') === -1)   missingFields.push('complianceStatus');

    if (missingFields.length === 0) {
      pass(name);
    } else {
      fail(name, 'Missing field(s) in report: ' + missingFields.join(', '));
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC3: Gap threshold FAIL ───────────────────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] AC3 \u2014 gap threshold logic\n');

(function () {
  var name = 'squad-above-gap-threshold-is-marked-fail';
  var dir  = mkTmpDir();
  try {
    // 15/100 traces missing gate verdict = 15% > 10% threshold → FAIL
    var traces = buildTraces([{ squadId: 'squad-failing', total: 100, missingGateCount: 15 }]);
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-04-01T00:00:00Z') });
    var content = fs.readFileSync(path.join(dir, 'compliance-2026-04.md'), 'utf8');

    // Must be marked FAIL
    var squadSection = content.substring(content.indexOf('squad-failing'));
    var isFail       = squadSection.indexOf('FAIL') !== -1;
    // Must list gap details (trace slugs or count)
    var hasGapDetail = squadSection.indexOf('squad-failing-story-') !== -1 ||
                       squadSection.indexOf('15') !== -1;
    // Must name the missing field
    var namesMissingField = squadSection.toLowerCase().indexOf('gate verdict') !== -1 ||
                            squadSection.toLowerCase().indexOf('gateverdict') !== -1;

    if (isFail && hasGapDetail && namesMissingField) {
      pass(name);
    } else {
      fail(name, 'FAIL: ' + isFail + ', gap-detail: ' + hasGapDetail + ', names-field: ' + namesMissingField);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

(function () {
  var name = 'squad-at-gap-threshold-is-not-marked-fail';
  var dir  = mkTmpDir();
  try {
    // Exactly 10/100 = 10% — not greater than threshold → PASS
    var traces = buildTraces([{ squadId: 'squad-boundary', total: 100, missingGateCount: 10 }]);
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-04-01T00:00:00Z') });
    var content = fs.readFileSync(path.join(dir, 'compliance-2026-04.md'), 'utf8');

    var squadSection = content.substring(content.indexOf('squad-boundary'));
    var isPass = squadSection.indexOf('PASS') !== -1;
    var isFail = squadSection.indexOf('FAIL') !== -1;

    if (isPass && !isFail) {
      pass(name);
    } else {
      fail(name, 'Expected PASS (not FAIL) for 10% gap. PASS: ' + isPass + ', FAIL: ' + isFail);
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
  }
}());

// ── AC5: Self-contained context fields ───────────────────────────────────────

process.stdout.write('\n[p3.13-compliance-report] AC5 \u2014 self-contained context fields\n');

(function () {
  var name = 'report-is-self-contained-with-context-fields';
  var dir  = mkTmpDir();
  try {
    var traces = buildTraces([{ squadId: 'squad-alpha', total: 5, missingGateCount: 0 }]);
    generateComplianceReport({ traces: traces, outputDir: dir, currentDate: new Date('2026-04-01T00:00:00Z') });
    var content = fs.readFileSync(path.join(dir, 'compliance-2026-04.md'), 'utf8');

    var missingContext = [];
    // policyThreshold (10%)
    if (content.indexOf('10%') === -1 && content.toLowerCase().indexOf('policy threshold') === -1) {
      missingContext.push('policyThreshold');
    }
    // sampleSize (some numeric total)
    if (content.toLowerCase().indexOf('sample size') === -1 &&
        content.toLowerCase().indexOf('samplesize') === -1 &&
        content.toLowerCase().indexOf('total traces') === -1) {
      missingContext.push('sampleSize');
    }
    // period covered
    if (content.toLowerCase().indexOf('last 30 days') === -1 &&
        content.toLowerCase().indexOf('period') === -1) {
      missingContext.push('period');
    }
    // registryPath reference
    if (content.indexOf('platform/traces') === -1) {
      missingContext.push('registryPath');
    }

    if (missingContext.length === 0) {
      pass(name);
    } else {
      fail(name, 'Missing context field(s): ' + missingContext.join(', '));
    }
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    rmDir(dir);
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
