'use strict';
// gic-s1 T2 (AC2, AC4) -- the protected-path matcher and the committed list of gate-defining files.
// Plain Node script. Run: node tests/check-gic-s1-gate-files.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const mod = require(path.join(root, 'scripts', 'gate-files-changed'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('T2a exact paths and directory globs match; other paths do not', function () {
  const pats = ['.github/context.yml', '.github/workflows/**', 'tests/known-baseline-failures.json'];
  const got = mod.findGateFileChanges([
    '.github/context.yml', '.github/workflows/e2e.yml', '.github/workflows/sub/x.yml', 'src/web-ui/server.js',
    'tests/known-baseline-failures.json', '.github/context.yml.bak', 'docs/.github/context.yml'
  ], pats);
  assert.deepStrictEqual(got, ['.github/context.yml', '.github/workflows/e2e.yml', '.github/workflows/sub/x.yml', 'tests/known-baseline-failures.json']);
});

test('T2b a single-star pattern stays inside one directory', function () {
  assert.deepStrictEqual(mod.findGateFileChanges(['tests/check-a5-x.js', 'tests/sub/check-a5-x.js'], ['tests/check-a5-*.js']), ['tests/check-a5-x.js']);
});

test('T2c the summary lists every touched path, says observe mode never fails, and contains only paths and fixed text', function () {
  const md = mod.renderSummary(['.github/context.yml', 'tests/known-baseline-failures.json'], 'observe');
  assert.ok(md.indexOf('.github/context.yml') !== -1 && md.indexOf('tests/known-baseline-failures.json') !== -1);
  assert.ok(/observe/i.test(md) && /does not fail/i.test(md));
  assert.strictEqual(mod.renderSummary([], 'observe'), '', 'nothing to say when nothing protected is touched');
  const hostile = mod.renderSummary(['`x` <script>alert(1)</script>\nINJECTED'], 'observe');
  assert.ok(hostile.indexOf('<script>') === -1 && !/\nINJECTED/.test(hostile), 'a path is never rendered as markup or a new line: ' + hostile);
});

test('T2d the committed list is valid, in observe mode, and names the gate files', function () {
  const list = JSON.parse(fs.readFileSync(path.join(root, '.github', 'gate-files.json'), 'utf8'));
  assert.strictEqual(list.mode, 'observe');
  ['.github/workflows/**', '.github/scripts/**', '.github/context.yml', '.github/governance-gates.yml', '.github/trace-validation.yml',
    '.github/gate-files.json', 'tests/known-baseline-failures.json', 'tests/e2e/capability-matrix.json', 'scripts/ci-test-regression-check.js',
    'tests/check-a5-ci-gate-config.js', 'tests/check-b2-ci-gate-config.js'].forEach(function (p) {
    assert.ok(list.patterns.indexOf(p) !== -1, 'missing from the list: ' + p);
  });
});

test('T2e every pattern in the list matches at least one file in the repository, so the list cannot rot', function () {
  const list = JSON.parse(fs.readFileSync(path.join(root, '.github', 'gate-files.json'), 'utf8'));
  const tracked = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).stdout.split(/\r?\n/).filter(Boolean);
  list.patterns.forEach(function (p) {
    assert.ok(mod.findGateFileChanges(tracked, [p]).length > 0, 'pattern matches no file: ' + p);
  });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[gic-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[gic-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[gic-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
