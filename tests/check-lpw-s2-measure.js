'use strict';
// lpw-s2 T1 (AC1) -- per-spec server coverage helpers. Plain Node script. Run: node tests/check-lpw-s2-measure.js

const assert = require('assert');
const path = require('path');
const m = require(path.resolve(__dirname, '..', 'scripts', 'measure-playwright-spec-coverage'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// c8 json reporter shape (coverage-final.json): per file, a statementMap and hit counts s.
function cov(files) {
  const out = {};
  Object.keys(files).forEach(function (file) {
    const stmts = files[file];
    const statementMap = {}; const s = {};
    stmts.forEach(function (st, i) {
      statementMap[i] = { start: { line: st[0], column: st[1] }, end: { line: st[0], column: st[1] + 5 } };
      s[i] = st[2];
    });
    out[file] = { path: file, statementMap: statementMap, s: s };
  });
  return out;
}

const COV_A = cov({
  '/work/repo/src/web-ui/routes/a.js': [[1, 0, 3], [2, 0, 0], [3, 4, 1]],
  '/work/repo/src/web-ui/server.js': [[10, 0, 2]],
  '/work/repo/src/other/skip.js': [[1, 0, 9]]
});

test('T1a coveredStatements keeps statements with hits inside src/web-ui and ignores zero hits and other folders', function () {
  const set = m.coveredStatements(COV_A);
  assert.deepStrictEqual(Array.from(set).sort(), ['src/web-ui/routes/a.js:1:0', 'src/web-ui/routes/a.js:3:4', 'src/web-ui/server.js:10:0']);
});

test('T1b allStatements counts every statement in src/web-ui, hit or not', function () {
  const set = m.allStatements(COV_A);
  assert.strictEqual(set.size, 4);
  assert.ok(set.has('src/web-ui/routes/a.js:2:0'));
});

test('T1c uniqueStatements gives each spec the statements no other spec covers', function () {
  const by = { x: new Set(['a', 'b']), y: new Set(['b', 'c']), z: new Set(['b']) };
  const u = m.uniqueStatements(by);
  assert.deepStrictEqual(Array.from(u.x), ['a']);
  assert.deepStrictEqual(Array.from(u.y), ['c']);
  assert.deepStrictEqual(Array.from(u.z), []);
});

test('T1d greedyOrder lists specs by new statements added, with the cumulative count, ties broken by name', function () {
  const by = { z: new Set(['a', 'b', 'c']), y: new Set(['c', 'd']), x: new Set(['e']), w: new Set(['e']) };
  const order = m.greedyOrder(by);
  assert.deepStrictEqual(order.map(function (o) { return o.spec; }), ['z', 'w', 'y', 'x']);
  assert.deepStrictEqual(order.map(function (o) { return o.added; }), [3, 1, 1, 0]);
  assert.deepStrictEqual(order.map(function (o) { return o.cumulative; }), [3, 4, 5, 5]);
});

test('T1e buildReport returns JSON and a Markdown table with passed, failed, skipped, covered, unique and order', function () {
  const results = [
    { spec: 'a.spec.js', passed: 2, failed: 0, skipped: 1, statements: new Set(['s1', 's2']) },
    { spec: 'b.spec.js', passed: 0, failed: 3, skipped: 0, statements: new Set(['s2', 's3']) }
  ];
  const r = m.buildReport(results, { totalStatements: 10, seconds: 600 });
  assert.strictEqual(r.json.totalStatements, 10);
  assert.strictEqual(r.json.unionStatements, 3);
  assert.strictEqual(r.json.specs.length, 2);
  const a = r.json.specs.filter(function (s) { return s.spec === 'a.spec.js'; })[0];
  assert.strictEqual(a.covered, 2); assert.strictEqual(a.unique, 1); assert.strictEqual(a.order, 1);
  assert.ok(/\| a\.spec\.js \| 2 \| 0 \| 1 \| 2 \| 1 \| 1 \|/.test(r.markdown), r.markdown);
  assert.ok(r.markdown.indexOf('3 of 10 statements') !== -1, r.markdown);
});

test('T1f untouchedFiles lists files on disk with no covered statement', function () {
  const files = ['src/web-ui/a.js', 'src/web-ui/b.js', 'src/web-ui/c.js'];
  assert.deepStrictEqual(m.untouchedFiles(files, new Set(['src/web-ui/a.js:3:0'])), ['src/web-ui/b.js', 'src/web-ui/c.js']);
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s2] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s2] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s2] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
