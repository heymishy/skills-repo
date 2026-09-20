'use strict';
const assert = require('assert');
const { mergeArtefactEdits } = require('../src/web-ui/modules/merge-artefact-edits');

function testNonOverlappingEditsMergeCleanly() {
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
}

function testHardConflictBothDeleteSameLineThrows() {
  var base  = 'Line 1: keep\nLine 2: delete me\nLine 3: keep';
  var userA = 'Line 1: keep\nLine 3: keep'; // deleted line 2
  var userB = 'Line 1: keep\nLine 3: keep'; // also deleted line 2 -- ambiguous which content survives if edited differently; here both delete identically so this specific case is actually non-conflicting (same intent) -- use a genuine conflicting-edit case instead:
  var userBConflict = 'Line 1: keep\nLine 2: DARREN EDITED THIS INSTEAD OF DELETING\nLine 3: keep';

  assert.throws(function () {
    mergeArtefactEdits(base, userA, userBConflict, { userAId: 'user-susan', userBId: 'user-darren' });
  }, function (err) { return err.code === 'MERGE_CONFLICT_HARD'; }, 'expected MERGE_CONFLICT_HARD when one user deletes a line the other edited');
}

function testLargeArtefactMergesUnder1Second() {
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
}

function main() {
  testNonOverlappingEditsMergeCleanly();
  console.log('  ok - non-overlapping edits merge cleanly with correct line attribution');
  testHardConflictBothDeleteSameLineThrows();
  console.log('  ok - conflicting edit on the same line throws MERGE_CONFLICT_HARD');
  testLargeArtefactMergesUnder1Second();
  console.log('  ok - 1000-line artefact merges in under 1s (NFR-Perf-1)');
}
main();
