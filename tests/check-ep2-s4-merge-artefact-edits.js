#!/usr/bin/env node
// check-ep2-s4-merge-artefact-edits.js — AC verification tests for ep2-s4
// Task 1 (Three-way merge algorithm), story
// artefacts/new-feature-2b74a292 (Concurrent Write Merge for Artefact
// Edits).
//
// AC2: mergeArtefactEdits() performs a proper LCS (Longest Common
//      Subsequence)-based three-way line merge with per-line
//      attribution, and throws MERGE_CONFLICT_HARD only on genuine
//      overlapping edits -- never on unrelated edits that merely shift
//      line indices (insertions/deletions elsewhere in the file).
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-bcf-s1-button-contrast.js, tests/check-rclr-s1-repo-freshness.js)
// -- no Jest/Mocha, Node.js built-ins only.

'use strict';

var assert = require('assert');
var { mergeArtefactEdits } = require('../src/web-ui/modules/merge-artefact-edits');

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

  test('non-overlapping edits merge cleanly with correct line attribution', function () {
    var base   = 'Line 1: AC1: Some requirement\nLine 2: AC2: Another requirement\nLine 3:\nLine 4: Architecture constraint: design pattern X\nLine 5:';
    var userA  = 'Line 1: AC1: Some requirement [REVISED BY SUSAN]\nLine 2: AC2: Another requirement [REVISED BY SUSAN]\nLine 3:\nLine 4: Architecture constraint: design pattern X\nLine 5:';
    var userB  = 'Line 1: AC1: Some requirement\nLine 2: AC2: Another requirement\nLine 3:\nLine 4: Architecture constraint: design pattern X [REVISED BY DARREN]\nLine 5: [NEW LINE FROM DARREN: Additional architecture note]';

    var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-susan', userBId: 'user-darren' });

    assert.ok(result.merged.includes('[REVISED BY SUSAN]'), 'expected Susan\'s revision in merged output');
    assert.ok(result.merged.includes('[REVISED BY DARREN]'), 'expected Darren\'s revision in merged output');
    assert.ok(result.merged.includes('[NEW LINE FROM DARREN'), 'expected Darren\'s new line in merged output');
    assert.strictEqual(result.lineAttributions[1], 'user-susan');
    assert.strictEqual(result.lineAttributions[2], 'user-susan');
    assert.strictEqual(result.lineAttributions[4], 'user-darren');
    assert.strictEqual(result.lineAttributions[5], 'user-darren');
  });

  test('delete-vs-edit conflict on the same base line throws MERGE_CONFLICT_HARD', function () {
    var base  = 'Line 1: keep\nLine 2: delete me\nLine 3: keep';
    var userA = 'Line 1: keep\nLine 3: keep'; // A deleted line 2
    var userBConflict = 'Line 1: keep\nLine 2: DARREN EDITED THIS INSTEAD OF DELETING\nLine 3: keep';

    assert.throws(function () {
      mergeArtefactEdits(base, userA, userBConflict, { userAId: 'user-susan', userBId: 'user-darren' });
    }, function (err) { return err.code === 'MERGE_CONFLICT_HARD'; }, 'expected MERGE_CONFLICT_HARD when one user deletes a line the other edited');
  });

  test('edit-vs-edit conflict on the same base line throws MERGE_CONFLICT_HARD', function () {
    var base  = 'Line 1: keep\nLine 2: original requirement text\nLine 3: keep';
    var userA = 'Line 1: keep\nLine 2: SUSAN\'S EDIT of the requirement text\nLine 3: keep';
    var userB = 'Line 1: keep\nLine 2: DARREN\'S DIFFERENT EDIT of the requirement text\nLine 3: keep';

    assert.throws(function () {
      mergeArtefactEdits(base, userA, userB, { userAId: 'user-susan', userBId: 'user-darren' });
    }, function (err) { return err.code === 'MERGE_CONFLICT_HARD'; }, 'expected MERGE_CONFLICT_HARD when both users edit the same line with different, non-deletion content');
  });

  test('both users making the identical edit to the same line does not conflict (unattributed)', function () {
    var base  = 'Line 1: keep\nLine 2: old value\nLine 3: keep';
    var userA = 'Line 1: keep\nLine 2: same new value\nLine 3: keep';
    var userB = 'Line 1: keep\nLine 2: same new value\nLine 3: keep';

    var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-susan', userBId: 'user-darren' });

    assert.strictEqual(result.merged, 'Line 1: keep\nLine 2: same new value\nLine 3: keep');
    assert.strictEqual(result.lineAttributions[2], undefined, 'expected an independently-agreed identical edit to be unattributed, not credited to either user');
  });

  test('both users appending different new trailing content throws MERGE_CONFLICT_HARD', function () {
    var base  = 'Line 1: keep\nLine 2: keep';
    var userA = 'Line 1: keep\nLine 2: keep\nLine 3: ADDED BY A';
    var userB = 'Line 1: keep\nLine 2: keep\nLine 3: ADDED BY B DIFFERENT';

    assert.throws(function () {
      mergeArtefactEdits(base, userA, userB, { userAId: 'user-susan', userBId: 'user-darren' });
    }, function (err) { return err.code === 'MERGE_CONFLICT_HARD'; }, 'expected MERGE_CONFLICT_HARD when both users append non-identical new trailing content at the same point');
  });

  test('a mid-file deletion on one side plus a genuinely unrelated distant edit on the other side does NOT falsely conflict (regression for index-shift bug)', function () {
    var base =
      'Line 1: header\n' +
      'Line 2: unrelated to be deleted by A\n' +
      'Line 3: middle content\n' +
      'Line 4: middle content 2\n' +
      'Line 5: distant line to be edited by B\n' +
      'Line 6: footer';
    // A deletes the early, unrelated line 2 -- everything else untouched.
    var userA =
      'Line 1: header\n' +
      'Line 3: middle content\n' +
      'Line 4: middle content 2\n' +
      'Line 5: distant line to be edited by B\n' +
      'Line 6: footer';
    // B edits the distant, unrelated line 5 -- does not touch line 2 at all.
    var userB =
      'Line 1: header\n' +
      'Line 2: unrelated to be deleted by A\n' +
      'Line 3: middle content\n' +
      'Line 4: middle content 2\n' +
      'Line 5: EDITED BY B\n' +
      'Line 6: footer';

    var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-a', userBId: 'user-b' });

    var expected =
      'Line 1: header\n' +
      'Line 3: middle content\n' +
      'Line 4: middle content 2\n' +
      'Line 5: EDITED BY B\n' +
      'Line 6: footer';
    assert.strictEqual(result.merged, expected, 'expected the deletion and the distant edit to merge cleanly with no conflict');
    assert.ok(!result.merged.includes('unrelated to be deleted by A'), 'expected the deleted line to be gone');
    assert.ok(result.merged.includes('EDITED BY B'), 'expected the distant edit to be present');
  });

  test('a mid-file insertion on one side does not mis-attribute unrelated unchanged later lines (regression for silent mis-attribution bug)', function () {
    var base =
      'Line 1: header\n' +
      'Line 2: body content\n' +
      'Line 3: footer';
    // A inserts a new line right after line 1 -- everything else untouched.
    var userA =
      'Line 1: header\n' +
      'Line 1.5: INSERTED BY A\n' +
      'Line 2: body content\n' +
      'Line 3: footer';
    // B makes no edits at all.
    var userB = base;

    var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-a', userBId: 'user-b' });

    assert.ok(result.merged.includes('INSERTED BY A'), 'expected the inserted line to be present');
    var attributedToA = Object.keys(result.lineAttributions).filter(function (lineNum) {
      return result.lineAttributions[lineNum] === 'user-a';
    });
    assert.strictEqual(attributedToA.length, 1, 'expected exactly one merged line attributed to user-a (the inserted line), got ' + attributedToA.length);
  });

  test('1000-line artefact merges in under 1s (NFR-Perf-1)', function () {
    var lines = [];
    for (var i = 0; i < 1000; i++) lines.push('Line ' + i + ': base content');
    var base = lines.join('\n');
    var userALines = lines.slice(); userALines[10] = 'Line 10: EDITED BY A';
    var userBLines = lines.slice(); userBLines[900] = 'Line 900: EDITED BY B';
    var userA = userALines.join('\n');
    var userB = userBLines.join('\n');

    var start = Date.now();
    var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-a', userBId: 'user-b' });
    var elapsed = Date.now() - start;

    assert.ok(elapsed < 1000, 'expected merge of 1000-line artefact to complete in under 1s, took ' + elapsed + 'ms');
    assert.ok(result.merged.includes('EDITED BY A'));
    assert.ok(result.merged.includes('EDITED BY B'));
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

main();
