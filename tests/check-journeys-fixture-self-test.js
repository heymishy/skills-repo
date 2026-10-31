'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// AC1: default session fields independently re-derived from journeys.js source at test time,
// not hardcoded or copy-pasted from journey.js's or skills.js's own field list.
test('journeysFixture() default session includes every field journeys.js actually reads (independently re-derived via source scan)', () => {
  const journeysSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'journeys.js'), 'utf8');
  const fieldMatches = journeysSource.match(/req\.session\.([a-zA-Z]+)/g) || [];
  const realFields = Array.from(new Set(fieldMatches.map((m) => m.replace('req.session.', ''))));
  assert.ok(realFields.length > 0, 'expected to find at least one req.session.<field> read in journeys.js');
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const req = journeysFixture();
  realFields.forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} (read by journeys.js) must be defined`);
  });
});

// AC1 (robustness): fresh object per call, no shared reference leaking mutations across tests.
test('journeysFixture() returns a fresh object on every call, not a shared reference', () => {
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const first = journeysFixture();
  first.session.tenantId = 'mutated-by-first-call';
  const second = journeysFixture();
  assert.notStrictEqual(second.session.tenantId, 'mutated-by-first-call');
});

// AC2: overrides merge correctly without discarding other defaults.
test('journeysFixture(overrides) merges a params override without discarding the default session', () => {
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const req = journeysFixture({ params: { id: 'j1' } });
  assert.strictEqual(req.params.id, 'j1');
  assert.ok(req.session.tenantId, 'tenantId must still be present after a params-only override');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
