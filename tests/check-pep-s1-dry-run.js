'use strict';

// tests/check-pep-s1-dry-run.js — pep-s1
//
// Unit + integration tests for pep-s1 (Retrospective dry-run of /programme
// Steps 0-6 against skills-platform-phase4). Covers AC1-AC4 from
// artefacts/2026-11-08-programme-entry-points/test-plans/
// pep-s1-retrospective-dry-run-test-plan.md.
//
// Follows this repo's own hand-rolled test()/assert style (no Jest/Mocha).

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var dryRun = require('../src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js');

var REPO_ROOT = path.resolve(__dirname, '..');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

(async function() {
  // ── Unit tests ──────────────────────────────────────────────────────────

  await test('computes Step 0 verdict as fail for phase4\'s real pre-patch profile (AC1)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var step0 = dryRun.scoreStep0(profile);
    assert.strictEqual(step0.verdict, 'fail', 'expected fail verdict since none of phase4\'s real signals clear the pre-patch threshold');
  });

  await test('records specific per-signal breakdown for Step 0, not a bare aggregate (AC1)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var step0 = dryRun.scoreStep0(profile);
    var keys = Object.keys(step0.signals);
    assert.deepStrictEqual(
      keys.sort(),
      ['consumerMigration', 'crossTeamHardDeps', 'formalPhaseGates', 'multipleTeams', 'timelineMultiPhaseOverOneQuarter'].sort(),
      'expected all 5 Step 0 signals present individually'
    );
    keys.forEach(function(k) {
      assert.strictEqual(step0.signals[k].value, false, 'expected signal ' + k + ' to be false for phase4\'s real history');
      assert.ok(step0.signals[k].detail && step0.signals[k].detail.length > 0, 'expected a non-empty evidence detail for ' + k);
    });
  });

  await test('computes 1 operator from phase4\'s real git history (AC1)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    assert.strictEqual(profile.operatorCount, 1, 'expected exactly 1 distinct git author for the phase4 fixture directory');
  });

  await test('classifies Step 5 (consumer registry) as a scoping mismatch, not a gap, for phase4 (AC3)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var step5 = dryRun.walkStep5(profile);
    assert.strictEqual(step5.verdict, 'scoping-mismatch', 'expected scoping-mismatch, not gap -- Step 5 is not broken, it simply does not apply to a non-type-2 programme');
    assert.ok(/best-fit type is 3/.test(step5.notes), 'expected the best-fit initiative type (3) to be named explicitly');
  });

  await test('write-up artefact contains one entry per step (7 total) with a populated verdict (AC4)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var result = { profile: profile, step0: dryRun.scoreStep0(profile), steps1to6: [dryRun.walkStep1(profile), dryRun.walkStep2(profile), dryRun.walkStep3(profile), dryRun.walkStep4(profile), dryRun.walkStep5(profile), dryRun.walkStep6(profile)] };
    var writeUp = dryRun.generateWriteUp(result);
    var stepHeadingCount = (writeUp.match(/^### Step \d/gm) || []).length;
    assert.strictEqual(stepHeadingCount, 6, 'expected 6 "### Step N" headings for Steps 1-6');
    assert.ok(/## Step 0 — Qualification/.test(writeUp), 'expected a Step 0 section');
    assert.ok(!/TBD/.test(writeUp), 'expected no placeholder "TBD" verdicts');
    result.steps1to6.forEach(function(s) {
      assert.ok(s.verdict && s.verdict.length > 0, 'expected Step ' + s.step + ' to have a non-blank verdict');
    });
  });

  // ── Integration tests ────────────────────────────────────────────────────

  await test('Step 0 dry-run reads phase4\'s real timeline from the fixture\'s own Date fields, not a hand-typed number (AC1)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    // Verified directly against the real fixture during implementation: discovery/epics
    // are dated 2026-04-19/04-20, but the real DoD completion artefacts
    // (artefacts/archived/2026-04-19-skills-platform-phase4/dod/*.md) are dated
    // 2026-04-21 -- a date this story's earlier artefacts (test plan, decisions.md)
    // did not account for when they said "2-day span". The TRUE full span is 3 days.
    // This test asserts the real, verified value -- not the stale "2" figure --
    // per the test plan's own design intent ("asserts computed values match the
    // real fixture, not an asserted constant").
    assert.strictEqual(profile.timelineSpanDays, 3, 'expected the real computed span (discovery 04-19 through DoD completions 04-21) to be 3 days -- see module header note and this story\'s implementation report for the correction this surfaced');
    assert.strictEqual(profile.timelineRange.min, '2026-04-19');
    assert.strictEqual(profile.timelineRange.max, '2026-04-21');
  });

  await test('Steps 1-6 walked sequentially, each consuming the same real profile, none inventing an input (AC2)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var steps = [dryRun.walkStep1(profile), dryRun.walkStep2(profile), dryRun.walkStep3(profile), dryRun.walkStep4(profile), dryRun.walkStep5(profile), dryRun.walkStep6(profile)];
    assert.strictEqual(steps.length, 6);
    steps.forEach(function(s, i) {
      assert.strictEqual(s.step, i + 1, 'expected steps in order 1..6');
      assert.ok(['satisfied', 'adapted', 'gap', 'scoping-mismatch'].indexOf(s.verdict) !== -1, 'expected a recognised verdict for step ' + s.step + ', got ' + s.verdict);
      assert.ok(s.notes && s.notes.length > 20, 'expected substantive notes for step ' + s.step + ', not a placeholder');
    });
    // Step 3's finding (no real team separation) must be the stated reason Step 4
    // answers "none identified" -- confirms Step 4 actually consumed Step 3's
    // real output rather than independently inventing its own answer.
    assert.ok(/Step 3/.test(steps[3].notes), 'expected Step 4 to explicitly reference Step 3\'s finding, proving it consumed the prior step\'s real output');
  });

  await test('write-up artefact\'s gap entries name a specific, named mechanism or file (AC4)', async function() {
    var profile = dryRun.computePhase4Profile(REPO_ROOT);
    var result = { profile: profile, step0: dryRun.scoreStep0(profile), steps1to6: [dryRun.walkStep1(profile), dryRun.walkStep2(profile), dryRun.walkStep3(profile), dryRun.walkStep4(profile), dryRun.walkStep5(profile), dryRun.walkStep6(profile)] };
    var gaps = result.steps1to6.filter(function(s) { return s.verdict === 'gap'; });
    assert.ok(gaps.length >= 1, 'expected at least one real gap classification among Steps 1-6');
    gaps.forEach(function(g) {
      assert.ok(/`[^`]+`/.test(g.notes), 'expected gap for step ' + g.step + ' to name a specific file/mechanism in backticks, not a vague narrative statement');
    });
  });

  await test('write-up artefact is written to the agreed path and is non-empty (AC4)', async function() {
    var outPath = path.resolve(REPO_ROOT, 'artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md');
    assert.ok(fs.existsSync(outPath), 'expected the write-up artefact to exist at ' + outPath + ' -- run `node src/programme-dry-run/pep-s1-dry-run.js` to generate it');
    var content = fs.readFileSync(outPath, 'utf8');
    assert.ok(content.length > 200, 'expected a substantive write-up, not a near-empty file');
    assert.ok(/Summary for pep-s2/.test(content), 'expected the downstream-consumer summary section pep-s2 depends on');
  });

  console.log('\n[pep-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
