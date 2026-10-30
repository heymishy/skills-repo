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

// AC1: default session fields independently re-derived from skills.js source at test time,
// not hardcoded or copy-pasted from journey.js's own field list.
test('skillsFixture() default session includes every field skills.js actually reads (independently re-derived via source scan)', () => {
  const skillsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js'), 'utf8');
  const fieldMatches = skillsSource.match(/req\.session\.([a-zA-Z]+)/g) || [];
  const realFields = Array.from(new Set(fieldMatches.map((m) => m.replace('req.session.', ''))));
  assert.ok(realFields.length > 0, 'expected to find at least one req.session.<field> read in skills.js');
  const { skillsFixture } = require('./helpers/skills-fixture');
  const req = skillsFixture();
  realFields.forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} (read by skills.js) must be defined`);
  });
});

// AC1 (robustness): fresh object per call, no shared reference leaking mutations across tests.
test('skillsFixture() returns a fresh object on every call, not a shared reference', () => {
  const { skillsFixture } = require('./helpers/skills-fixture');
  const first = skillsFixture();
  first.session.tenantId = 'mutated-by-first-call';
  const second = skillsFixture();
  assert.notStrictEqual(second.session.tenantId, 'mutated-by-first-call');
});

// AC2: overrides merge correctly without discarding other defaults.
test('skillsFixture(overrides) merges an override without discarding other defaults', () => {
  const { skillsFixture } = require('./helpers/skills-fixture');
  const req = skillsFixture({ session: { tenantId: 'override-value' } });
  assert.strictEqual(req.session.tenantId, 'override-value');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
});

// NFR-perf / NFR-security: structural source checks, no timing-based assertions (pcr-s1 flakiness precedent).
test('skills-fixture.js source contains no network calls, filesystem writes, or shared mutable module state', () => {
  const source = fs.readFileSync(path.join(__dirname, 'helpers', 'skills-fixture.js'), 'utf8');
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
