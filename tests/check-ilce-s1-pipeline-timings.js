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

function tempLogPath() {
  return path.join(os.tmpdir(), 'ilce-s1-timings-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
}

test('appendTimingRecord writes a well-formed record with required fields', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'implementation-plan' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const record = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(record.skill, 'implementation-plan');
  assert.strictEqual(record.featureSlug, 'test-feat');
  assert.strictEqual(record.storySlug, 'test-s1');
  assert.strictEqual(record.stage, 'implementation-plan');
  assert.ok(typeof record.timestamp === 'string' && !isNaN(Date.parse(record.timestamp)), 'timestamp must be a valid ISO 8601 string');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord creates the log file fresh when it does not exist', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  assert.ok(!fs.existsSync(logPath), 'precondition: file must not exist yet');
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  assert.ok(fs.existsSync(logPath));
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 1);
  assert.doesNotThrow(() => JSON.parse(lines[0]));
  fs.unlinkSync(logPath);
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
