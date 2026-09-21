#!/usr/bin/env node
// check-ep2-s4-concurrent-edit-buffer.js — AC verification tests for ep2-s4
// Task 2 (Concurrent-save detection buffer), story
// artefacts/new-feature-2b74a292 (Concurrent Write Merge for Artefact
// Edits).
//
// AC1: registerSave() flags a save as concurrent with a prior save for the
//      SAME journeyId+stageName key when it arrives strictly within 100ms
//      of that prior save, and never flags saves to different keys, or
//      saves 100ms or more apart, as concurrent.
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-ep2-s4-merge-artefact-edits.js, this same story's Task 1
// file) -- no Jest/Mocha, Node.js built-ins only.

'use strict';

var assert = require('assert');
var buffer = require('../src/web-ui/modules/concurrent-edit-buffer');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; console.log('  [FAIL]', name, '--', (err && err.message) || err);
  }
}

function main() {

  test('second save within 100ms is detected as concurrent with the first', function () {
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
  });

  test('a save 150ms later is NOT flagged concurrent (well outside the 100ms window)', function () {
    buffer._clearForTesting();
    var fakeNow = 2000000;
    buffer.setNow(function () { return fakeNow; });

    var key = 'journey-abc:s1';
    buffer.registerSave(key, 'user-susan', 'susan content');

    fakeNow += 150; // outside the 100ms window
    var second = buffer.registerSave(key, 'user-darren', 'darren content');
    assert.strictEqual(second.concurrentWith, null, 'a save 150ms later must NOT be flagged concurrent');
  });

  test('a save 99ms later IS flagged concurrent (just inside the boundary)', function () {
    buffer._clearForTesting();
    var fakeNow = 4000000;
    buffer.setNow(function () { return fakeNow; });

    var key = 'journey-abc:s1';
    buffer.registerSave(key, 'user-susan', 'susan content');

    fakeNow += 99; // 1ms inside the 100ms window
    var second = buffer.registerSave(key, 'user-darren', 'darren content');
    assert.ok(second.concurrentWith, 'a save 99ms later must be flagged concurrent (AC1 boundary: not 99, not 101)');
    assert.strictEqual(second.concurrentWith.userId, 'user-susan');
  });

  test('a save at exactly 100ms later is NOT flagged concurrent (the boundary itself, strict < check)', function () {
    buffer._clearForTesting();
    var fakeNow = 5000000;
    buffer.setNow(function () { return fakeNow; });

    var key = 'journey-abc:s1';
    buffer.registerSave(key, 'user-susan', 'susan content');

    fakeNow += 100; // exactly at the boundary
    var second = buffer.registerSave(key, 'user-darren', 'darren content');
    assert.strictEqual(second.concurrentWith, null, 'a save at exactly 100ms later must NOT be flagged concurrent (AC1 boundary: exactly 100ms, not looser)');
  });

  test('saves to a different journey+stage key never collide', function () {
    buffer._clearForTesting();
    var fakeNow = 3000000;
    buffer.setNow(function () { return fakeNow; });

    buffer.registerSave('journey-a:s1', 'user-susan', 'content-a');
    fakeNow += 10;
    var otherKey = buffer.registerSave('journey-b:s1', 'user-darren', 'content-b');
    assert.strictEqual(otherKey.concurrentWith, null, 'saves to a different journey+stage key must never be treated as concurrent');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

main();
