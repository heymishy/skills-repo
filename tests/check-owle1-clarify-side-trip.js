'use strict';
// check-owle1-clarify-side-trip.js -- owle.1: Clarify side-trip
// TDD: all tests must FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');
var os = require('os');
var fs = require('fs');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch(_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch(_) {}
  var jStore = require(JOURNEY_STORE_PATH);
  var j      = require(JOURNEY_PATH);
  return { jStore: jStore, j: j };
}

function makeRes() {
  var res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

function makeReq(overrides) {
  return Object.assign({ session: { accessToken: 'tok', login: 'user' }, params: {}, body: {}, headers: {} }, overrides);
}

function makeSessionStore() {
  var store = new Map();
  return {
    register: function(id, sessionPath, skill) {
      store.set(id, { skillName: skill, sessionPath: sessionPath, systemPrompt: 'SP-' + skill,
        turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null });
    },
    get: function(id) { return store.get(id); },
    store: store
  };
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
  } catch(err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // -- T1: clarifyAvailable flag
  console.log('\n[owle1-clarify-side-trip] T1 -- stage-controls clarifyAvailable flag');
  {
    var r = freshRequire();
    await test('T1a: clarifyAvailable=true at discovery stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-1', 'discovery');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.strictEqual(JSON.parse(res._body).clarifyAvailable, true);
    });

    await test('T1b: clarifyAvailable=false at benefit-metric stage', function() {
      var jobj = r.jStore.createJourney('feat');
      r.jStore.setActiveSession(jobj.journeyId, 'sess-2', 'benefit-metric');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 200);
      assert.ok(!JSON.parse(res._body).clarifyAvailable);
    });

    await test('T1c: 401 when unauthenticated', function() {
      var jobj = r.jStore.createJourney('feat');
      var res = makeRes();
      r.j.handleGetStageControls(makeReq({ session: {}, params: { journeyId: jobj.journeyId } }), res);
      assert.strictEqual(res._code, 401);
    });
  }

  // -- T2/T3: POST side-trip/clarify
  console.log('\n[owle1-clarify-side-trip] T2/T3 -- POST side-trip/clarify');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-'));
    var artefactDir = path.join(tmpDir, 'artefacts', 'test-feature');
    fs.mkdirSync(artefactDir, { recursive: true });
    var marker = 'DISCOVERY_MARKER_' + crypto.randomUUID();
    fs.writeFileSync(path.join(artefactDir, 'discovery.md'), '# Discovery\n\n' + marker, 'utf8');
    r.j.setRepoRoot(tmpDir);
    var sessions = makeSessionStore();
    r.j.setRegisterHtmlSession(sessions.register.bind(sessions));
    r.j.setLinkSessionToJourney(function() {});
    r.j.setGetHtmlSession(sessions.get.bind(sessions));
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'prev-sess', 'discovery');

    var res = makeRes();
    await r.j.handlePostSideTripClarify(makeReq({ params: { journeyId: jobj.journeyId } }), res);

    await test('T2a: 200 with sideTripSessionId', function() {
      assert.strictEqual(res._code, 200);
      assert.ok(JSON.parse(res._body).sideTripSessionId, 'sideTripSessionId missing');
    });

    var sid = res._body && JSON.parse(res._body).sideTripSessionId;

    await test('T2b: session systemPrompt contains discovery marker', function() {
      var session = sessions.get(sid);
      assert.ok(session, 'session not in store');
      assert.ok(session.systemPrompt.includes(marker), 'marker not in systemPrompt');
    });

    await test('T2c: session.parentJourneyId set server-side', function() {
      var session = sessions.get(sid);
      assert.strictEqual(session.parentJourneyId, jobj.journeyId);
    });

    await test('T3: parent journey activeSkill + activeSessionId unchanged', function() {
      var updated = r.jStore.getJourney(jobj.journeyId);
      assert.strictEqual(updated.activeSkill, 'discovery');
      assert.strictEqual(updated.activeSessionId, 'prev-sess');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: DELETE side-trip
  console.log('\n[owle1-clarify-side-trip] T4 -- DELETE side-trip');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-'));
    var artefactDir = path.join(tmpDir, 'artefacts', 'test-feature');
    fs.mkdirSync(artefactDir, { recursive: true });
    fs.writeFileSync(path.join(artefactDir, 'discovery.md'), '# Discovery', 'utf8');
    r.j.setRepoRoot(tmpDir);
    var sessions = makeSessionStore();
    r.j.setRegisterHtmlSession(sessions.register.bind(sessions));
    r.j.setLinkSessionToJourney(function() {});
    r.j.setGetHtmlSession(sessions.get.bind(sessions));
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'prev-sess', 'discovery');

    var openRes = makeRes();
    await r.j.handlePostSideTripClarify(makeReq({ params: { journeyId: jobj.journeyId } }), openRes);
    var sid = JSON.parse(openRes._body).sideTripSessionId;

    var delRes = makeRes();
    await r.j.handleDeleteSideTrip(makeReq({ params: { journeyId: jobj.journeyId } }), delRes);

    await test('T4a: DELETE returns 200', function() { assert.strictEqual(delRes._code, 200); });
    await test('T4b: side-trip session marked closed (done=true)', function() {
      var session = sessions.get(sid);
      assert.ok(session, 'session not found');
      assert.strictEqual(session.done, true);
    });
    await test('T4c: parent journey still at discovery', function() {
      var updated = r.jStore.getJourney(jobj.journeyId);
      assert.ok(updated); assert.strictEqual(updated.activeSkill, 'discovery');
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: path traversal guard
  console.log('\n[owle1-clarify-side-trip] T5 -- path traversal guard');
  {
    var r = freshRequire();
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-'));
    r.j.setRepoRoot(tmpDir);
    var sessions = makeSessionStore();
    r.j.setRegisterHtmlSession(sessions.register.bind(sessions));
    r.j.setLinkSessionToJourney(function() {});
    r.j.setGetHtmlSession(sessions.get.bind(sessions));
    var jobj = r.jStore.createJourney('../../../etc');
    r.jStore.setActiveSession(jobj.journeyId, 'prev', 'discovery');
    var res = makeRes();
    await r.j.handlePostSideTripClarify(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T5: path traversal slug returns 400', function() { assert.strictEqual(res._code, 400); });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: GET journey state excludes side-trip
  console.log('\n[owle1-clarify-side-trip] T6 -- GET journey state excludes side-trip');
  {
    var r = freshRequire();
    var jobj = r.jStore.createJourney('test-feature');
    r.jStore.setActiveSession(jobj.journeyId, 'prev-sess', 'discovery');
    r.jStore.getJourney(jobj.journeyId).sideTripSessionId = 'some-side-trip-sid';
    var res = makeRes();
    r.j.handleGetJourneyState(makeReq({ params: { journeyId: jobj.journeyId } }), res);
    await test('T6a: returns 200', function() { assert.strictEqual(res._code, 200); });
    await test('T6b: sideTripSessionId absent from response', function() {
      assert.ok(!('sideTripSessionId' in JSON.parse(res._body)), 'sideTripSessionId must be omitted');
    });
    await test('T6c: activeSkill=discovery in response', function() {
      assert.strictEqual(JSON.parse(res._body).activeSkill, 'discovery');
    });
  }

  // -- Results
  console.log('\n[owle1-clarify-side-trip] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
