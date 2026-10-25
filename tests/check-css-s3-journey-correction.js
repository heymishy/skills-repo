'use strict';
// check-css-s3-journey-correction.js
// Integration test for css-s3 AC2's journey-correction half (Task 7): when
// _pipelineStateWriter reports a resolved conflict, handlePostGateConfirm
// reassigns its own local session.skillName to the resolved value BEFORE
// any downstream decision (nextStage computation, PER_STORY_SEQ handling,
// setActiveSession calls) runs -- so the web-UI journey's own next
// session/redirect reflects pipeline-state.json's own winning value, not
// its own stale belief. See decisions.md's Task 7 ARCH entry for the full
// design (why a standalone Postgres write at the conflict-detection point
// would be ineffective, and why this reassignment is the real fix).
//
// Reuses acdg-s2's own proven fixture pattern (setupStageSession / authReq
// / makeRes).

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}
function getStore() { return require(JOURNEY_STORE_PATH); }

function makeRes() {
  var res = {
    _status: null, _headers: {}, _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user', csrfToken: 'test-csrf-token' },
    params: {},
    body: { _csrf: 'test-csrf-token' }
  }, extra || {});
}

var tmpRoot = path.join(os.tmpdir(), 'css-s3-journey-correction-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

function setupStageSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || ('test-feature-css-s3-jc-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var skillName = opts.skillName || 'benefit-metric';
  var artefactRelPath = opts.artefactRelPath || ('artefacts/' + featureSlug + '/' + skillName + '.md');
  var artefactContent = opts.artefactContent || ('# ' + skillName + ' artefact for ' + featureSlug);

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  var sid = 'sid-css-s3-jc-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  var absArtefact = path.join(tmpRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
  fs.writeFileSync(absArtefact, artefactContent, 'utf8');

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);

  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return { skillName: skillName, done: true, artefactPath: artefactRelPath, artefactContent: artefactContent, journeyId: journeyId, turns: [], systemPrompt: 'test' };
    }
    return null;
  });

  return { journeyId: journeyId, sid: sid, featureSlug: featureSlug, skillName: skillName };
}

var queue = [];

queue.push(function() {
  return test('gateConfirm_correctsJourneySide_whenWriterReportsResolvedConflict', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    // session.skillName='benefit-metric' is the web-UI's own (stale)
    // belief about what just completed. The mocked writer reports that
    // pipeline-state.json's own conflict resolution already landed on
    // 'definition' (the CLI's more-advanced, winning value) -- a genuinely
    // DIFFERENT stage than what the web-UI thinks just happened.
    var setup = setupStageSession(journey, store, { skillName: 'benefit-metric' });

    journey.setPipelineStateWriter(async function() {
      return { conflict: { pipelineStateValue: 'definition', journeyValue: 'benefit-metric', resolved: 'definition' } };
    });

    var res = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res);

    // If the reassignment did NOT happen, nextStage would be computed from
    // the ORIGINAL 'benefit-metric' -> getNextStage('benefit-metric') ===
    // 'design' -> a completely different redirect
    // ('/skills/design/sessions/.../chat'). If the reassignment DID happen,
    // nextStage is computed from the RESOLVED 'definition' ->
    // getNextStage('definition') === 'review' -> since no 'definition'
    // completedStages entry exists in this synthetic fixture (so
    // autoStoryIds stays empty), the 'review' branch falls back to the
    // manual stories-confirmation redirect -- a distinguishing, easily
    // asserted outcome that only occurs via the resolved value.
    assert.strictEqual(res._headers.Location, '/journey/' + setup.journeyId + '/stories',
      'expected the redirect to reflect nextStage computed from the RESOLVED stage (\'definition\' -> \'review\' -> stories-confirm), not the original stale session.skillName (\'benefit-metric\' -> \'design\'), got Location: ' + res._headers.Location);
  });
});

queue.push(function() {
  return test('gateConfirm_leavesSessionSkillNameUnchanged_whenNoConflictReported', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    var setup = setupStageSession(journey, store, { skillName: 'benefit-metric' });

    // Ordinary case: no conflict (writer returns {conflict: null}, or a
    // writer that returns nothing at all, like the local-fs writer or any
    // mock using the older `function() {}` no-op convention -- both must
    // leave session.skillName untouched).
    journey.setPipelineStateWriter(async function() {
      return { conflict: null };
    });

    var res = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res);

    // nextStage computed from the UNCHANGED 'benefit-metric' -> 'design' ->
    // the generic "create session for next stage" branch, a different
    // redirect shape than the stories-confirm one above.
    assert.ok(res._headers.Location && res._headers.Location.indexOf('/skills/design/sessions/') === 0,
      'expected the ordinary (no-conflict) redirect to reflect the UNCHANGED session.skillName (\'benefit-metric\' -> \'design\'), got Location: ' + res._headers.Location);
  });
});

queue.push(function() {
  return test('gateConfirm_leavesSessionSkillNameUnchanged_whenWriterReturnsUndefined', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    var setup = setupStageSession(journey, store, { skillName: 'benefit-metric' });

    // Matches the local-fs writer / older no-op mock convention
    // (`function() {}`), which returns undefined, not {conflict: null} --
    // confirms the `writeResult && writeResult.conflict` guard handles this
    // safely without throwing.
    journey.setPipelineStateWriter(function() {});

    var res = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res);

    assert.ok(res._headers.Location && res._headers.Location.indexOf('/skills/design/sessions/') === 0,
      'expected the ordinary redirect to still reflect the UNCHANGED session.skillName when the writer returns undefined (local-fs writer convention), got Location: ' + res._headers.Location);
  });
});

queue.push(function() {
  return test('gateConfirm_skipsCorrection_whenResolvedValueOutsideJourneyVocabulary', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    // Critical finding at this task's own independent review: pipeline-
    // state.json's own `stage` schema enum (~21 values) is far broader
    // than the web journey's own STAGE_SEQUENCE (8 outer-loop values only).
    // A conflict resolved to 'infra-plan' (a real inner-loop gate, NOT in
    // STAGE_SEQUENCE) must NOT be reassigned onto session.skillName --
    // doing so would fire infra-plan's own trace-emission guard
    // (journey.js ~line 2874) using session.infraPlanPath, a field THIS
    // session (really 'benefit-metric') never populated, fabricating an
    // audit trace record (an 'infra-plan-sign-off' event with exitCode: 0)
    // for a sign-off that never actually happened in this request.
    var setup = setupStageSession(journey, store, { skillName: 'benefit-metric' });

    journey.setPipelineStateWriter(async function() {
      return { conflict: { pipelineStateValue: 'infra-plan', journeyValue: 'benefit-metric', resolved: 'infra-plan' } };
    });

    var traceWriteCalls = [];
    journey.setWriteTrace(function(entry) { traceWriteCalls.push(entry); });

    var res = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res);

    assert.strictEqual(traceWriteCalls.length, 0,
      'expected NO trace record to be written -- this session was never really an infra-plan completion, writing one would fabricate an audit record for a sign-off that never happened. Got: ' + JSON.stringify(traceWriteCalls));

    // Correction was correctly skipped -- session.skillName stayed
    // 'benefit-metric' (unchanged), so the redirect reflects the SAME
    // outcome as the ordinary no-conflict case: getNextStage('benefit-metric')
    // -> 'design'.
    assert.ok(res._headers.Location && res._headers.Location.indexOf('/skills/design/sessions/') === 0,
      'expected the redirect to reflect the UNCHANGED session.skillName (correction skipped), got Location: ' + res._headers.Location);

    var updatedJourney = store.getJourney(setup.journeyId);
    assert.strictEqual(updatedJourney.complete, false,
      'expected the journey to NOT be marked complete -- a false completion would occur if session.skillName had been reassigned to an unmodeled value, making getNextStage() return null');
  });
});

(async function runAll() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
})();
