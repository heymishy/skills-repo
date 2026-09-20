#!/usr/bin/env node
// check-ep2-s4-nfr-merge-success-rate.js — NFR-Perf-3 for ep2-s4 (Concurrent
// Write Merge for Artefact Edits), test plan section "NFR-Perf-3: Merge
// Success Rate" (test name `merge.nfr.merge-success-rate-99-percent`).
//
// This closes the gap the story's own plan flagged in its "Post-plan note"
// (artefacts/new-feature-2b74a292/plans/ep2-s4-plan.md) and the final
// cross-task review's own MEDIUM finding M2: no test exercised the DoR/NFR
// claim "Merge success rate >=99% (1 hard conflict per 100 runs is
// acceptable)" against 100+ randomized scenarios -- the shipped Task 1 test
// file has 8 deterministic hand-authored cases, not a randomized-scenario
// success-rate measurement.
//
// Determinism: uses a seeded linear-congruential PRNG (NOT Math.random())
// so this test's own pass/fail outcome is reproducible across CI runs, not
// a source of real flakiness. 100 scenarios are generated: 99 with two
// users editing disjoint random line subsets of a shared base document
// (genuinely non-overlapping by construction -- these must all succeed),
// and exactly 1 scenario with a deliberately engineered single-line overlap
// (these must fail gracefully with MERGE_CONFLICT_HARD, never a crash or an
// unexpected error type) -- reproducing the test plan's own literal
// "99 succeed; <=1 hard conflict" expected result exactly, not merely
// asserting a >=99% threshold that a lucky/unlucky random run could drift
// around.
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-ep2-s4-merge-artefact-edits.js, this same story's own Task 1
// file, for the closest precedent and house style this file matches).

'use strict';

var assert = require('assert');
var { mergeArtefactEdits, MergeConflictError } = require('../src/web-ui/modules/merge-artefact-edits');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  [PASS]', name);
  } catch (err) {
    failed++;
    console.log('  [FAIL]', name, '--', (err && err.message) || err);
  }
}

// Seeded LCG PRNG -- deterministic across runs/machines, unlike Math.random().
function makeRng(seed) {
  var state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

var BASE_LINE_COUNT = 40;
var LINES_EDITED_PER_USER = 4;

function buildBaseLines() {
  var lines = [];
  for (var i = 0; i < BASE_LINE_COUNT; i++) lines.push('Line ' + i + ': base content');
  return lines;
}

// Picks `count` distinct random indices from [0, poolSize), using rng.
function pickDistinctIndices(rng, poolSize, count) {
  var pool = [];
  for (var i = 0; i < poolSize; i++) pool.push(i);
  var chosen = [];
  for (var j = 0; j < count && pool.length > 0; j++) {
    var idx = Math.floor(rng() * pool.length);
    chosen.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return chosen;
}

function applyEdits(baseLines, indices, label) {
  var edited = baseLines.slice();
  indices.forEach(function (i) { edited[i] = baseLines[i] + ' [EDITED BY ' + label + ']'; });
  return edited;
}

// Generates a scenario where userA's and userB's edited-line index sets are
// GUARANTEED disjoint (drawn from disjoint halves of the line pool) --
// genuinely non-overlapping concurrent edits, the common real-world case.
function makeNonOverlappingScenario(rng, scenarioIndex) {
  var baseLines = buildBaseLines();
  var firstHalfPool = [];
  var secondHalfPool = [];
  for (var i = 0; i < BASE_LINE_COUNT; i++) {
    if (i < BASE_LINE_COUNT / 2) firstHalfPool.push(i); else secondHalfPool.push(i);
  }
  var aIndices = pickDistinctIndices(rng, firstHalfPool.length, LINES_EDITED_PER_USER).map(function (k) { return firstHalfPool[k]; });
  var bIndices = pickDistinctIndices(rng, secondHalfPool.length, LINES_EDITED_PER_USER).map(function (k) { return secondHalfPool[k]; });

  var base = baseLines.join('\n');
  var userA = applyEdits(baseLines, aIndices, 'A' + scenarioIndex).join('\n');
  var userB = applyEdits(baseLines, bIndices, 'B' + scenarioIndex).join('\n');
  return { base: base, userA: userA, userB: userB, expectSuccess: true };
}

// Generates a scenario with exactly one deliberately-overlapping line, where
// both users edit that same base line to DIFFERENT content -- a genuine
// hard conflict that must fail gracefully (MERGE_CONFLICT_HARD), not a
// crash or a silently-wrong merge.
function makeOverlappingConflictScenario(rng) {
  var baseLines = buildBaseLines();
  var conflictLine = Math.floor(rng() * BASE_LINE_COUNT);

  var aLines = baseLines.slice();
  var bLines = baseLines.slice();
  aLines[conflictLine] = baseLines[conflictLine] + ' [EDITED BY A-CONFLICT]';
  bLines[conflictLine] = baseLines[conflictLine] + ' [EDITED BY B-CONFLICT]';

  return { base: baseLines.join('\n'), userA: aLines.join('\n'), userB: bLines.join('\n'), expectSuccess: false };
}

function runSuccessRateSuite() {
  var rng = makeRng(0xE2 * 0x100000 + 4); // fixed seed, deterministic across runs
  var scenarios = [];
  for (var i = 0; i < 99; i++) scenarios.push(makeNonOverlappingScenario(rng, i));
  scenarios.push(makeOverlappingConflictScenario(rng));

  var succeeded = 0;
  var gracefulFailures = 0;
  var crashes = [];

  scenarios.forEach(function (scenario, idx) {
    try {
      var result = mergeArtefactEdits(scenario.base, scenario.userA, scenario.userB, { userAId: 'user-a', userBId: 'user-b' });
      if (scenario.expectSuccess) {
        succeeded++;
      } else {
        // The one deliberately-conflicting scenario succeeded unexpectedly --
        // not itself a crash, but worth surfacing as a real finding rather
        // than silently counting it as a "success" that masks a detection
        // regression.
        crashes.push({ idx: idx, error: new Error('expected MERGE_CONFLICT_HARD but merge succeeded: ' + JSON.stringify(result)) });
      }
    } catch (err) {
      if (err instanceof MergeConflictError && err.code === 'MERGE_CONFLICT_HARD') {
        if (scenario.expectSuccess) {
          // A scenario built to be non-overlapping nonetheless conflicted --
          // real signal of a false-positive detection bug, not expected.
          crashes.push({ idx: idx, error: new Error('unexpected MERGE_CONFLICT_HARD on a genuinely non-overlapping scenario: ' + err.message) });
        } else {
          gracefulFailures++;
        }
      } else {
        // Any OTHER error type (a real crash, not a graceful, typed conflict).
        crashes.push({ idx: idx, error: err });
      }
    }
  });

  return { total: scenarios.length, succeeded: succeeded, gracefulFailures: gracefulFailures, crashes: crashes };
}

function main() {
  var result = runSuccessRateSuite();

  test('100 randomized concurrent-edit scenarios: >=99 succeed (NFR-Perf-3)', function () {
    assert.strictEqual(result.total, 100, 'expected exactly 100 scenarios, got ' + result.total);
    assert.ok(result.succeeded >= 99, 'expected >=99 successful merges, got ' + result.succeeded + ' of ' + result.total);
  });

  test('the 1 deliberately-conflicting scenario fails gracefully with MERGE_CONFLICT_HARD, not a crash', function () {
    assert.strictEqual(result.gracefulFailures, 1, 'expected exactly 1 graceful hard-conflict failure, got ' + result.gracefulFailures);
  });

  test('no scenario produced an unexpected error type or false-positive/false-negative conflict detection', function () {
    if (result.crashes.length > 0) {
      var detail = result.crashes.map(function (c) { return 'scenario ' + c.idx + ': ' + c.error.message; }).join('; ');
      assert.fail('unexpected outcomes in ' + result.crashes.length + ' scenario(s): ' + detail);
    }
  });

  console.log('\n[ep2-s4-nfr-merge-success-rate] ' + result.succeeded + '/' + result.total + ' succeeded, ' + result.gracefulFailures + ' graceful hard-conflict failure(s), ' + result.crashes.length + ' unexpected outcome(s)');
  console.log('[ep2-s4-nfr-merge-success-rate] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main();
