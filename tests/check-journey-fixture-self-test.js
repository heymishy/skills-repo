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

// AC1: default session fields independently re-derived from journey.js source
test('journeyFixture() default session includes every identity field journey.js reads (login, tenantId, accessToken, userId, role)', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  ['login', 'tenantId', 'accessToken', 'userId', 'role'].forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} must be defined`);
  });
});

// AC4: overrides merge correctly
test('journeyFixture(overrides) merges an override without discarding other defaults', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture({ session: { tenantId: 'override-value' } });
  assert.strictEqual(req.session.tenantId, 'override-value');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
});

// AC3: structural check -- no network, no fs writes, no module-level shared state
test('journey-fixture.js source contains no network calls, filesystem writes, or shared mutable module state', () => {
  const source = fs.readFileSync(path.join(__dirname, 'helpers', 'journey-fixture.js'), 'utf8');
  assert.ok(!/require\(['"]https?['"]\)/.test(source), 'must not require http/https');
  assert.ok(!/fs\.writeFile/.test(source), 'must not write to the filesystem');
  const topLevelAssignment = /^(var|let)\s+\w+\s*=\s*(?!function)/m;
  assert.ok(!topLevelAssignment.test(source), 'must not declare shared mutable state at module level');
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
