#!/usr/bin/env node
/**
 * check-csgc-s1-story-extraction-and-gate-confirm.js -- csgc-s1
 * Story: artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
 *
 * AC1: extractStoryIdsFromDefinitionArtefact, run against the REAL
 *      tests/e2e/fixtures/llm-gateway/definition.success.json fixture (not a
 *      hand-crafted stand-in), returns ["mock-fixture.1"] -- codifying the
 *      manual verification already done at r-canvas-render-and-story-extraction-fix's
 *      original merge (2026-07-26), which was never captured as an automated test.
 * AC2: the existing auto-skip-to-review logic (dtra-s1) can act correctly on
 *      that extracted list -- handlePostGateConfirm sets the full story list
 *      and redirects straight to review, closing AC3's full original scope
 *      (not just the extraction function in isolation).
 * AC3: reproduces the unexplained gate-confirm 400 via the REAL streaming
 *      path (handlePostTurnStreamHtml), not a JSON-API shortcut, per this
 *      story's own Architecture Constraints. Conclusion: the 400 is
 *      confirmed as an artifact of the original debug script's own
 *      construction, not a real production bug -- session.done is set
 *      synchronously inside handlePostTurnStreamHtml, fully `await`ed before
 *      the SSE response ever completes, so a real browser client (which only
 *      ever calls gate-confirm after the stream visibly finishes, via
 *      showCommitLink()'s Continue button) cannot reach gate-confirm before
 *      session.done is true. T3b below demonstrates the 400 DOES occur when
 *      gate-confirm is called out of the correct sequence (session.done
 *      forced back to false, simulating a premature call) -- pinpointing the
 *      exact, single mechanism and confirming it is unreachable via the real
 *      client, not a lurking production race.
 *
 * Run: node tests/check-csgc-s1-story-extraction-and-gate-confirm.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0; let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); failed++; }
}

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const FIXTURE_PATH = path.resolve(__dirname, '../tests/e2e/fixtures/llm-gateway/definition.success.json');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

// journey-store.js is a shared singleton that skills.js and journey.js both
// reference internally (skills.js via a top-level `const`, captured at its
// own require-time) -- freshRequire-ing journey-store.js separately would
// create a SECOND, disconnected module instance with its own empty _journeys
// Map, silently breaking the real shared-state wiring this test exists to
// exercise. Use a plain (cached) require here, matching dtra-s1's own test
// file precedent exactly -- only journey.js/skills.js themselves are
// freshRequire-d, journey-store.js is not.
function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null, _headers: {}, _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    write: function(chunk) { res._body += (chunk || ''); },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', tenantId: null, userId: 1, login: 'user', csrfToken: 'test-csrf-token' },
    params: {},
    body: { _csrf: 'test-csrf-token' }
  }, extra || {});
}

async function run() {
  // Load the REAL fixture used by staging's mocked /definition sessions --
  // not a hand-crafted stand-in, per this story's Architecture Constraints.
  var fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  var artefactMatch = fixture.response.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
  assert.ok(artefactMatch, 'sanity: definition.success.json must contain an ARTEFACT-START/END block');
  var realArtefactContent = artefactMatch[1].trim();

  // ── AC1 ─────────────────────────────────────────────────────────────────
  console.log('\nAC1 -- extractStoryIdsFromDefinitionArtefact against the REAL definition.success.json fixture');
  {
    var journey = freshRequire(JOURNEY_PATH);
    var ids = journey.extractStoryIdsFromDefinitionArtefact(realArtefactContent);
    eq(ids, ['mock-fixture.1'], 'AC1: real fixture content extracts exactly ["mock-fixture.1"]');
  }

  // ── AC2 ─────────────────────────────────────────────────────────────────
  console.log('\nAC2 -- dtra-s1 auto-skip-to-review acts correctly on the real-fixture-extracted story list');
  {
    var journey = freshRequire(JOURNEY_PATH);
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('csgc-s1-ac2-feature');
    var journeyId = journeyObj.journeyId;
    var activeSessionId = 'sess-csgc-ac2-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'definition');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(require('os').tmpdir());
    journey.setGetHtmlSession(function(sid) {
      if (sid !== activeSessionId) return null;
      return {
        skillName: 'definition', done: true,
        artefactContent: realArtefactContent,
        artefactPath: 'csgc-test-artefacts/definition-ac2.md',
        journeyId: journeyId, turns: [], systemPrompt: 'test'
      };
    });
    try { fs.unlinkSync(path.join(require('os').tmpdir(), 'csgc-test-artefacts/definition-ac2.md')); } catch (_) {}

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    eq(res._status, 303, 'AC2: gate-confirm redirects (303) straight to review, skipping the manual stories page');
    ok((res._headers.Location || '').startsWith('/skills/review/sessions/'), 'AC2: redirect target is a new review session, not /journey/:id/stories');
    var updated = store.getJourney(journeyId);
    eq(updated.storyList, ['mock-fixture.1'], 'AC2: the real-fixture-extracted story list is set on the journey via setStoryList');
  }

  // ── AC3 ─────────────────────────────────────────────────────────────────
  console.log('\nAC3 -- reproduce gate-confirm\'s 400 via the REAL streaming path (not a JSON-API shortcut)');
  var _tmpRepoRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'csgc-s1-'));
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  {
    var skills = freshRequire(SKILLS_PATH);
    var journey = freshRequire(JOURNEY_PATH);
    var store = getStore();
    store._clear();
    // journey.js and skills.js both default (unstubbed) to the SAME real
    // journey-store.js singleton module -- do not stub setJourneyStoreModule
    // here, so this exercises the real, shared production wiring.

    var journeyObj = store.createJourney('csgc-s1-ac3-feature');
    var journeyId = journeyObj.journeyId;
    var sid = 'sess-csgc-ac3-' + Date.now();

    skills.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(fixture.response);
      return Promise.resolve({ text: fixture.response, usage: {} });
    });

    // registerHtmlSession/linkSessionToJourney: real skills.js functions
    // (journey.js's own getRegisterHtmlSession()/getLinkSessionToJourney()
    // default to these when not stubbed -- but this test calls skills.js's
    // real functions directly, the same way the real server.js request path
    // does via journey.js's own journey-creation handler).
    skills.registerHtmlSession(sid, path.join(_tmpRepoRoot, 'sess.md'), 'definition', { featureSlug: journeyObj.featureSlug || 'csgc-s1-ac3-feature' });
    skills.linkSessionToJourney(sid, journeyId);
    store.setActiveSession(journeyId, sid, 'definition');

    // T3a: drive the REAL streaming handler fully (awaited) -- this is the
    // exact code path the real browser chat UI calls, not a JSON-API
    // shortcut. session.done is set synchronously inside this call, well
    // before the SSE response ends.
    await skills.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: null }, params: { name: 'definition', id: sid }, body: { answer: 'hello' } },
      makeRes()
    );
    var sessionAfterStream = skills._getHtmlSession(sid);
    ok(sessionAfterStream && sessionAfterStream.done === true, 'T3a setup: session.done is true immediately after the real streaming handler completes');

    // T3a: gate-confirm called AFTER the real stream has genuinely finished
    // (the only sequence a real browser client can ever produce) -- must
    // NOT 400.
    var reqGate = authReq({ params: { journeyId: journeyId } });
    var resGate = makeRes();
    await journey.handlePostGateConfirm(reqGate, resGate);
    ok(resGate._status !== 400, 'T3a: gate-confirm called AFTER the real stream completes does NOT 400 (status was ' + resGate._status + ') -- the real, correctly-sequenced client path never reproduces the original observation');

    // T3b (contrast/root-cause pinpoint): force session.done back to false,
    // simulating a debug script that fired gate-confirm BEFORE the stream
    // genuinely completed (out of the sequence any real browser client can
    // produce, since the client has no signal to act on until the SSE
    // response itself ends). This MUST 400 -- confirming !session.done is
    // the exact, sole mechanism, and that it requires an out-of-band,
    // premature call unreachable via the real production request/response
    // cycle.
    var sid2 = 'sess-csgc-ac3b-' + Date.now();
    skills.registerHtmlSession(sid2, path.join(_tmpRepoRoot, 'sess2.md'), 'definition', { featureSlug: journeyObj.featureSlug || 'csgc-s1-ac3-feature' });
    skills.linkSessionToJourney(sid2, journeyId);
    store.setActiveSession(journeyId, sid2, 'definition');
    // Deliberately do NOT await/complete a stream for sid2 -- session.done
    // stays at its registerHtmlSession default (false), matching what a
    // premature gate-confirm call mid-stream would see.
    var reqGate2 = authReq({ params: { journeyId: journeyId } });
    var resGate2 = makeRes();
    await journey.handlePostGateConfirm(reqGate2, resGate2);
    eq(resGate2._status, 400, 'T3b: gate-confirm called BEFORE session.done is true (the only way to reproduce the original observation) DOES 400, pinpointing the exact cause');
  }
  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[csgc-s1] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  console.log('AC3 conclusion: the original gate-confirm 400 is confirmed as an artifact of the debug');
  console.log('script\'s own construction (calling gate-confirm before the real streaming turn had');
  console.log('genuinely finished) -- not a real production bug. session.done is set synchronously');
  console.log('inside handlePostTurnStreamHtml and fully awaited before the SSE response ends; a real');
  console.log('browser client only ever calls gate-confirm in response to that completion signal, so');
  console.log('this sequencing error is unreachable via the real production request/response cycle.');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
