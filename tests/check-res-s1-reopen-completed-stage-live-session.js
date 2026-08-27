'use strict';

// check-res-s1-reopen-completed-stage-live-session.js
// Verifies res-s1: a completed stage's step-nav link routes directly to a
// live session (existing or freshly created), instead of the static
// read-only /journey/:id/stage/:skill view -- extending the kcrs-s1/adsr-s1
// existing-session-first pattern to ANY completed stage, not just the
// journey's current active one.
//
// Run: node tests/check-res-s1-reopen-completed-stage-live-session.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();
// No _diskAdapter is wired here -- this test exercises only the in-memory
// _journeys map (journeyStore.updateCompletedStageSessionId's own guarded
// `if (_diskAdapter)` branch is a no-op with no adapter set). Wiring a real
// journeyDisk adapter to also assert the disk-persisted copy was attempted
// but abandoned: journeyStore.createJourney's in-memory journey shape
// (completedStages: []) does not match what journeyDisk.loadJourney/
// updateStage expect on disk (stages: {}), so completeStage's own disk
// write silently no-ops (wrapped in try/catch) before this function ever
// runs -- a pre-existing shape mismatch between the two modules, unrelated
// to and out of scope for this story.

(function main() {

console.log('\nTask 1 — updateCompletedStageSessionId');
(function() {
  var slug = 'res-s1-store-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'old-sid');

  var _preUpdateEntry = journeyStore.getJourney(jid).completedStages.find(function(cs) { return cs.skillName === 'discovery'; });
  var _completedAtBefore = _preUpdateEntry.completedAt;

  journeyStore.updateCompletedStageSessionId(jid, 'discovery', 'new-sid');

  var journey = journeyStore.getJourney(jid);
  var entry = journey.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });

  ok('sessionId updated to the new session', entry.sessionId === 'new-sid');
  ok('skillName unchanged', entry.skillName === 'discovery');
  ok('artefactPath unchanged', entry.artefactPath === 'artefacts/' + slug + '/discovery.md');
  ok('completedAt unchanged (not a re-completion)', !!_completedAtBefore && entry.completedAt === _completedAtBefore);
  ok('journey.sessions map updated', journey.sessions['new-sid'] === 'discovery');
})();

(function() {
  // Negative case: unknown journeyId — must not throw
  var threwOnUnknownJourney = false;
  try { journeyStore.updateCompletedStageSessionId('nonexistent-journey', 'discovery', 'sid'); }
  catch (_) { threwOnUnknownJourney = true; }
  ok('unknown journeyId does not throw', !threwOnUnknownJourney);
})();

(function() {
  // Negative case: unknown skillName on a real journey — must not throw
  var threwOnUnknownStage = false;
  try { journeyStore.updateCompletedStageSessionId(journeyStore.createJourney('res-s1-neg-feature', 'default').journeyId, 'not-a-real-stage', 'sid'); }
  catch (_) { threwOnUnknownStage = true; }
  ok('unknown skillName on a real journey does not throw', !threwOnUnknownStage);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
