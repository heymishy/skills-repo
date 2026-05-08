'use strict';
// check-wsm2-collaborative-sessions.js — wsm.2: shareable journeys + viewer sync
// TDD: all tests must FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SKILLS_PATH        = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

function makeRes() {
  var res = { _code: null, _body: '', _headers: {}, _chunks: [] };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  res.write = function(chunk) { res._chunks.push(chunk); };
  return res;
}

function makeReq(opts) {
  return Object.assign({ method: 'GET', headers: {}, body: {}, params: {}, session: {} }, opts || {});
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
        function(err) {
          failed++;
          failures.push({ name, err });
          console.log('  [FAIL]', name, '--', err && err.message || err);
        }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // T1 — unauthenticated user is redirected from shared journey URL
  console.log('\n[wsm2] T1 -- unauthenticated GET /journey/:id → 302');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var jid = store.createJourney('test-feature').journeyId;
    var req = makeReq({ session: {}, params: { journeyId: jid } });
    var res = makeRes();

    await test('T1a: handleGetJourneyById exists', function() {
      assert.strictEqual(typeof j.handleGetJourneyById, 'function', 'handleGetJourneyById not exported');
    });

    if (typeof j.handleGetJourneyById === 'function') {
      j.handleGetJourneyById(req, res);
      await test('T1b: 302 redirect', function() {
        assert.strictEqual(res._code, 302, 'Expected 302, got ' + res._code);
      });
      await test('T1c: redirects to auth', function() {
        assert.ok(res._headers.Location && res._headers.Location.includes('/auth'), 'Expected redirect to /auth, got ' + res._headers.Location);
      });
    }
  }

  // T2 — authenticated viewer can load journey state
  console.log('\n[wsm2] T2 -- authenticated viewer GET /api/journey/:id → 200 with turns + stage');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);

    // Wire no-op injected adapters for skills
    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });
    skills.setSkillTurnExecutorAdapter(async function() { return 'model answer'; });
    j.setJourneyStoreModule(store);
    j.setGetHtmlSession(function(id) { return skills._getHtmlSession(id); });

    var jid = store.createJourney('test-f2').journeyId;
    var sid = crypto.randomUUID();
    skills._setHtmlSession(sid, {
      skillName: 'discovery', turns: [
        { role: 'assistant', content: 'Tell me about your goal.' },
        { role: 'user', content: 'Build something great.' },
        { role: 'assistant', content: 'Great — what is the audience?' }
      ],
      systemPrompt: 'SP', journeyId: jid, done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.activeSessionId = sid;

    var req = makeReq({ session: { accessToken: 'tok', login: 'user-B' }, params: { journeyId: jid } });
    var res = makeRes();

    await test('T2a: handleGetJourneyState exists', function() {
      assert.strictEqual(typeof j.handleGetJourneyState, 'function', 'handleGetJourneyState not exported');
    });

    if (typeof j.handleGetJourneyState === 'function') {
      await j.handleGetJourneyState(req, res);
      await test('T2b: 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T2c: response has turns', function() {
        var data = JSON.parse(res._body);
        assert.ok(Array.isArray(data.turns), 'turns not an array');
        assert.ok(data.turns.length >= 3, 'Expected >= 3 turns');
      });
      await test('T2d: response has stage', function() {
        var data = JSON.parse(res._body);
        assert.ok(typeof data.stage === 'string', 'stage not a string');
      });
    }
  }

  // T3 — viewer cannot submit a turn (403)
  console.log('\n[wsm2] T3 -- non-owner POST turn → 403');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);

    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });
    skills.setSkillTurnExecutorAdapter(async function() { return 'model response'; });

    var jid = store.createJourney('test-f3').journeyId;
    var sid = crypto.randomUUID();
    skills._setHtmlSession(sid, {
      skillName: 'discovery', turns: [], systemPrompt: 'SP',
      journeyId: jid, done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';

    // user-B tries to post a turn
    var req = makeReq({
      session: { accessToken: 'tok', login: 'user-B' },
      params: { name: 'discovery', id: sid },
      body: { answer: 'sneaky answer' }
    });
    req.on = function() {}; // noop for readBody
    var res = makeRes();

    await test('T3a: handlePostTurnHtml available', function() {
      assert.strictEqual(typeof skills.handlePostTurnHtml, 'function', 'handlePostTurnHtml not exported');
    });

    if (typeof skills.handlePostTurnHtml === 'function') {
      // Stub _readBody to return immediately
      var origOn = req.on;
      req.on = function(event, cb) { if (event === 'end') cb(); };
      await skills.handlePostTurnHtml(req, res);
      req.on = origOn;

      await test('T3b: returns 403', function() {
        assert.strictEqual(res._code, 403, 'Expected 403, got ' + res._code);
      });
      await test('T3c: turn not added to session', function() {
        var sess = skills._getHtmlSession(sid);
        assert.strictEqual(sess.turns.length, 0, 'turn was added despite 403');
      });
    }
  }

  // T4 — owner's new turn is visible to viewer immediately (polling)
  console.log('\n[wsm2] T4 -- owner submits turn → viewer GET immediately reflects new turn');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);

    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });
    skills.setSkillTurnExecutorAdapter(async function() { return 'response from model'; });
    j.setJourneyStoreModule(store);
    j.setGetHtmlSession(function(id) { return skills._getHtmlSession(id); });

    var jid = store.createJourney('test-f4').journeyId;
    var sid = crypto.randomUUID();
    skills._setHtmlSession(sid, {
      skillName: 'discovery', turns: [], systemPrompt: 'SP',
      journeyId: jid, done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.activeSessionId = sid;

    // Owner submits a turn
    var turnReq = makeReq({
      session: { accessToken: 'tok', login: 'user-A' },
      params: { name: 'discovery', id: sid },
      body: {}
    });
    turnReq.on = function(event, cb) { if (event === 'end') cb(); };
    var turnRes = makeRes();
    await skills.handlePostTurnHtml(turnReq, turnRes);

    // Viewer polls state
    var viewReq = makeReq({ session: { accessToken: 'tok', login: 'user-B' }, params: { journeyId: jid } });
    var viewRes = makeRes();
    await j.handleGetJourneyState(viewReq, viewRes);

    await test('T4a: viewer GET returns 200', function() {
      assert.strictEqual(viewRes._code, 200, 'Expected 200, got ' + viewRes._code);
    });
    await test('T4b: viewer sees the owner\'s new turn', function() {
      var data = JSON.parse(viewRes._body);
      assert.ok(Array.isArray(data.turns) && data.turns.length >= 1, 'viewer sees no turns');
    });
  }

  // T5 — user count updates when second user opens journey
  console.log('\n[wsm2] T5 -- active user count tracks connections');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);

    j.setJourneyStoreModule(store);

    var jid = store.createJourney('test-f5').journeyId;
    var sid = crypto.randomUUID();
    j.setGetHtmlSession(function() { return { skillName: 'discovery', turns: [], journeyId: jid, done: false }; });

    store.getJourney(jid).activeSessionId = sid;

    // Simulate two users connecting via state endpoint
    var now1 = 1000;
    j.setNow(function() { return now1; });

    var req1 = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
    var res1 = makeRes();
    await j.handleGetJourneyState(req1, res1);

    var req2 = makeReq({ session: { accessToken: 'tok', login: 'user-B' }, params: { journeyId: jid } });
    var res2 = makeRes();
    await j.handleGetJourneyState(req2, res2);

    await test('T5a: handleGetJourneyViewers exists', function() {
      assert.strictEqual(typeof j.handleGetJourneyViewers, 'function', 'handleGetJourneyViewers not exported');
    });

    if (typeof j.handleGetJourneyViewers === 'function') {
      var vReq = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
      var vRes = makeRes();
      await j.handleGetJourneyViewers(vReq, vRes);

      await test('T5b: count is 2 while both connected', function() {
        var data = JSON.parse(vRes._body);
        assert.strictEqual(data.count, 2, 'Expected 2, got ' + data.count);
      });

      // Simulate 31s passing (user-B inactive)
      j.setNow(function() { return now1 + 31000; });

      // user-A re-polls (refreshes their activity)
      var reReq1 = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
      var reRes1 = makeRes();
      await j.handleGetJourneyState(reReq1, reRes1);

      var vReq2 = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
      var vRes2 = makeRes();
      await j.handleGetJourneyViewers(vReq2, vRes2);

      await test('T5c: count drops to 1 after user-B timeout', function() {
        var data = JSON.parse(vRes2._body);
        assert.strictEqual(data.count, 1, 'Expected 1 after timeout, got ' + data.count);
      });
    }

    // Reset clock
    j.setNow(function() { return Date.now(); });
  }

  // T6 — concurrent turn attempt returns 409
  console.log('\n[wsm2] T6 -- concurrent turn → 409');
  {
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);

    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });

    var jid = store.createJourney('test-f6').journeyId;
    var sid = crypto.randomUUID();
    skills._setHtmlSession(sid, {
      skillName: 'discovery', turns: [], systemPrompt: 'SP',
      journeyId: jid, done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.turnInProgress = true; // Simulate turn already in progress

    var req = makeReq({
      session: { accessToken: 'tok', login: 'user-A' },
      params: { name: 'discovery', id: sid },
      body: {}
    });
    req.on = function(event, cb) { if (event === 'end') cb(); };
    var res = makeRes();

    await skills.handlePostTurnHtml(req, res);

    await test('T6a: returns 409', function() {
      assert.strictEqual(res._code, 409, 'Expected 409, got ' + res._code);
    });
    await test('T6b: error message mentions "in progress"', function() {
      var body = res._body ? JSON.parse(res._body) : {};
      assert.ok(body.error && body.error.toLowerCase().includes('progress'), 'Error message: ' + body.error);
    });
  }

  // T7 — journey survives 30-minute idle
  console.log('\n[wsm2] T7 -- 30-minute idle: journey status → idle, still accessible');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);

    var jid = store.createJourney('test-f7').journeyId;
    var journey = store.getJourney(jid);
    journey.lastActivityAt = 0; // Very old timestamp

    // Set clock to 31 minutes from "epoch" (much older than threshold)
    j.setNow(function() { return 31 * 60 * 1000; });

    await test('T7a: checkJourneyIdle exported', function() {
      assert.strictEqual(typeof j.checkJourneyIdle, 'function', 'checkJourneyIdle not exported');
    });

    if (typeof j.checkJourneyIdle === 'function') {
      j.checkJourneyIdle(jid);

      await test('T7b: journey status is idle', function() {
        var j2 = store.getJourney(jid);
        assert.strictEqual(j2.status, 'idle', 'Expected status:idle, got ' + j2.status);
      });

      await test('T7c: journey still retrievable via GET', function() {
        j.setGetHtmlSession(function() { return { turns: [], journeyId: jid }; });
        var req = makeReq({ session: { accessToken: 'tok', login: 'user-X' }, params: { journeyId: jid } });
        var res = makeRes();
        return j.handleGetJourneyState(req, res).then(function() {
          assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
        });
      });
    }

    j.setNow(function() { return Date.now(); });
  }

  // T8 — ownerId in request body is ignored; ownership from session only
  console.log('\n[wsm2] T8 -- spoofed ownerId in body ignored; ownership from session only → 403');
  {
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);

    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });
    skills.setSkillTurnExecutorAdapter(async function() { return 'response'; });

    var jid = store.createJourney('test-f8').journeyId;
    var sid = crypto.randomUUID();
    skills._setHtmlSession(sid, {
      skillName: 'discovery', turns: [], systemPrompt: 'SP',
      journeyId: jid, done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';

    // user-B sends body with ownerId:'user-A' (attempted spoof)
    var req = makeReq({
      session: { accessToken: 'tok', login: 'user-B' },
      params: { name: 'discovery', id: sid },
      body: { ownerId: 'user-A', answer: 'legitimate-looking answer' }
    });
    req.on = function(event, cb) { if (event === 'end') cb(); };
    var res = makeRes();
    await skills.handlePostTurnHtml(req, res);

    await test('T8a: returns 403 (not 200 despite spoofed body)', function() {
      assert.strictEqual(res._code, 403, 'Expected 403, got ' + res._code);
    });
    await test('T8b: turn not added to session', function() {
      var sess = skills._getHtmlSession(sid);
      assert.strictEqual(sess.turns.length, 0, 'Turn was added — spoof succeeded!');
    });
  }

  // Summary
  console.log('\n=== wsm2 results:', passed, 'passed,', failed, 'failed ===');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAILED:', f.name, '--', f.err && f.err.message || f.err); });
    process.exit(1);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
