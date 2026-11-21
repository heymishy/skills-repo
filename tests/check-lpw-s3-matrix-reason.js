'use strict';
// lpw-s3 T5 (AC5, AC6) -- the capability matrix tells the truth about the board specs and about ep3-s1-regression.
// Plain Node script. Run: node tests/check-lpw-s3-matrix-reason.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'e2e', 'capability-matrix.json'), 'utf8'));
function entry(name) { return matrix.specs.filter(function (e) { return e.file === 'tests/e2e/' + name + '.spec.js'; })[0]; }

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('T5a ep3-s1-regression is out of quarantine (fixed in rgsr-s1), names issue #1042 and does not blame a model-session timeout', function () {
  const e = entry('ep3-s1-regression');
  assert.ok(e, 'entry missing'); assert.strictEqual(e.lane, 'extended');
  assert.ok(/#1042/.test(e.reason), 'reason must name #1042: ' + e.reason);
  assert.ok(!/real model|model turn|model session/i.test(e.reason), 'reason must not say it waits on a model: ' + e.reason);
});

test('T5b the board specs that now pass are out of quarantine, and none of their old reasons survives', function () {
  ['s1.1-board-advance-action', 's1.2-not-ready-explanation', 's3.1-drag-to-advance', 's3.2-within-column-reorder', 'psh-s6-product-kanban'].forEach(function (n) {
    const e = entry(n);
    assert.ok(e, n + ' missing');
    assert.notStrictEqual(e.lane, 'quarantined', n + ' still quarantined');
    assert.ok(!/data-journey-id|unauthenticated test\(\)|does not exist/i.test(e.reason || ''), n + ' still carries an old reason: ' + e.reason);
  });
});

test('T5c kanban-interaction has a core spec (the Advance button and the drag path)', function () {
  const core = matrix.specs.filter(function (e) { return e.capability === 'kanban-interaction' && e.lane === 'core'; });
  assert.ok(core.length >= 1, 'kanban-interaction needs at least one core spec');
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s3] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s3] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s3] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
