'use strict';
const assert = require('assert');
const buffer = require('../src/web-ui/modules/concurrent-edit-buffer');

function testDetectsSecondSaveWithin100ms() {
  buffer._clearForTesting();
  var fakeNow = 1000000;
  buffer.setNow(function () { return fakeNow; });

  var key = 'journey-abc:s1';
  var first = buffer.registerSave(key, 'user-susan', 'susan content');
  assert.strictEqual(first.concurrentWith, null, 'first save should have no concurrent partner');

  fakeNow += 50; // Darren's save arrives 50ms later, within the 100ms window
  var second = buffer.registerSave(key, 'user-darren', 'darren content');
  assert.ok(second.concurrentWith, 'second save within 100ms should detect the first as concurrent');
  assert.strictEqual(second.concurrentWith.userId, 'user-susan');
  assert.strictEqual(second.concurrentWith.content, 'susan content');

  buffer.setNow(function () { return Date.now(); });
}

function testNoFalsePositiveOutside100ms() {
  buffer._clearForTesting();
  var fakeNow = 2000000;
  buffer.setNow(function () { return fakeNow; });

  var key = 'journey-abc:s1';
  buffer.registerSave(key, 'user-susan', 'susan content');

  fakeNow += 150; // outside the 100ms window
  var second = buffer.registerSave(key, 'user-darren', 'darren content');
  assert.strictEqual(second.concurrentWith, null, 'a save 150ms later must NOT be flagged concurrent (AC1 boundary: exactly 100ms, not looser)');

  buffer.setNow(function () { return Date.now(); });
}

function testDifferentKeysDoNotCollide() {
  buffer._clearForTesting();
  var fakeNow = 3000000;
  buffer.setNow(function () { return fakeNow; });

  buffer.registerSave('journey-a:s1', 'user-susan', 'content-a');
  fakeNow += 10;
  var otherKey = buffer.registerSave('journey-b:s1', 'user-darren', 'content-b');
  assert.strictEqual(otherKey.concurrentWith, null, 'saves to a different journey+stage key must never be treated as concurrent');

  buffer.setNow(function () { return Date.now(); });
}

function main() {
  testDetectsSecondSaveWithin100ms();
  console.log('  ok - second save within 100ms is detected as concurrent with the first');
  testNoFalsePositiveOutside100ms();
  console.log('  ok - a save 150ms later is NOT flagged concurrent (exact 100ms boundary)');
  testDifferentKeysDoNotCollide();
  console.log('  ok - different journey+stage keys never collide');
}
main();
