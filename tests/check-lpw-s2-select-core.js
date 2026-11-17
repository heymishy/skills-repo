'use strict';
// lpw-s2 T3 and T4 (AC4, AC6) -- the rule that picks the core, and the script that lists it for the job.
// Plain Node script. Run: node tests/check-lpw-s2-select-core.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const sel = require(path.join(root, 'scripts', 'select-core-specs'));
const lister = require(path.join(root, 'scripts', 'list-core-specs'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function range(prefix, n) { const out = []; for (let i = 0; i < n; i++) out.push(prefix + i); return out; }
// 1000 statements in total. big: 500, mid: 300 (100 shared with big), tiny: 5 new, twin: same as tiny, broken: failed.
const MEAS = {
  totalStatements: 1000,
  specs: {
    'tests/e2e/big.spec.js':    { failed: 0, statements: range('b', 500) },
    'tests/e2e/mid.spec.js':    { failed: 0, statements: range('b', 100).concat(range('m', 200)) },
    'tests/e2e/tiny.spec.js':   { failed: 0, statements: range('t', 5) },
    'tests/e2e/twin.spec.js':   { failed: 0, statements: range('t', 5) },
    'tests/e2e/broken.spec.js': { failed: 2, statements: range('x', 400) },
    'tests/e2e/only.spec.js':   { failed: 0, statements: range('b', 3) }
  }
};
const MATRIX = { specs: [
  { file: 'tests/e2e/big.spec.js', capability: 'board', lane: 'extended' },
  { file: 'tests/e2e/mid.spec.js', capability: 'board', lane: 'extended' },
  { file: 'tests/e2e/tiny.spec.js', capability: 'nav', lane: 'extended' },
  { file: 'tests/e2e/twin.spec.js', capability: 'nav', lane: 'extended' },
  { file: 'tests/e2e/broken.spec.js', capability: 'pods', lane: 'extended' },
  { file: 'tests/e2e/only.spec.js', capability: 'sessions', lane: 'extended' },
  { file: 'tests/e2e/a1.spec.js', capability: 'signup', lane: 'scenario' },
  { file: 'tests/e2e/q.spec.js', capability: 'old', lane: 'quarantined' }
] };

test('T3a every capability with a passing spec gets its best spec first, then greedy gain until the gain is below the threshold', function () {
  const r = sel.selectCore(MEAS, MATRIX, { threshold: 0.1 });
  // first pass: board -> big (500), nav -> tiny (5, name order beats twin), sessions -> only (3, all already in big)
  assert.deepStrictEqual(r.core.slice(0, 3).sort(), ['tests/e2e/big.spec.js', 'tests/e2e/only.spec.js', 'tests/e2e/tiny.spec.js']);
  // then mid adds 200 (20 pp); twin adds 0 (below 0.1 pp) and stops the greedy phase
  assert.ok(r.core.indexOf('tests/e2e/mid.spec.js') !== -1);
  assert.ok(r.core.indexOf('tests/e2e/twin.spec.js') === -1);
  assert.strictEqual(r.steps[r.steps.length - 1].cumulative, 705);
});

test('T3b a spec that failed in the measurement, or is scenario or quarantined, is never chosen; its capability is a gap', function () {
  const r = sel.selectCore(MEAS, MATRIX, { threshold: 0.1 });
  assert.ok(r.core.indexOf('tests/e2e/broken.spec.js') === -1);
  assert.ok(r.core.indexOf('tests/e2e/q.spec.js') === -1 && r.core.indexOf('tests/e2e/a1.spec.js') === -1);
  assert.deepStrictEqual(r.gaps, ['old', 'pods']);
});

test('T3c a spec named in the failed-before list is never chosen', function () {
  const r = sel.selectCore(MEAS, MATRIX, { threshold: 0.1, failedBefore: ['tests/e2e/mid.spec.js'] });
  assert.ok(r.core.indexOf('tests/e2e/mid.spec.js') === -1);
});

test('T3d the selection is deterministic and reports cumulative percentages', function () {
  const a = sel.selectCore(MEAS, MATRIX, { threshold: 0.1 });
  const b = sel.selectCore(MEAS, MATRIX, { threshold: 0.1 });
  assert.deepStrictEqual(a, b);
  assert.ok(Math.abs(a.steps[a.steps.length - 1].cumulativePct - 70.5) < 0.01, String(a.steps[a.steps.length - 1].cumulativePct));
});

test('T4a listCoreSpecs returns only core-lane files that exist, in a stable order', function () {
  const m = { specs: [
    { file: 'tests/e2e/z.spec.js', lane: 'core' }, { file: 'tests/e2e/a.spec.js', lane: 'core' },
    { file: 'tests/e2e/m.spec.js', lane: 'extended' }, { file: 'tests/e2e/gone.spec.js', lane: 'core' }
  ] };
  const out = lister.listCoreSpecs(m, function (f) { return f !== 'tests/e2e/gone.spec.js'; });
  assert.deepStrictEqual(out, ['tests/e2e/a.spec.js', 'tests/e2e/z.spec.js']);
});

test('T4b the command prints one path per line, and exits non-zero when no spec is core', function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lpw-s2-'));
  const none = path.join(dir, 'none.json');
  fs.writeFileSync(none, JSON.stringify({ specs: [{ file: 'tests/e2e/smoke.spec.js', capability: 'x', lane: 'extended' }] }));
  const r1 = spawnSync(process.execPath, [path.join(root, 'scripts', 'list-core-specs.js'), none], { encoding: 'utf8', cwd: root });
  assert.notStrictEqual(r1.status, 0);
  assert.ok(/no spec/i.test(r1.stdout + r1.stderr), r1.stdout + r1.stderr);
  const some = path.join(dir, 'some.json');
  fs.writeFileSync(some, JSON.stringify({ specs: [{ file: 'tests/e2e/smoke.spec.js', capability: 'x', lane: 'core' }] }));
  const r2 = spawnSync(process.execPath, [path.join(root, 'scripts', 'list-core-specs.js'), some], { encoding: 'utf8', cwd: root });
  assert.strictEqual(r2.status, 0, r2.stderr);
  assert.strictEqual(r2.stdout.trim(), 'tests/e2e/smoke.spec.js');
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s2] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s2] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s2] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
