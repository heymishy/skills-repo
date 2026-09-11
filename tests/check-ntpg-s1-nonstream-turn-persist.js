'use strict';
// check-ntpg-s1-nonstream-turn-persist.js — ntpg-s1: add the missing
// session_turns durable write to the non-streaming turn handler.
// artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
//
// Mirrors check-dsh-s1-persist-session-turns.js's own "AC1 regression" test
// shape exactly (same real-call-site pattern), targeting the sibling
// non-streaming handler (handlePostTurnHtml/htmlSubmitTurn) that dsh-s1
// itself never covered.

var assert = require('assert');
var fs     = require('fs');
var os     = require('os');
var path   = require('path');

var TURNS_MODULE_PATH   = path.resolve(__dirname, '../src/web-ui/adapters/session-turns-pg.js');
var ROUTES_PATH          = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_ROUTES_PATH  = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH   = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var JOURNEY_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

function noopRes() {
  var _statusCode = null, _headers = {}, _body = '';
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    end: function(body) { if (body != null) _body = body; },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

async function main() {
  var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ntpg-s1-'));
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var _priorDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgres://fake-for-test-only';

  var journeyStore = freshRequire(JOURNEY_STORE_PATH);
  var journeyStorePg = freshRequire(JOURNEY_STORE_PG_PATH);
  journeyStorePg.saveArtefact = function() { return Promise.resolve(); };

  var turnsMod = freshRequire(TURNS_MODULE_PATH);
  var capturedWrites = [];
  turnsMod.setSessionTurnsStore({
    query: function(sql, params) {
      capturedWrites.push(params);
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
  });

  var routes = freshRequire(ROUTES_PATH);
  var FIXTURE = 'Understood.\n\n---ARTEFACT-START---\n# Definition\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\nntpg-s1-slug';
  routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE, usage: {} }); });

  var journey = journeyStore.createJourney('ntpg-s1-slug');
  var sid = 'test-ntpg-s1-' + Math.random().toString(36).slice(2);
  routes.registerHtmlSession(sid, '/tmp/t', 'definition', { featureSlug: 'ntpg-s1-slug' });
  routes.linkSessionToJourney(sid, journey.journeyId);

  // -- AC1: the non-streaming handler now writes session_turns on completion --
  console.log('\n[ntpg-s1] AC1 -- htmlSubmitTurn (non-streaming path) writes session_turns on completion');
  await test('AC1: handlePostTurnHtml calling htmlSubmitTurn triggers writeSessionTurns with journey_id/tenant_id/skill_name', async function() {
    var req = { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'definition', id: sid }, body: { answer: 'hi' } };
    var res = noopRes();
    await routes.handlePostTurnHtml(req, res);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got ' + result.statusCode);
    assert.strictEqual(capturedWrites.length, 1, 'expected exactly one session_turns write, got ' + capturedWrites.length);
    assert.strictEqual(capturedWrites[0][0], journey.journeyId, 'expected journey_id to match');
    assert.strictEqual(capturedWrites[0][2], 'definition', 'expected skill_name to match');
  });

  // -- AC1 regression (same shape as dsh-s1's own): the completing assistant turn must be included --
  console.log('\n[ntpg-s1] AC1 regression -- persisted turns include the completing assistant turn');
  await test('AC1 regression: the persisted turns array\'s last entry is the completing assistant turn with the real response content', function() {
    var writtenTurns = JSON.parse(capturedWrites[0][3]);
    var lastTurn = writtenTurns[writtenTurns.length - 1];
    assert.strictEqual(lastTurn && lastTurn.role, 'assistant', 'expected the last persisted turn to be the completing assistant turn');
    assert.ok(lastTurn && lastTurn.content.indexOf('Understood.') !== -1, 'expected the persisted final turn to contain the real response content');
  });

  // -- AC2: a second completion (revision) upserts, does not duplicate --
  console.log('\n[ntpg-s1] AC2 -- second completion via the non-streaming path upserts, not duplicates');
  {
    var sid2 = 'test-ntpg-s1-ac2-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid2, '/tmp/t2', 'definition', { featureSlug: 'ntpg-s1-slug' });
    routes.linkSessionToJourney(sid2, journey.journeyId);
    capturedWrites.length = 0;
    await test('AC2: a second completion for the same journey/skill produces a second write (adapter itself upserts by ON CONFLICT -- confirmed at the adapter level by dsh-s1 AC2; this confirms the handler calls it again, not that it silently skips)', async function() {
      var req = { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'definition', id: sid2 }, body: { answer: 'hi again' } };
      var res = noopRes();
      await routes.handlePostTurnHtml(req, res);
      assert.strictEqual(capturedWrites.length, 1, 'expected the handler to call writeSessionTurns again on this second completion');
      assert.strictEqual(capturedWrites[0][0], journey.journeyId);
    });
  }

  // -- AC3: a failed Postgres write does not block the rest of the completion flow --
  console.log('\n[ntpg-s1] AC3 -- a failed write does not block the non-streaming completion response');
  {
    var failingTurnsMod = freshRequire(TURNS_MODULE_PATH);
    failingTurnsMod.setSessionTurnsStore({ query: function() { return Promise.reject(new Error('connection reset')); } });
    var routes3 = freshRequire(ROUTES_PATH);
    routes3.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE, usage: {} }); });
    var sid3 = 'test-ntpg-s1-ac3-' + Math.random().toString(36).slice(2);
    routes3.registerHtmlSession(sid3, '/tmp/t3', 'definition', { featureSlug: 'ntpg-s1-slug' });
    routes3.linkSessionToJourney(sid3, journey.journeyId);
    await test('AC3: handlePostTurnHtml still returns 200 even when the session_turns write rejects', async function() {
      var req = { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'definition', id: sid3 }, body: { answer: 'hi' } };
      var res = noopRes();
      await routes3.handlePostTurnHtml(req, res);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200, 'expected the completion response to succeed despite the session_turns write failing, got ' + result.statusCode);
    });
  }

  // -- AC4: end-to-end -- the chat-split read-only view now renders for a journey completed via the non-streaming path --
  console.log('\n[ntpg-s1] AC4 -- read-only stage view renders the chat-split layout for a non-streaming-completed journey');
  {
    var journeyRoutes = freshRequire(JOURNEY_ROUTES_PATH);
    journeyRoutes.setRepoRoot(_tmpRepoRoot);
    var routes4 = freshRequire(ROUTES_PATH);
    routes4.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE, usage: {} }); });
    var journey4 = journeyStore.createJourney('ntpg-s1-ac4-slug');
    var sid4 = 'test-ntpg-s1-ac4-' + Math.random().toString(36).slice(2);
    routes4.registerHtmlSession(sid4, '/tmp/t4', 'definition', { featureSlug: 'ntpg-s1-ac4-slug' });
    routes4.linkSessionToJourney(sid4, journey4.journeyId);

    var turnsMod4 = freshRequire(TURNS_MODULE_PATH);
    var realStore = {};
    turnsMod4.setSessionTurnsStore({
      query: function(sql, params) {
        if (sql.indexOf('INSERT') === 0 || sql.indexOf('INSERT') !== -1 && sql.indexOf('session_turns') !== -1 && sql.indexOf('SELECT') === -1) {
          realStore[params[0] + '::' + params[2]] = params[3];
          return Promise.resolve({ rows: [], rowCount: 1 });
        }
        var key = params[0] + '::' + params[1];
        var turns = realStore[key];
        return Promise.resolve({ rows: turns ? [{ turns: JSON.parse(turns) }] : [] });
      }
    });

    var req4 = { session: { accessToken: 'tok', tenantId: 'org-a', login: 'alice' }, params: { name: 'definition', id: sid4 }, body: { answer: 'hi' } };
    await routes4.handlePostTurnHtml(req4, noopRes());

    // handlePostTurnHtml/htmlSubmitTurn only marks session.done=true -- the
    // real production flow's separate gate-confirm step is what calls
    // journeyStore.completeStage() to record the artefact path in
    // journey.completedStages, which handleGetJourneyStageView requires to
    // find any content at all. Simulate that step directly here (mirroring
    // drh-s1's own makeCompletedJourneyFixture test helper) rather than
    // re-driving the full gate-confirm handler, which is out of this
    // story's own scope.
    var _completedSession4 = routes4._getHtmlSession(sid4);
    var _artefactRelPath4 = 'artefacts/ntpg-s1-ac4-slug/definition.md';
    fs.mkdirSync(path.dirname(path.join(_tmpRepoRoot, _artefactRelPath4)), { recursive: true });
    fs.writeFileSync(path.join(_tmpRepoRoot, _artefactRelPath4), _completedSession4.artefactContent || 'Real content.', 'utf8');
    journeyStore.completeStage(journey4.journeyId, 'definition', _artefactRelPath4, null, sid4);

    var journeyReq = { session: { accessToken: 'tok', login: 'alice' }, params: { journeyId: journey4.journeyId, stageName: 'definition' }, url: '/' };
    var journeyRes = noopRes();
    await journeyRoutes.handleGetJourneyStageView(journeyReq, journeyRes);
    var journeyResult = journeyRes._get();

    await test('AC4: the read-only stage view uses the chat-split layout (not the plain artefact fallback) after a non-streaming completion', function() {
      assert.strictEqual(journeyResult.statusCode, 200, 'expected 200, got ' + journeyResult.statusCode);
      assert.ok(journeyResult.body.indexOf('id="chat-messages"') !== -1, 'expected the chat-split view (id="chat-messages") to render, not the plain artefact fallback -- this is exactly the gap ntpg-s1 closes');
    });
  }

  delete process.env.COPILOT_REPO_PATH;
  if (_priorDatabaseUrl === undefined) { delete process.env.DATABASE_URL; }
  else { process.env.DATABASE_URL = _priorDatabaseUrl; }
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n--- ntpg-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
