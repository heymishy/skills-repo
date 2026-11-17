'use strict';
// lpw-s2 T2 (AC3, AC7) -- the capability matrix lists every browser spec once with a lane, and quarantine is visible.
// Plain Node script. Run: node tests/check-lpw-s2-capability-matrix.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const cm = require(path.join(root, 'scripts', 'capability-matrix'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const TODAY = '2026-11-17';
const FILES = ['tests/e2e/a.spec.js', 'tests/e2e/b.spec.js'];
function entry(file, extra) { return Object.assign({ file: file, capability: 'cap', lane: 'core' }, extra || {}); }
function matrixOf(entries) { return { specs: entries }; }
function problems(entries, files) { return cm.validateMatrix(matrixOf(entries), files || FILES, TODAY, { scenarioFiles: [] }); }
const Q = { lane: 'quarantined', reason: 'drifted', owner: 'operator', entered: '2026-11-17', reviewBy: '2026-12-15' };

test('T2a a valid matrix has no problems', function () {
  assert.deepStrictEqual(problems([entry(FILES[0]), entry(FILES[1], Q)]), []);
});

test('T2b a spec file on disk missing from the matrix is a problem', function () {
  assert.ok(problems([entry(FILES[0])]).some(function (p) { return /b\.spec\.js/.test(p) && /missing/i.test(p); }));
});

test('T2c an entry for a file that does not exist, and a duplicate entry, are problems', function () {
  const p = problems([entry(FILES[0]), entry(FILES[1]), entry('tests/e2e/gone.spec.js'), entry(FILES[0])]);
  assert.ok(p.some(function (x) { return /gone\.spec\.js/.test(x) && /does not exist/i.test(x); }), p.join('|'));
  assert.ok(p.some(function (x) { return /a\.spec\.js/.test(x) && /duplicate/i.test(x); }), p.join('|'));
});

test('T2d an invalid lane or a missing capability is a problem', function () {
  assert.ok(problems([entry(FILES[0], { lane: 'maybe' }), entry(FILES[1])]).some(function (x) { return /lane/i.test(x); }));
  assert.ok(problems([entry(FILES[0], { capability: '' }), entry(FILES[1])]).some(function (x) { return /capability/i.test(x); }));
});

test('T2e a quarantined entry needs a reason, an owner, an entry date and a review date', function () {
  ['reason', 'owner', 'entered', 'reviewBy'].forEach(function (field) {
    const q = Object.assign({}, Q); delete q[field];
    assert.ok(problems([entry(FILES[0]), entry(FILES[1], q)]).some(function (x) { return x.indexOf(field) !== -1; }), 'no problem for missing ' + field);
  });
});

test('T2f a quarantine review date in the past, or more than 45 days after the entry date, is a problem', function () {
  assert.ok(problems([entry(FILES[0]), entry(FILES[1], Object.assign({}, Q, { reviewBy: '2026-11-01' }))]).some(function (x) { return /overdue|past/i.test(x); }));
  assert.ok(problems([entry(FILES[0]), entry(FILES[1], Object.assign({}, Q, { reviewBy: '2027-03-01' }))]).some(function (x) { return /45 days/i.test(x); }));
});

test('T2g the scenario lane is exactly the staging-targeted specs', function () {
  const sc = ['tests/e2e/a.spec.js'];
  const ok = cm.validateMatrix(matrixOf([entry(FILES[0], { lane: 'scenario' }), entry(FILES[1])]), FILES, TODAY, { scenarioFiles: sc });
  assert.deepStrictEqual(ok, []);
  const wrong = cm.validateMatrix(matrixOf([entry(FILES[0]), entry(FILES[1], { lane: 'scenario' })]), FILES, TODAY, { scenarioFiles: sc });
  assert.ok(wrong.some(function (x) { return /scenario/i.test(x); }), wrong.join('|'));
});

test('T2h the real matrix covers every real spec file and has no problems', function () {
  const file = path.join(root, 'tests', 'e2e', 'capability-matrix.json');
  assert.ok(fs.existsSync(file), 'tests/e2e/capability-matrix.json does not exist');
  const matrix = JSON.parse(fs.readFileSync(file, 'utf8'));
  const files = cm.listSpecFiles(root);
  assert.ok(files.length >= 90, 'expected about 95 spec files, found ' + files.length);
  const p = cm.validateMatrix(matrix, files, new Date().toISOString().slice(0, 10), { scenarioFiles: cm.SCENARIO_FILES });
  assert.deepStrictEqual(p, []);
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s2] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s2] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s2] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
