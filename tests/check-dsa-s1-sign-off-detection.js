'use strict';
// tests/check-dsa-s1-sign-off-detection.js -- AC6
const assert = require('assert');
const { detectExistingSignOff } = require('../src/web-ui/adapters/sign-off-writer');

function testNotSignedOffReturnsNull() {
  var markdown = '## Story: X\n\nSome content, no approval section.';
  var result = detectExistingSignOff(markdown);
  assert.strictEqual(result, null);
}

function testAlreadySignedOffReturnsApproverAndDate() {
  var markdown = '## Story: X\n\nSome content.\n\n## Approved by\n\nJane Doe — 2026-09-19T00:00:00.000Z\n';
  var result = detectExistingSignOff(markdown);
  assert.ok(result, 'expected a real detection result');
  assert.strictEqual(result.approver, 'Jane Doe');
  assert.strictEqual(result.date, '2026-09-19T00:00:00.000Z');
}

testNotSignedOffReturnsNull();
console.log('  ok - not-signed-off markdown returns null');
testAlreadySignedOffReturnsApproverAndDate();
console.log('  ok - already-signed-off markdown returns approver/date');
