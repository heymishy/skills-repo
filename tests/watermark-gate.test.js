#!/usr/bin/env node
/**
 * watermark-gate.test.js
 *
 * Standalone tests for p3.1c AC2: FLOOR_PASS_RATE enforcement in watermark-gate.js.
 *
 * Tests:
 *   U2 — floor-below-0.60-throws:        passRate=0.60 → throws, baseline NOT written
 *   U3 — floor-at-0.70-passes:           passRate=0.70 (boundary) → passes, baseline written
 *   U4 — floor-above-1.00-passes:        passRate=1.00 → passes, baseline written
 *   U5 — FLOOR_PASS_RATE-named-constant: source contains literal `const FLOOR_PASS_RATE = 0.70`
 *
 * Run:  node tests/watermark-gate.test.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var root           = path.join(__dirname, '..');
var gatePath       = path.join(root, '.github', 'scripts', 'watermark-gate.js');
var fixturesDir    = path.join(root, 'tests', 'fixtures', 'watermark-scenarios');

// ── Guards ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(gatePath)) {
  process.stderr.write('[watermark-gate-test] FATAL: watermark-gate.js not found at ' + gatePath + '\n');
  process.exit(1);
}

var gate = require(gatePath);
var runWatermarkGate = gate.runWatermarkGate;
var FLOOR_PASS_RATE  = gate.FLOOR_PASS_RATE;

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

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wg-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (var entry of fs.readdirSync(dir)) {
    var full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n[watermark-gate-test] p3.1c AC2 — FLOOR_PASS_RATE enforcement\n');

var tmpBase = mkTmpDir();

// U2 — passRate = 0.60 (below floor): baseline creation must be rejected
(function testBelowFloor() {
  var dir        = path.join(tmpBase, 'u2');
  fs.mkdirSync(dir);
  var suitePath  = path.join(dir, 'suite.json');
  var resultsTsv = path.join(dir, 'results.tsv');

  var fixturePath = path.join(fixturesDir, 'below-floor.json');
  if (!fs.existsSync(fixturePath)) {
    fail('U2-floor-below-0.60-throws', 'Fixture not found: ' + fixturePath);
    return;
  }

  fs.writeFileSync(suitePath, fs.readFileSync(fixturePath, 'utf8'));

  var threw      = false;
  var errMessage = '';
  try {
    runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });
  } catch (e) {
    threw      = true;
    errMessage = e.message || '';
  }

  if (!threw) {
    fail('U2-floor-below-0.60-throws',
      'runWatermarkGate must throw when passRate (0.60) < FLOOR_PASS_RATE (' + FLOOR_PASS_RATE + ')');
  } else {
    pass('U2-floor-below-0.60-throws');
  }

  if (fs.existsSync(resultsTsv)) {
    fail('U2-floor-below-0.60-baseline-not-written',
      'Baseline file must NOT be written when passRate < FLOOR_PASS_RATE');
  } else {
    pass('U2-floor-below-0.60-baseline-not-written');
  }

  if (!/floor/i.test(errMessage)) {
    fail('U2-floor-below-0.60-error-mentions-floor',
      'Error message must mention "floor"; got: "' + errMessage + '"');
  } else {
    pass('U2-floor-below-0.60-error-mentions-floor');
  }
}());

// U3 — passRate = 0.70 (exactly at floor — boundary): baseline creation must succeed
(function testAtFloor() {
  var dir        = path.join(tmpBase, 'u3');
  fs.mkdirSync(dir);
  var suitePath  = path.join(dir, 'suite.json');
  var resultsTsv = path.join(dir, 'results.tsv');

  var fixturePath = path.join(fixturesDir, 'at-floor.json');
  if (!fs.existsSync(fixturePath)) {
    fail('U3-floor-at-0.70-passes', 'Fixture not found: ' + fixturePath);
    return;
  }

  fs.writeFileSync(suitePath, fs.readFileSync(fixturePath, 'utf8'));

  var result;
  var threw = false;
  try {
    result = runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });
  } catch (e) {
    threw = true;
  }

  if (threw) {
    fail('U3-floor-at-0.70-no-throw',
      'runWatermarkGate must NOT throw when passRate is exactly at FLOOR_PASS_RATE (0.70) — boundary must pass');
  } else {
    pass('U3-floor-at-0.70-no-throw');
  }

  if (!fs.existsSync(resultsTsv)) {
    fail('U3-floor-at-0.70-baseline-written',
      'Baseline file must be written when passRate === FLOOR_PASS_RATE (0.70)');
  } else {
    pass('U3-floor-at-0.70-baseline-written');
  }

  if (!result || result.verdict !== 'baseline') {
    fail('U3-floor-at-0.70-verdict-baseline',
      'Expected verdict=baseline; got ' + (result && result.verdict));
  } else {
    pass('U3-floor-at-0.70-verdict-baseline');
  }
}());

// U4 — passRate = 1.00 (above floor): baseline creation must succeed
(function testAboveFloor() {
  var dir        = path.join(tmpBase, 'u4');
  fs.mkdirSync(dir);
  var suitePath  = path.join(dir, 'suite.json');
  var resultsTsv = path.join(dir, 'results.tsv');

  var fixturePath = path.join(fixturesDir, 'above-floor.json');
  if (!fs.existsSync(fixturePath)) {
    fail('U4-floor-above-1.00-passes', 'Fixture not found: ' + fixturePath);
    return;
  }

  fs.writeFileSync(suitePath, fs.readFileSync(fixturePath, 'utf8'));

  var result;
  var threw = false;
  try {
    result = runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });
  } catch (e) {
    threw = true;
  }

  if (threw) {
    fail('U4-floor-above-1.00-no-throw',
      'runWatermarkGate must NOT throw when passRate (1.00) > FLOOR_PASS_RATE (' + FLOOR_PASS_RATE + ')');
  } else {
    pass('U4-floor-above-1.00-no-throw');
  }

  if (!fs.existsSync(resultsTsv)) {
    fail('U4-floor-above-1.00-baseline-written',
      'Baseline file must be written when passRate > FLOOR_PASS_RATE');
  } else {
    pass('U4-floor-above-1.00-baseline-written');
  }

  if (!result || result.verdict !== 'baseline') {
    fail('U4-floor-above-1.00-verdict-baseline',
      'Expected verdict=baseline; got ' + (result && result.verdict));
  } else {
    pass('U4-floor-above-1.00-verdict-baseline');
  }
}());

// U5 — FLOOR_PASS_RATE named constant: literal `const FLOOR_PASS_RATE = 0.70` in source
(function testFloorPassRateNamedConstant() {
  var srcText = fs.readFileSync(gatePath, 'utf8');

  if (typeof FLOOR_PASS_RATE !== 'number') {
    fail('U5-FLOOR_PASS_RATE-exported-as-number',
      'FLOOR_PASS_RATE must be exported as a number; got ' + typeof FLOOR_PASS_RATE);
  } else {
    pass('U5-FLOOR_PASS_RATE-exported-as-number');
  }

  if (FLOOR_PASS_RATE !== 0.70) {
    fail('U5-FLOOR_PASS_RATE-value-is-0.70',
      'FLOOR_PASS_RATE must equal 0.70; got ' + FLOOR_PASS_RATE);
  } else {
    pass('U5-FLOOR_PASS_RATE-value-is-0.70');
  }

  if (!/\bFLOOR_PASS_RATE\b/.test(srcText)) {
    fail('U5-FLOOR_PASS_RATE-name-in-source',
      'Source file must contain the identifier FLOOR_PASS_RATE as a named constant');
  } else {
    pass('U5-FLOOR_PASS_RATE-name-in-source');
  }

  // The constant must be declared (not just referenced) — look for assignment
  if (!/const\s+FLOOR_PASS_RATE\s*=/.test(srcText)) {
    fail('U5-FLOOR_PASS_RATE-is-const-declaration',
      'FLOOR_PASS_RATE must be a const declaration (const FLOOR_PASS_RATE = ...) in the source');
  } else {
    pass('U5-FLOOR_PASS_RATE-is-const-declaration');
  }
}());

// ── Cleanup ───────────────────────────────────────────────────────────────────

try { rmDir(tmpBase); } catch (e) { /* ignore */ }

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[watermark-gate-test] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failed > 0) {
  process.stdout.write('\n  Failures:\n');
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write('    \u2717 ' + failures[i].name + ': ' + failures[i].reason + '\n');
  }
  process.exit(1);
}
