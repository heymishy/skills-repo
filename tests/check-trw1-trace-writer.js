'use strict';
// check-trw1-trace-writer.js
// TDD tests for trw.1: CI Trace Writer.
// Tests T1–T11 cover scripts/write-ci-trace.js (unit).
// Tests T12–T14 cover .github/workflows/trace-commit.yml (YAML integration).
//
// T1–T11 fail until write-ci-trace.js is implemented.
// T12–T14 fail until the 'Write fresh CI trace record' step is added to trace-commit.yml.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');
var child_process = require('child_process');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    passed++; fn(); console.log('  PASS: ' + name);
  } catch (err) {
    failed++; passed--;
    failures.push({ name: name, err: err });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err)));
  }
}

var ROOT = path.resolve(__dirname, '..');
var SCRIPT = path.resolve(ROOT, 'scripts', 'write-ci-trace.js');
var WORKFLOW = path.resolve(ROOT, '.github', 'workflows', 'trace-commit.yml');

// Base env for all script runs — no real secrets
function baseEnv(overrides) {
  var e = Object.assign({}, process.env, {
    GITHUB_RUN_ID: 'run-99',
    GITHUB_SHA:    'bd7f996fabc12345',
    GITHUB_REF:    'refs/heads/master',
    // Intentionally omit GITHUB_RUN_STARTED_AT so script falls back to new Date()
  }, overrides || {});
  return e;
}

// Run the script from a temp dir so writes go there, not the repo workspace/traces/
function runScript(envOverrides, cwdOverride) {
  var cwd = cwdOverride || os.tmpdir();
  return child_process.spawnSync('node', [SCRIPT], {
    env: baseEnv(envOverrides),
    cwd: cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
}

// Create an isolated temp dir for a single test
function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trw1-'));
}
function cleanTmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ── T1: Record is written to disk ───────────────────────────────────────────
console.log('\n[trw1] T1 – Record written to disk');
test('T1: script exits 0', function() {
  var tmp = makeTmp();
  try {
    var r = runScript({}, tmp);
    assert.strictEqual(r.status, 0, 'expected exit 0, got ' + r.status + '\nstderr: ' + r.stderr);
  } finally { cleanTmp(tmp); }
});
test('T1: JSONL file created in workspace/traces/', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    assert.ok(files.length >= 1, 'expected at least one .jsonl file, got ' + files.length);
  } finally { cleanTmp(tmp); }
});

// ── T2: Filename follows naming convention ───────────────────────────────────
console.log('\n[trw1] T2 – Filename follows naming convention');
test('T2: filename matches {ISO-timestamp}-ci-{8-char-sha}.jsonl', function() {
  var tmp = makeTmp();
  try {
    runScript({ GITHUB_SHA: 'abcdef1234567890' }, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    assert.ok(files.length >= 1, 'no .jsonl file found');
    var name = files[0];
    // Pattern: timestamp with colons replaced by dashes, then -ci-{8chars}.jsonl
    // e.g. 2026-05-24T14-30-00-000Z-ci-abcdef12.jsonl
    assert.ok(/-ci-[a-f0-9]{8}\.jsonl$/.test(name),
      'filename does not match pattern: ' + name);
  } finally { cleanTmp(tmp); }
});

// ── T3: Record content is valid JSON on one line ─────────────────────────────
console.log('\n[trw1] T3 – Record content is valid JSON');
test('T3: output file contains valid JSON', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var content = fs.readFileSync(path.join(tracesDir, files[0]), 'utf8');
    var line = content.trim();
    assert.ok(line.length > 0, 'file is empty');
    var parsed = JSON.parse(line); // throws if invalid
    assert.ok(parsed !== null, 'parsed to null');
  } finally { cleanTmp(tmp); }
});

// ── T4: Required fields present ──────────────────────────────────────────────
console.log('\n[trw1] T4 – Required fields present');
test('T4: record contains all 7 required fields', function() {
  var tmp = makeTmp();
  try {
    runScript({ GITHUB_RUN_ID: 'run-42', GITHUB_SHA: 'deadbeefcafebabe', GITHUB_REF: 'refs/heads/master' }, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var rec = JSON.parse(fs.readFileSync(path.join(tracesDir, files[0]), 'utf8').trim());
    var required = ['runId', 'commitSha', 'headRef', 'trigger', 'timestamp', 'verdict', 'surface'];
    required.forEach(function(field) {
      assert.ok(Object.prototype.hasOwnProperty.call(rec, field), 'missing field: ' + field);
      assert.ok(rec[field] !== '' && rec[field] !== null && rec[field] !== undefined,
        'field empty: ' + field + ' = ' + JSON.stringify(rec[field]));
    });
  } finally { cleanTmp(tmp); }
});

// ── T5: trigger field ────────────────────────────────────────────────────────
console.log('\n[trw1] T5 – trigger field');
test('T5: trigger === "post-merge"', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var rec = JSON.parse(fs.readFileSync(path.join(tracesDir, files[0]), 'utf8').trim());
    assert.strictEqual(rec.trigger, 'post-merge');
  } finally { cleanTmp(tmp); }
});

// ── T6: verdict field ────────────────────────────────────────────────────────
console.log('\n[trw1] T6 – verdict field');
test('T6: verdict === "trace-committed"', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var rec = JSON.parse(fs.readFileSync(path.join(tracesDir, files[0]), 'utf8').trim());
    assert.strictEqual(rec.verdict, 'trace-committed');
  } finally { cleanTmp(tmp); }
});

// ── T7: surface field ────────────────────────────────────────────────────────
console.log('\n[trw1] T7 – surface field');
test('T7: surface === "ci-trace-commit"', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var rec = JSON.parse(fs.readFileSync(path.join(tracesDir, files[0]), 'utf8').trim());
    assert.strictEqual(rec.surface, 'ci-trace-commit');
  } finally { cleanTmp(tmp); }
});

// ── T8: timestamp is valid ISO 8601 UTC ──────────────────────────────────────
console.log('\n[trw1] T8 – timestamp is valid ISO 8601 UTC');
test('T8: timestamp round-trips through Date.toISOString()', function() {
  var tmp = makeTmp();
  try {
    runScript({}, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    var rec = JSON.parse(fs.readFileSync(path.join(tracesDir, files[0]), 'utf8').trim());
    assert.ok(rec.timestamp, 'timestamp field missing');
    assert.strictEqual(new Date(rec.timestamp).toISOString(), rec.timestamp,
      'timestamp is not a valid ISO 8601 UTC string: ' + rec.timestamp);
  } finally { cleanTmp(tmp); }
});

// ── T9: Script creates output directory if absent ────────────────────────────
console.log('\n[trw1] T9 – Creates output directory if absent');
test('T9: workspace/traces/ created when it does not exist', function() {
  var tmp = makeTmp();
  try {
    // tmp dir has no workspace/traces/ subdir yet
    assert.ok(!fs.existsSync(path.join(tmp, 'workspace', 'traces')), 'precondition: dir should not exist');
    var r = runScript({}, tmp);
    assert.strictEqual(r.status, 0, 'exit code: ' + r.status);
    assert.ok(fs.existsSync(path.join(tmp, 'workspace', 'traces')),
      'workspace/traces/ was not created');
  } finally { cleanTmp(tmp); }
});

// ── T10: Script exits 1 on write failure ─────────────────────────────────────
console.log('\n[trw1] T10 – Exits 1 on write failure');
test('T10: exits 1 when mkdirSync fails (workspace is a file, not a dir)', function() {
  var tmp = makeTmp();
  try {
    // Create a FILE named "workspace" so mkdirSync('workspace/traces', {recursive:true}) fails
    fs.writeFileSync(path.join(tmp, 'workspace'), 'not-a-directory');
    var r = runScript({}, tmp);
    assert.strictEqual(r.status, 1, 'expected exit 1, got ' + r.status);
    assert.ok(r.stderr && r.stderr.length > 0, 'expected error on stderr, got none');
  } finally { cleanTmp(tmp); }
});

// ── T11: Script does not log credentials ─────────────────────────────────────
console.log('\n[trw1] T11 – Script does not log credentials');
test('T11: GITHUB_TOKEN value absent from output file', function() {
  var tmp = makeTmp();
  var secret = 'ghp_supersecrettoken12345';
  try {
    runScript({ GITHUB_TOKEN: secret }, tmp);
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    var files = fs.readdirSync(tracesDir).filter(function(f) { return f.endsWith('.jsonl'); });
    assert.ok(files.length >= 1, 'no output file written');
    var content = fs.readFileSync(path.join(tracesDir, files[0]), 'utf8');
    assert.ok(!content.includes(secret),
      'output file contains the GITHUB_TOKEN value — credential leak detected');
  } finally { cleanTmp(tmp); }
});
test('T11: GITHUB_TOKEN value absent from stdout', function() {
  var tmp = makeTmp();
  var secret = 'ghp_supersecrettoken12345';
  try {
    var r = runScript({ GITHUB_TOKEN: secret }, tmp);
    assert.ok(!(r.stdout || '').includes(secret),
      'stdout contains the GITHUB_TOKEN value');
  } finally { cleanTmp(tmp); }
});

// ── T12: Workflow invokes write-ci-trace.js BEFORE artifact download ─────────
console.log('\n[trw1] T12 – trace-commit.yml step order');
test('T12: trace-commit.yml contains write-ci-trace.js step', function() {
  var content = fs.readFileSync(WORKFLOW, 'utf8');
  assert.ok(content.includes('node scripts/write-ci-trace.js'),
    'trace-commit.yml does not contain "node scripts/write-ci-trace.js"');
});
test('T12: write-ci-trace.js step appears before the assurance-trace download step', function() {
  var content = fs.readFileSync(WORKFLOW, 'utf8');
  var writePos = content.indexOf('node scripts/write-ci-trace.js');
  var downloadPos = content.indexOf('name: assurance-trace');
  assert.ok(writePos !== -1, 'write-ci-trace.js step not found in trace-commit.yml');
  assert.ok(downloadPos !== -1, 'assurance-trace download step not found in trace-commit.yml');
  assert.ok(writePos < downloadPos,
    'write-ci-trace.js step (pos ' + writePos + ') must appear before assurance-trace download (pos ' + downloadPos + ')');
});

// ── T13: Existing traces not deleted ─────────────────────────────────────────
console.log('\n[trw1] T13 – Existing traces not deleted');
test('T13: pre-existing JSONL files remain after script run', function() {
  var tmp = makeTmp();
  try {
    // Seed the traces dir with 3 existing files
    var tracesDir = path.join(tmp, 'workspace', 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    var existingFiles = [
      '2026-05-01T00-00-00-000Z-ci-aaaaaaaa.jsonl',
      '2026-05-02T00-00-00-000Z-ci-bbbbbbbb.jsonl',
      '2026-05-03T00-00-00-000Z-ci-cccccccc.jsonl',
    ];
    existingFiles.forEach(function(f) {
      fs.writeFileSync(path.join(tracesDir, f), '{"existing":true}\n');
    });
    var r = runScript({}, tmp);
    assert.strictEqual(r.status, 0, 'script exited non-zero: ' + r.status);
    existingFiles.forEach(function(f) {
      assert.ok(fs.existsSync(path.join(tracesDir, f)),
        'existing file was deleted: ' + f);
    });
  } finally { cleanTmp(tmp); }
});

// ── T14: artifact download step still present ────────────────────────────────
console.log('\n[trw1] T14 – Download artifact step preserved');
test('T14: assurance-trace download step still in trace-commit.yml', function() {
  var content = fs.readFileSync(WORKFLOW, 'utf8');
  assert.ok(content.includes('name: assurance-trace'),
    'assurance-trace download step was removed from trace-commit.yml');
  assert.ok(content.includes('actions/download-artifact'),
    'actions/download-artifact step was removed from trace-commit.yml');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n');
if (failures.length) {
  console.log('Failures:');
  failures.forEach(function(f) { console.log('  ✘ ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
}
console.log('\n[trw1] results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
