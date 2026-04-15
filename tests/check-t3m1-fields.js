#!/usr/bin/env node
/**
 * check-t3m1-fields.js
 *
 * Automated tests for story p3.2a: Add four mandatory T3M1 trace fields to
 * schema and gate enforcement.
 *
 * Unit tests (AC1 — schema):
 *   - schema-defines-standardsInjected-field
 *   - schema-defines-watermarkResult-field
 *   - schema-defines-stalenessFlag-field
 *   - schema-defines-sessionIdentity-field
 *   - schema-field-descriptions-map-to-MODEL-RISK-questions
 *
 * Unit tests (AC2, AC3):
 *   - gate-writes-trace-successfully-when-all-four-fields-non-null
 *   - gate-exits-1-when-standardsInjected-null
 *   - gate-exits-1-when-standardsInjected-absent
 *   - gate-exits-1-when-watermarkResult-null
 *   - gate-exits-1-when-stalenessFlag-null
 *   - gate-exits-1-when-sessionIdentity-null
 *
 * Unit tests (AC5):
 *   - gate-does-not-fail-non-regulated-trace-missing-all-new-fields
 *   - gate-applies-new-field-rules-only-when-regulated-flag-true
 *
 * Integration tests (AC2, AC3, AC5):
 *   - gate-end-to-end-regulated-trace-write-with-all-fields
 *   - gate-integration-exits-1-named-field-for-regulated-missing-field
 *   - gate-integration-passes-non-regulated-trace-without-new-fields
 *
 * NFR tests:
 *   - trace-fields-produce-deterministic-output-for-same-input
 *   - sessionIdentity-sessionId-does-not-contain-PII
 *
 * Run:  node tests/check-t3m1-fields.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os, crypto).
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const root       = path.join(__dirname, '..');
const gateRunner = require(path.join(root, '.github', 'scripts', 'run-assurance-gate.js'));
const schemaPath = path.join(root, '.github', 'pipeline-state.schema.json');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 't3m1-test-'));
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

// A synthetic 40-char hex commit SHA for tests
const SYNTHETIC_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

// Fixture: regulated record with all four T3M1 fields populated
const ALL_FIELDS_VALID = {
  regulated:         true,
  standardsInjected: [{ id: 's1', hash: 'abc123defabc123defabc123defabc12' }],
  watermarkResult:   { pass: true, passRate: 0.9 },
  stalenessFlag:     false,
  sessionIdentity:   {
    sessionId:  'a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8',
    agentType:  'copilot',
    startedAt:  '2026-04-15T00:00:00Z',
  },
};

// Fixture: regulated record with valid other fields for single-field-null tests
function regulatedMissing(field) {
  var rec = Object.assign({}, ALL_FIELDS_VALID);
  rec[field] = null;
  return rec;
}

function regulatedAbsent(field) {
  var rec = Object.assign({}, ALL_FIELDS_VALID);
  delete rec[field];
  return rec;
}

// ── Utility: navigate schema to story items properties ────────────────────────

function getStoryItemsProps() {
  var schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  return schema.properties
    .features.items
    .properties.epics.items
    .properties.stories.items
    .properties;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Schema defines all four new fields
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nAC1 \u2014 Schema defines four T3M1 fields\n');

(function () {
  var name = 'schema-defines-standardsInjected-field';
  try {
    var props = getStoryItemsProps();
    if (!props.standardsInjected) { fail(name, 'standardsInjected not found in story items properties'); return; }
    if (!props.standardsInjected.description) { fail(name, 'standardsInjected missing description'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'schema-defines-watermarkResult-field';
  try {
    var props = getStoryItemsProps();
    if (!props.watermarkResult) { fail(name, 'watermarkResult not found in story items properties'); return; }
    if (!props.watermarkResult.description) { fail(name, 'watermarkResult missing description'); return; }
    if (!props.watermarkResult.properties || !props.watermarkResult.properties.pass || !props.watermarkResult.properties.passRate) {
      fail(name, 'watermarkResult.properties must define pass and passRate sub-fields'); return;
    }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'schema-defines-stalenessFlag-field';
  try {
    var props = getStoryItemsProps();
    if (!props.stalenessFlag) { fail(name, 'stalenessFlag not found in story items properties'); return; }
    if (props.stalenessFlag.type !== 'boolean') { fail(name, 'stalenessFlag.type must be boolean, got: ' + props.stalenessFlag.type); return; }
    if (!props.stalenessFlag.description) { fail(name, 'stalenessFlag missing description'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'schema-defines-sessionIdentity-field';
  try {
    var props = getStoryItemsProps();
    if (!props.sessionIdentity) { fail(name, 'sessionIdentity not found in story items properties'); return; }
    if (!props.sessionIdentity.description) { fail(name, 'sessionIdentity missing description'); return; }
    if (!props.sessionIdentity.properties) { fail(name, 'sessionIdentity must have nested properties'); return; }
    var subProps = props.sessionIdentity.properties;
    if (!subProps.sessionId || !subProps.agentType || !subProps.startedAt) {
      fail(name, 'sessionIdentity.properties must define sessionId, agentType, startedAt'); return;
    }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'schema-field-descriptions-map-to-MODEL-RISK-questions';
  try {
    var props = getStoryItemsProps();
    var checks = [
      { field: 'standardsInjected', question: 'Q2' },
      { field: 'watermarkResult',   question: 'Q5' },
      { field: 'stalenessFlag',     question: 'Q6' },
      { field: 'sessionIdentity',   question: 'Q7' },
    ];
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      if (!props[c.field]) { fail(name, c.field + ' not in schema'); return; }
      var desc = props[c.field].description || '';
      if (desc.indexOf(c.question) === -1) {
        fail(name, c.field + ' description does not reference ' + c.question + ': "' + desc + '"'); return;
      }
    }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Gate writes trace when all four fields are non-null (regulated story)
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nAC2 \u2014 Gate writes trace for regulated story with all fields\n');

(function () {
  var name = 'gate-writes-trace-successfully-when-all-four-fields-non-null';
  var tmpDir = mkTmpDir();
  try {
    var result = gateRunner.runGate({
      trigger:          'manual',
      prRef:            'refs/heads/test',
      commitSha:        SYNTHETIC_SHA,
      tracesDir:        tmpDir,
      checksRunner:     function () { return []; },
      regulated:         ALL_FIELDS_VALID.regulated,
      standardsInjected: ALL_FIELDS_VALID.standardsInjected,
      watermarkResult:   ALL_FIELDS_VALID.watermarkResult,
      stalenessFlag:     ALL_FIELDS_VALID.stalenessFlag,
      sessionIdentity:   ALL_FIELDS_VALID.sessionIdentity,
    });
    if (result.verdict !== 'pass') { fail(name, 'expected verdict pass, got: ' + result.verdict); return; }
    var entries   = readTraceFile(result.tracePath);
    var completed = entries.find(function (e) { return e.status === 'completed'; });
    if (!completed) { fail(name, 'no completed trace entry found'); return; }
    if (!completed.standardsInjected) { fail(name, 'standardsInjected absent from completed trace entry'); return; }
    if (!completed.watermarkResult)   { fail(name, 'watermarkResult absent from completed trace entry'); return; }
    if (completed.stalenessFlag !== false) { fail(name, 'stalenessFlag wrong in completed trace entry: ' + completed.stalenessFlag); return; }
    if (!completed.sessionIdentity)   { fail(name, 'sessionIdentity absent from completed trace entry'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpDir); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Gate exits 1 and names missing field
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nAC3 \u2014 Gate rejects null/absent T3M1 fields and names them\n');

(function () {
  var name = 'gate-exits-1-when-standardsInjected-null';
  try {
    var r = gateRunner.validateT3M1Fields(regulatedMissing('standardsInjected'));
    if (r.passed)                              { fail(name, 'expected passed:false, got true'); return; }
    if (r.failedField !== 'standardsInjected') { fail(name, 'expected failedField "standardsInjected", got: ' + r.failedField); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'gate-exits-1-when-standardsInjected-absent';
  try {
    var r = gateRunner.validateT3M1Fields(regulatedAbsent('standardsInjected'));
    if (r.passed)                              { fail(name, 'expected passed:false, got true'); return; }
    if (r.failedField !== 'standardsInjected') { fail(name, 'expected failedField "standardsInjected", got: ' + r.failedField); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'gate-exits-1-when-watermarkResult-null';
  try {
    var r = gateRunner.validateT3M1Fields(regulatedMissing('watermarkResult'));
    if (r.passed)                          { fail(name, 'expected passed:false, got true'); return; }
    if (r.failedField !== 'watermarkResult') { fail(name, 'expected failedField "watermarkResult", got: ' + r.failedField); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'gate-exits-1-when-stalenessFlag-null';
  try {
    var r = gateRunner.validateT3M1Fields(regulatedMissing('stalenessFlag'));
    if (r.passed)                        { fail(name, 'expected passed:false, got true'); return; }
    if (r.failedField !== 'stalenessFlag') { fail(name, 'expected failedField "stalenessFlag", got: ' + r.failedField); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'gate-exits-1-when-sessionIdentity-null';
  try {
    var r = gateRunner.validateT3M1Fields(regulatedMissing('sessionIdentity'));
    if (r.passed)                          { fail(name, 'expected passed:false, got true'); return; }
    if (r.failedField !== 'sessionIdentity') { fail(name, 'expected failedField "sessionIdentity", got: ' + r.failedField); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Non-regulated traces are not retroactively failed
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nAC5 \u2014 Classification discriminator: regulated vs non-regulated\n');

(function () {
  var name = 'gate-does-not-fail-non-regulated-trace-missing-all-new-fields';
  try {
    var r = gateRunner.validateT3M1Fields({ regulated: false });
    if (!r.passed) { fail(name, 'expected passed:true for non-regulated record, got false (failedField: ' + r.failedField + ')'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

(function () {
  var name = 'gate-applies-new-field-rules-only-when-regulated-flag-true';
  try {
    // Fixture (a): regulated:true, standardsInjected:null → must fail
    var rA = gateRunner.validateT3M1Fields({ regulated: true, standardsInjected: null, watermarkResult: { pass: true, passRate: 0.9 }, stalenessFlag: false, sessionIdentity: { sessionId: 'abc123', agentType: 'copilot', startedAt: '2026-04-15T00:00:00Z' } });
    if (rA.passed) { fail(name, 'fixture (a) regulated:true with null field should fail, got passed:true'); return; }
    // Fixture (b): regulated:false, standardsInjected absent → must pass
    var rB = gateRunner.validateT3M1Fields({ regulated: false });
    if (!rB.passed) { fail(name, 'fixture (b) regulated:false should pass, got passed:false (failedField: ' + rB.failedField + ')'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nIntegration \u2014 AC2 / AC3 / AC5 via runGate\n');

(function () {
  var name = 'gate-end-to-end-regulated-trace-write-with-all-fields';
  var tmpDir = mkTmpDir();
  try {
    var result = gateRunner.runGate({
      trigger:          'ci',
      prRef:            'refs/pull/1/merge',
      commitSha:        SYNTHETIC_SHA,
      tracesDir:        tmpDir,
      checksRunner:     function () { return [{ name: 'stub', passed: true }]; },
      regulated:         ALL_FIELDS_VALID.regulated,
      standardsInjected: ALL_FIELDS_VALID.standardsInjected,
      watermarkResult:   ALL_FIELDS_VALID.watermarkResult,
      stalenessFlag:     ALL_FIELDS_VALID.stalenessFlag,
      sessionIdentity:   ALL_FIELDS_VALID.sessionIdentity,
    });
    if (result.verdict !== 'pass') { fail(name, 'expected verdict pass, got: ' + result.verdict); return; }
    var entries   = readTraceFile(result.tracePath);
    var completed = entries.find(function (e) { return e.status === 'completed'; });
    if (!completed) { fail(name, 'no completed trace entry'); return; }
    if (!Array.isArray(completed.standardsInjected)) { fail(name, 'standardsInjected not array in trace'); return; }
    if (typeof completed.watermarkResult !== 'object' || completed.watermarkResult === null) { fail(name, 'watermarkResult not object in trace'); return; }
    if (typeof completed.stalenessFlag !== 'boolean') { fail(name, 'stalenessFlag not boolean in trace'); return; }
    if (typeof completed.sessionIdentity !== 'object' || completed.sessionIdentity === null) { fail(name, 'sessionIdentity not object in trace'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpDir); }
})();

(function () {
  var name = 'gate-integration-exits-1-named-field-for-regulated-missing-field';
  var tmpDir = mkTmpDir();
  try {
    var result = gateRunner.runGate({
      trigger:          'ci',
      prRef:            'refs/pull/1/merge',
      commitSha:        SYNTHETIC_SHA,
      tracesDir:        tmpDir,
      checksRunner:     function () { return [{ name: 'stub', passed: true }]; },
      regulated:         true,
      standardsInjected: ALL_FIELDS_VALID.standardsInjected,
      // watermarkResult intentionally absent
      stalenessFlag:     ALL_FIELDS_VALID.stalenessFlag,
      sessionIdentity:   ALL_FIELDS_VALID.sessionIdentity,
    });
    if (result.verdict !== 'fail') { fail(name, 'expected verdict fail for missing watermarkResult, got: ' + result.verdict); return; }
    var entries   = readTraceFile(result.tracePath);
    var completed = entries.find(function (e) { return e.status === 'completed'; });
    if (!completed) { fail(name, 'no completed trace entry'); return; }
    var t3m1Check = (completed.checks || []).find(function (c) { return c.name === 't3m1-fields-valid'; });
    if (!t3m1Check) { fail(name, 't3m1-fields-valid check not found in trace checks array'); return; }
    if (t3m1Check.passed) { fail(name, 't3m1-fields-valid check should be failed'); return; }
    if (!t3m1Check.reason || t3m1Check.reason.indexOf('watermarkResult') === -1) {
      fail(name, 'check reason does not name watermarkResult: ' + t3m1Check.reason); return;
    }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpDir); }
})();

(function () {
  var name = 'gate-integration-passes-non-regulated-trace-without-new-fields';
  var tmpDir = mkTmpDir();
  try {
    var result = gateRunner.runGate({
      trigger:      'ci',
      prRef:        'refs/pull/1/merge',
      commitSha:    SYNTHETIC_SHA,
      tracesDir:    tmpDir,
      checksRunner: function () { return [{ name: 'stub', passed: true }]; },
      regulated:    false,
      // No T3M1 fields — non-regulated: should not fail
    });
    if (result.verdict !== 'pass') { fail(name, 'expected verdict pass for non-regulated trace, got: ' + result.verdict); return; }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpDir); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// NFR tests
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\nNFR \u2014 Determinism and security\n');

(function () {
  var name = 'trace-fields-produce-deterministic-output-for-same-input';
  var tmpA = mkTmpDir();
  var tmpB = mkTmpDir();
  try {
    var ctxBase = {
      trigger:          'manual',
      prRef:            'refs/heads/test',
      commitSha:        SYNTHETIC_SHA,
      checksRunner:     function () { return []; },
      regulated:         ALL_FIELDS_VALID.regulated,
      standardsInjected: ALL_FIELDS_VALID.standardsInjected,
      watermarkResult:   ALL_FIELDS_VALID.watermarkResult,
      stalenessFlag:     ALL_FIELDS_VALID.stalenessFlag,
      sessionIdentity:   ALL_FIELDS_VALID.sessionIdentity,
    };
    var r1 = gateRunner.runGate(Object.assign({}, ctxBase, { tracesDir: tmpA }));
    var r2 = gateRunner.runGate(Object.assign({}, ctxBase, { tracesDir: tmpB }));
    var e1 = readTraceFile(r1.tracePath).find(function (e) { return e.status === 'completed'; });
    var e2 = readTraceFile(r2.tracePath).find(function (e) { return e.status === 'completed'; });
    if (!e1 || !e2) { fail(name, 'missing completed entry in one or both runs'); return; }
    if (JSON.stringify(e1.standardsInjected) !== JSON.stringify(e2.standardsInjected)) { fail(name, 'standardsInjected differs between runs'); return; }
    if (JSON.stringify(e1.watermarkResult)   !== JSON.stringify(e2.watermarkResult))   { fail(name, 'watermarkResult differs between runs'); return; }
    if (e1.stalenessFlag !== e2.stalenessFlag) { fail(name, 'stalenessFlag differs between runs'); return; }
    if (JSON.stringify(e1.sessionIdentity)   !== JSON.stringify(e2.sessionIdentity))   { fail(name, 'sessionIdentity differs between runs'); return; }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpA); rmDir(tmpB); }
})();

(function () {
  var name = 'sessionIdentity-sessionId-does-not-contain-PII';
  var tmpDir = mkTmpDir();
  try {
    var result = gateRunner.runGate({
      trigger:           'manual',
      prRef:             'refs/heads/test',
      commitSha:         SYNTHETIC_SHA,
      tracesDir:         tmpDir,
      checksRunner:      function () { return []; },
      regulated:         true,
      standardsInjected: ALL_FIELDS_VALID.standardsInjected,
      watermarkResult:   ALL_FIELDS_VALID.watermarkResult,
      stalenessFlag:     ALL_FIELDS_VALID.stalenessFlag,
      sessionIdentity:   ALL_FIELDS_VALID.sessionIdentity,
    });
    var entries   = readTraceFile(result.tracePath);
    var completed = entries.find(function (e) { return e.status === 'completed'; });
    if (!completed || !completed.sessionIdentity) { fail(name, 'no sessionIdentity in completed entry'); return; }
    var sessionId = completed.sessionIdentity.sessionId || '';
    if (/\S+@\S+/.test(sessionId)) { fail(name, 'sessionId looks like an email address: ' + sessionId); return; }
    if (!/^[a-f0-9]{32,}$/i.test(sessionId) && sessionId.length < 8) {
      fail(name, 'sessionId is suspiciously short or non-opaque: ' + sessionId); return;
    }
    pass(name);
  } catch (e) { fail(name, e.message); } finally { rmDir(tmpDir); }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write('\n');
if (failures.length > 0) {
  process.stdout.write('Failures:\n');
  failures.forEach(function (f) {
    process.stdout.write('  \u2717 ' + f.name + ': ' + f.reason + '\n');
  });
  process.stdout.write('\n');
}

var total = passed + failed;
if (failed === 0) {
  process.stdout.write('[t3m1-fields] All ' + total + ' test(s) passed.\n');
  process.exit(0);
} else {
  process.stdout.write('[t3m1-fields] ' + failed + ' of ' + total + ' test(s) FAILED.\n');
  process.exit(1);
}
