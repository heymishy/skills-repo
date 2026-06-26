'use strict';
// check-sdg3-file-content-reading.js — TDD unit tests for sdg.3 (Reference file content reading)
// Tests: T1–T9
// All tests FAIL until src/web-ui/modules/reference-reader.js is implemented.

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var os     = require('os');

var ROOT         = path.join(__dirname, '..');
var READER_PATH  = path.join(ROOT, 'src', 'web-ui', 'modules', 'reference-reader.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); return Promise.resolve();
  }
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sdg3-test-'));
}

// Capture console.log/warn output
function captureLog(fn) {
  var lines = [];
  var origLog  = console.log;
  var origWarn = console.warn;
  console.log  = function() { lines.push(Array.from(arguments).join(' ')); };
  console.warn = function() { lines.push(Array.from(arguments).join(' ')); };
  try { fn(); } finally {
    console.log  = origLog;
    console.warn = origWarn;
  }
  return lines;
}

Promise.resolve()
  // ── T1 — readReferenceFile returns {fileName, content, charCount} ─────────────
  .then(function() { return test('T1: readReferenceFile returns {fileName, content, charCount} for valid file', function() {
    var mod = require(READER_PATH);
    assert.strictEqual(typeof mod.readReferenceFile, 'function', 'readReferenceFile must be exported');
    var tmpDir = makeTmpDir();
    try {
      var content = '# Strategy\n\nContent here.';
      var filePath = path.join(tmpDir, 'strategy.md');
      fs.writeFileSync(filePath, content, 'utf8');
      var result = mod.readReferenceFile(filePath);
      assert.ok(result !== null, 'should return object for valid file');
      assert.strictEqual(result.fileName, 'strategy.md');
      assert.strictEqual(result.content, content);
      assert.strictEqual(result.charCount, content.length);
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T2 — module uses fs.readFileSync (no third-party deps) ─────────────────
  .then(function() { return test('T2: module source uses fs.readFileSync and no third-party requires', function() {
    var src = fs.readFileSync(READER_PATH, 'utf8');
    assert.ok(/readFileSync/.test(src), 'must use readFileSync');
    // Must not require any non-stdlib module
    var thirdPartyRequire = /require\(['"](?!fs\b|path\b|crypto\b|os\b|url\b|assert\b)[^'"]+['"]\)/;
    assert.ok(!thirdPartyRequire.test(src), 'must not require third-party modules');
  }); })

  // ── T3 — missing file returns null with warning ──────────────────────────────
  .then(function() { return test('T3: missing file returns null and logs [WARN]', function() {
    var mod = require(READER_PATH);
    var result;
    var lines = captureLog(function() {
      result = mod.readReferenceFile('/nonexistent/path/strategy.md');
    });
    assert.strictEqual(result, null, 'must return null for missing file');
    var warnLine = lines.join('\n');
    assert.ok(/\[WARN\]/i.test(warnLine), '[WARN] must appear in log');
    assert.ok(/not found|does not exist/i.test(warnLine), 'warning must mention file not found');
  }); })

  // ── T4 — invalid UTF-8 returns null with warning ────────────────────────────
  .then(function() { return test('T4: invalid UTF-8 file returns null and logs [WARN] with file path', function() {
    var mod = require(READER_PATH);
    var tmpDir = makeTmpDir();
    try {
      var filePath = path.join(tmpDir, 'binary.md');
      fs.writeFileSync(filePath, Buffer.from([0x80, 0x81, 0x82]));
      var result;
      var lines = captureLog(function() {
        result = mod.readReferenceFile(filePath);
      });
      assert.strictEqual(result, null, 'must return null for invalid UTF-8');
      var warnLine = lines.join('\n');
      assert.ok(/\[WARN\]/i.test(warnLine), '[WARN] must appear');
      assert.ok(/not valid UTF-8|invalid.*encoding/i.test(warnLine), 'warning must mention UTF-8');
      assert.ok(warnLine.includes(filePath), 'warning must include file path');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T5 — oversized file returns null with warning ───────────────────────────
  .then(function() { return test('T5: file with >10000 chars returns null and logs [WARN]', function() {
    var mod = require(READER_PATH);
    var tmpDir = makeTmpDir();
    try {
      var content = 'a'.repeat(10001);
      var filePath = path.join(tmpDir, 'big.md');
      fs.writeFileSync(filePath, content, 'utf8');
      var result;
      var lines = captureLog(function() {
        result = mod.readReferenceFile(filePath);
      });
      assert.strictEqual(result, null, 'must return null for oversized file');
      var warnLine = lines.join('\n');
      assert.ok(/\[WARN\]/i.test(warnLine), '[WARN] must appear');
      assert.ok(/exceeds.*10.000|10.000.*char/i.test(warnLine), 'warning must mention 10,000 char limit');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T6 — oversized file is NOT truncated ────────────────────────────────────
  .then(function() { return test('T6: oversized file is skipped entirely (not truncated)', function() {
    var mod = require(READER_PATH);
    var tmpDir = makeTmpDir();
    try {
      var content = 'x'.repeat(10001);
      var filePath = path.join(tmpDir, 'oversized.md');
      fs.writeFileSync(filePath, content, 'utf8');
      var result;
      captureLog(function() { result = mod.readReferenceFile(filePath); });
      // Either null (skipped) or full content returned — never truncated to exactly 10000
      if (result !== null) {
        assert.ok(result.charCount !== 10000, 'content must NOT be truncated to exactly 10000 chars');
        assert.strictEqual(result.charCount, 10001, 'if returned, content length must be the full 10001');
      }
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T7 — logTokenBudget logs [INFO] with component breakdown ────────────────
  .then(function() { return test('T7: logTokenBudget logs [INFO] with SKILL/reference/prior/total breakdown', function() {
    var mod = require(READER_PATH);
    assert.strictEqual(typeof mod.logTokenBudget, 'function', 'logTokenBudget must be exported');
    var lines = captureLog(function() {
      mod.logTokenBudget({ skillTokens: 4000, referenceTokens: 500, priorTokens: 200 });
    });
    var logLine = lines.join('\n');
    assert.ok(/\[INFO\]/i.test(logLine), '[INFO] must appear');
    assert.ok(/System prompt tokens/i.test(logLine), 'must mention "System prompt tokens"');
    assert.ok(/SKILL\s*=\s*4000/i.test(logLine), 'must show SKILL=4000');
    assert.ok(/reference\s*=\s*500/i.test(logLine), 'must show reference=500');
    assert.ok(/prior\s*=\s*200/i.test(logLine), 'must show prior=200');
    assert.ok(/4700\/12000/.test(logLine), 'must show total/budget as 4700/12000');
  }); })

  // ── T8 — readReferenceFiles processes batch independently ───────────────────
  .then(function() { return test('T8: readReferenceFiles skips invalid files and returns only valid results', function() {
    var mod = require(READER_PATH);
    assert.strictEqual(typeof mod.readReferenceFiles, 'function', 'readReferenceFiles must be exported');
    var tmpDir = makeTmpDir();
    try {
      var pathA = path.join(tmpDir, 'a.md');
      var pathB = path.join(tmpDir, 'b.md');
      var pathC = path.join(tmpDir, 'c.md');
      fs.writeFileSync(pathA, '# A content', 'utf8');
      fs.writeFileSync(pathB, 'z'.repeat(10001), 'utf8'); // oversized
      fs.writeFileSync(pathC, '# C content', 'utf8');
      var results;
      captureLog(function() { results = mod.readReferenceFiles([pathA, pathB, pathC]); });
      assert.ok(Array.isArray(results), 'readReferenceFiles must return an array');
      assert.strictEqual(results.length, 2, 'only a.md and c.md should be in results');
      var names = results.map(function(r) { return r.fileName; });
      assert.ok(names.indexOf('a.md') !== -1, 'a.md must be included');
      assert.ok(names.indexOf('c.md') !== -1, 'c.md must be included');
      assert.ok(names.indexOf('b.md') === -1, 'b.md (oversized) must be excluded');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T9 — UTF-8 warning includes the file path ───────────────────────────────
  .then(function() { return test('T9: invalid UTF-8 warning includes the full file path', function() {
    var mod = require(READER_PATH);
    var tmpDir = makeTmpDir();
    try {
      var filePath = path.join(tmpDir, 'bad-encoding.md');
      fs.writeFileSync(filePath, Buffer.from([0xFF, 0xFE, 0x80]));
      var lines = captureLog(function() { mod.readReferenceFile(filePath); });
      var warnLine = lines.join('\n');
      assert.ok(warnLine.includes(filePath), 'warning must include the full file path: ' + filePath);
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  .then(function() {
    console.log('\n[sdg3-file-content-reading] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });
