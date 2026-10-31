'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
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

const HAND_ROLLED_FIXTURE = path.join(__dirname, 'fixtures', 'tfhc-s7-hand-rolled-mockreq.js');
const HAND_ROLLED_FIXTURE_SESSION_NOT_FIRST = path.join(__dirname, 'fixtures', 'tfhc-s7-hand-rolled-mockreq-session-not-first.js');
const SHARED_FIXTURE_USAGE = path.join(__dirname, 'fixtures', 'tfhc-s7-shared-fixture-usage.js');

// AC1/AC4: flags a hand-rolled mockReq (session-first case)
test('scanFileForHandRolledFixture flags a file that hand-rolls its own mockReq', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journeys-fixture-usage');
  const findings = scanFileForHandRolledFixture(HAND_ROLLED_FIXTURE);
  assert.ok(findings.length > 0, 'expected at least one finding');
  assert.ok(findings[0].file === HAND_ROLLED_FIXTURE);
});

// AC4 (blind-spot regression): flags a hand-rolled fixture where `session`
// is not the first key in the object literal -- the exact shape the regex
// fix in 480aa194 addressed.
test('scanFileForHandRolledFixture flags a hand-rolled fixture where session is not the first key', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journeys-fixture-usage');
  const findings = scanFileForHandRolledFixture(HAND_ROLLED_FIXTURE_SESSION_NOT_FIRST);
  assert.ok(findings.length > 0, 'expected at least one finding');
  assert.ok(findings[0].file === HAND_ROLLED_FIXTURE_SESSION_NOT_FIRST);
});

// AC4: passes a file using the shared fixture
test('scanFileForHandRolledFixture finds nothing in a file using the shared fixture', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journeys-fixture-usage');
  const findings = scanFileForHandRolledFixture(SHARED_FIXTURE_USAGE);
  assert.strictEqual(findings.length, 0);
});

// AC4: mutation-test -- toggling a real fixture file's content flips the result
test('toggling a temp copy from hand-rolled to shared-fixture-usage flips the check result', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journeys-fixture-usage');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tfhc-s7-'));
  const tmpFile = path.join(tmpDir, 'scratch-mockreq.js');

  fs.copyFileSync(HAND_ROLLED_FIXTURE, tmpFile);
  const before = scanFileForHandRolledFixture(tmpFile);
  assert.ok(before.length > 0, 'before: expected a finding on the unmodified hand-rolled copy');

  fs.copyFileSync(SHARED_FIXTURE_USAGE, tmpFile);
  const after = scanFileForHandRolledFixture(tmpFile);
  assert.strictEqual(after.length, 0, 'after: expected no finding once the file is edited to use the shared fixture');
});

// AC5: /review wiring
test('skills/review/SKILL.md references check-journeys-fixture-usage.js as a distinct finding category', () => {
  const reviewSkillPath = path.join(__dirname, '..', 'skills', 'review', 'SKILL.md');
  const content = fs.readFileSync(reviewSkillPath, 'utf8');
  assert.ok(content.includes('check-journeys-fixture-usage.js'), 'SKILL.md must reference the check script');
  assert.ok(/Category H/.test(content), 'must be surfaced as a distinct category, not folded into an existing one');
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
