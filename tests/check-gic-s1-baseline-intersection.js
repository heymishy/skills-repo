'use strict';
// gic-s1 T3 (AC3) -- the unit regression check ignores baseline entries a pull request adds (it honours removals).
// Plain Node script. Run: node tests/check-gic-s1-baseline-intersection.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const check = require(path.join(root, 'scripts', 'ci-test-regression-check'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('T3a an entry the pull request added is ignored and reported; the failing test is a new regression', function () {
  const v = check.computeVerdict({ currentFailures: ['tests/a.js'], baseline: { files: ['tests/a.js'] }, baseBaseline: { files: [] } });
  assert.deepStrictEqual(v.newFailures, ['tests/a.js']);
  assert.deepStrictEqual(v.ignoredAdditions, ['tests/a.js']);
  assert.deepStrictEqual(v.stale, []);
});

test('T3b an entry the pull request removed is honoured: the test now passes and master\'s stale entry is not an error', function () {
  const v = check.computeVerdict({ currentFailures: [], baseline: { files: [] }, baseBaseline: { files: ['tests/a.js'] } });
  assert.deepStrictEqual(v.newFailures, []); assert.deepStrictEqual(v.stale, []); assert.deepStrictEqual(v.ignoredAdditions, []);
});

test('T3c an entry in both baselines still excuses its failure, and a passing entry in both is stale (bfl-s1 unchanged)', function () {
  const same = { files: ['tests/a.js', 'tests/b.js'] };
  const v = check.computeVerdict({ currentFailures: ['tests/a.js'], baseline: same, baseBaseline: same });
  assert.deepStrictEqual(v.newFailures, []); assert.deepStrictEqual(v.stale, ['tests/b.js']);
});

test('T3d with no base baseline given the behaviour is exactly the old one', function () {
  const v = check.computeVerdict({ currentFailures: ['tests/a.js'], baseline: { files: ['tests/a.js'] }, baseBaseline: null });
  assert.deepStrictEqual(v.newFailures, []); assert.deepStrictEqual(v.ignoredAdditions, []);
});

test('T3e the command line: a baseline addition makes the check fail and names it; the same run without the base baseline passes', function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gic-s1-b-'));
  const log = path.join(dir, 'out.log'); fs.writeFileSync(log, 'Failed files (1):\n  - tests/a.js\n');
  const pr = path.join(dir, 'pr.json'); fs.writeFileSync(pr, JSON.stringify({ recordedAt: 'x', files: ['tests/a.js'] }));
  const base = path.join(dir, 'base.json'); fs.writeFileSync(base, JSON.stringify({ recordedAt: 'x', files: [] }));
  const script = path.join(root, 'scripts', 'ci-test-regression-check.js');
  const withBase = spawnSync(process.execPath, [script, log, pr, base], { encoding: 'utf8' });
  assert.strictEqual(withBase.status, 1, withBase.stdout + withBase.stderr);
  assert.ok(/added to the baseline/i.test(withBase.stdout + withBase.stderr) && (withBase.stdout + withBase.stderr).indexOf('tests/a.js') !== -1);
  const without = spawnSync(process.execPath, [script, log, pr], { encoding: 'utf8' });
  assert.strictEqual(without.status, 0, without.stdout + without.stderr);
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[gic-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[gic-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[gic-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
