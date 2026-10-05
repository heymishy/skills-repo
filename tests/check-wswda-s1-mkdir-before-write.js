'use strict';
// check-wswda-s1-mkdir-before-write.js — wswda-s1: writeFileEnsuringDir must
// create a missing target directory before writing, and the two real call
// sites this story fixes (strategy-metrics.js, features.js's _writeIdeasFile)
// must actually route through it.
// artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md

var assert = require('assert');
var fs     = require('fs');
var os     = require('os');
var path   = require('path');

var HELPER_PATH   = path.join(__dirname, '..', 'src', 'web-ui', 'utils', 'fs-safe-write.js');
var FEATURES_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'features.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  PASS: ' + name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err)));
  }
}

function makeNestedMissingPath() {
  return path.join(os.tmpdir(), 'wswda-s1-test-' + Date.now() + '-' + Math.random().toString(36).slice(2), 'nested', 'out.txt');
}

test('writeFileEnsuringDir creates a missing nested directory and writes the file (AC1)', function() {
  var thatPath = makeNestedMissingPath();
  var nestedDir = path.dirname(thatPath);
  assert.ok(!fs.existsSync(nestedDir), 'precondition: nested directory must not exist yet');
  var writeFileEnsuringDir = require(HELPER_PATH).writeFileEnsuringDir;
  writeFileEnsuringDir(thatPath, 'hello', 'utf8');
  assert.ok(fs.existsSync(thatPath), 'expected the file to have been written despite the missing parent directory');
  assert.strictEqual(fs.readFileSync(thatPath, 'utf8'), 'hello');
  fs.rmSync(path.dirname(nestedDir), { recursive: true, force: true });
});

test('writeFileEnsuringDir behaves identically when the directory already exists (AC3)', function() {
  var thatPath = path.join(os.tmpdir(), 'wswda-s1-test-existing-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.txt');
  var writeFileEnsuringDir = require(HELPER_PATH).writeFileEnsuringDir;
  writeFileEnsuringDir(thatPath, 'hello', 'utf8');
  assert.ok(fs.existsSync(thatPath));
  assert.strictEqual(fs.readFileSync(thatPath, 'utf8'), 'hello');
  fs.unlinkSync(thatPath);
});

test('features.js\'s _writeIdeasFile delegates to writeFileEnsuringDir, not raw fs.writeFileSync (AC2)', function() {
  var source = fs.readFileSync(FEATURES_PATH, 'utf8');
  var fnMatch = source.match(/function _writeIdeasFile\(data\) \{([\s\S]*?)\n\}/);
  assert.ok(fnMatch, 'expected to find the _writeIdeasFile function body');
  var body = fnMatch[1];
  assert.ok(/writeFileEnsuringDir\(/.test(body), '_writeIdeasFile must call writeFileEnsuringDir; got body: ' + body);
  assert.ok(!/fs\.writeFileSync\(/.test(body), '_writeIdeasFile must not call fs.writeFileSync directly anymore; got body: ' + body);
});

test('features.js\'s _writeIdeasFile still writes correctly when the directory already exists (AC3, real call site)', function() {
  var features = require(FEATURES_PATH);
  // workspace/ already exists in this checkout -- this exercises the real
  // call site's common-case path end-to-end without touching the fixture
  // at a missing-directory location (see decisions.md RISK-ACCEPT).
  var before = fs.readFileSync(path.join(__dirname, '..', 'workspace', 'ideas.json'), 'utf8');
  try {
    var data = JSON.parse(before);
    features._writeIdeasFile(data);
    var after = fs.readFileSync(path.join(__dirname, '..', 'workspace', 'ideas.json'), 'utf8');
    assert.deepStrictEqual(JSON.parse(after), data, 'expected the real ideas file to be rewritten with identical content');
  } finally {
    fs.writeFileSync(path.join(__dirname, '..', 'workspace', 'ideas.json'), before, 'utf8');
  }
});

console.log('\n[wswda-s1-mkdir-before-write] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
