'use strict';
// check-enfr-s1-journey-merge-nfr-coverage.js — enfr-s1
//
// Dedicated automated tests for ep1-s1's two code-review-only NFRs on
// _mergeStateFeaturesIntoJourneyList (src/web-ui/routes/journey.js):
// "stalled features included" and "feature list fetch <=2 seconds".
// Covers AC1-AC2 from
// artefacts/2026-09-12-ep1-s1-nfr-coverage-backfill/test-plans/enfr-s1-test-plan.md.
//
// Test-only story -- journey.js itself is not modified.

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

var journeyRoutes = require('../src/web-ui/routes/journey');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enfr-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeState(features) {
  var dir = path.join(_scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: features }), 'utf8');
}

check('AC1: a stalled-stage feature with no journey-store record is included in the merged output', () => {
  writeState([
    { slug: 'f-stalled', stage: 'stalled', updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-completed', stage: 'completed', updatedAt: '2026-08-01T00:00:00.000Z' }
  ]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged.length, 1, 'expected only the stalled feature to survive the terminal-stage filter');
  assert.strictEqual(merged[0].featureSlug, 'f-stalled');
  assert.strictEqual(merged[0].currentStage, 'stalled');
});

check('AC2: merge against this repo\'s real, current pipeline-state.json completes well within the 2s budget', () => {
  var realStatePath = path.join(__dirname, '..', '.github', 'pipeline-state.json');
  var dir = path.join(_scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(realStatePath, path.join(dir, 'pipeline-state.json'));

  var start = Date.now();
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  var elapsedMs = Date.now() - start;

  assert.ok(Array.isArray(merged), 'expected an array result');
  assert.ok(elapsedMs < 2000, 'expected merge to complete within 2000ms, took ' + elapsedMs + 'ms');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
