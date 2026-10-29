'use strict';
const assert = require('assert');

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

// AC1: default session includes every field journey.js actually reads
test('journeyFixture() default session includes login, tenantId, accessToken, userId, role', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  ['login', 'tenantId', 'accessToken', 'userId', 'role'].forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} must be defined`);
  });
});

// AC1 edge case: fresh object per call, no shared mutable reference
test('journeyFixture() returns a fresh object on every call, not a shared reference', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const a = journeyFixture();
  a.session.tenantId = 'changed';
  const b = journeyFixture();
  assert.notStrictEqual(b.session.tenantId, 'changed');
});

// AC3: default tenantId is non-empty, never '' and never undefined
test('journeyFixture() defaults session.tenantId to a non-empty synthetic value', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  assert.ok(typeof req.session.tenantId === 'string' && req.session.tenantId.length > 0, 'tenantId must be a non-empty string');
  assert.notStrictEqual(req.session.tenantId, '');
  assert.notStrictEqual(req.session.tenantId, undefined);
});

// AC4: overrides merge over defaults without discarding other fields
test('journeyFixture(overrides) merges overrides over defaults', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture({ session: { tenantId: 'other-tenant' } });
  assert.strictEqual(req.session.tenantId, 'other-tenant');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
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
