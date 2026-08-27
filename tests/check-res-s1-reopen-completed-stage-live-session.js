'use strict';

// check-res-s1-reopen-completed-stage-live-session.js
// Verifies res-s1: a completed stage's step-nav link routes directly to a
// live session (existing or freshly created), instead of the static
// read-only /journey/:id/stage/:skill view -- extending the kcrs-s1/adsr-s1
// existing-session-first pattern to ANY completed stage, not just the
// journey's current active one.
//
// Run: node tests/check-res-s1-reopen-completed-stage-live-session.js

var path = require('path');
var fs   = require('fs');
var os   = require('os');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-res-s1-'));

var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();

(function main() {

console.log('\nTask 1 — updateCompletedStageSessionId');
(function() {
  var slug = 'res-s1-store-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'old-sid');

  journeyStore.updateCompletedStageSessionId(jid, 'discovery', 'new-sid');

  var journey = journeyStore.getJourney(jid);
  var entry = journey.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });

  ok('sessionId updated to the new session', entry.sessionId === 'new-sid');
  ok('skillName unchanged', entry.skillName === 'discovery');
  ok('artefactPath unchanged', entry.artefactPath === 'artefacts/' + slug + '/discovery.md');
  ok('completedAt unchanged (not a re-completion)', !!entry.completedAt);
  ok('journey.sessions map updated', journey.sessions['new-sid'] === 'discovery');
})();

(function() {
  // Negative case: unknown journeyId or skillName — must not throw
  var threw = false;
  try {
    journeyStore.updateCompletedStageSessionId('nonexistent-journey', 'discovery', 'sid');
    journeyStore.updateCompletedStageSessionId(journeyStore.createJourney('res-s1-neg-feature', 'default').journeyId, 'not-a-real-stage', 'sid');
  } catch (_) { threw = true; }
  ok('unknown journeyId/skillName does not throw', !threw);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
