'use strict';
// check-bri-s3.2-journey-response-shape.js
//
// Integration test for bri-s3.2 AC2/AC3/AC4 — verifies GET /api/journey/:id
// (handleGetJourneyState in routes/journey.js) conforms to the ADR-024
// governed response shape: turns, stages, completedStages, stage, ownerId,
// activeSkill. The bri-s3.2 Playwright spec's stage-handoff and gate-result
// assertions all read this endpoint, so its shape must be trustworthy
// independent of browser rendering (test plan: "GET /api/journey/:id response
// conforms to the ADR-024 contract").
//
// Run: node tests/check-bri-s3.2-journey-response-shape.js
// Exit 0 if all pass, exit 1 if any fail.

var assert = require('assert');
var path   = require('path');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'e2e-tester' },
    params: {}
  }, extra || {});
}

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS] ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  [PASS] ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
    return Promise.resolve();
  }
}

var REQUIRED_KEYS = ['turns', 'stages', 'completedStages', 'stage', 'ownerId', 'activeSkill'];

async function main() {
  var journey = freshRequireJourney();
  var store   = getStore();

  store._clear();
  var journeyObj = store.createJourney('bri-s3-2-shape-feature');
  var journeyId  = journeyObj.journeyId;
  store.setJourneyFields(journeyId, {
    ownerId:     'e2e-tester',
    activeSkill: 'benefit-metric'
  });
  store.completeStage(journeyId, 'discovery', 'artefacts/bri-s3-2-shape-feature/discovery.md', null);
  store.setActiveSession(journeyId, 'sid-shape-1', 'benefit-metric');

  journey.setJourneyStoreModule(store);
  journey.setGetHtmlSession(function(sid) {
    if (sid === 'sid-shape-1') {
      return { turns: [{ role: 'assistant', content: 'Begin the session.' }] };
    }
    return null;
  });

  var queue = [];

  queue.push(function() {
    return test('GET /api/journey/:id returns 200', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      assert.strictEqual(res._status, 200, 'expected 200, got ' + res._status);
    });
  });

  REQUIRED_KEYS.forEach(function(key) {
    queue.push(function() {
      return test('ADR-024 shape includes "' + key + '"', async function() {
        var req = authReq({ params: { journeyId: journeyId } });
        var res = makeRes();
        await journey.handleGetJourneyState(req, res);
        var body = JSON.parse(res._body || '{}');
        assert.ok(Object.prototype.hasOwnProperty.call(body, key), 'response body missing key: ' + key);
      });
    });
  });

  queue.push(function() {
    return test('turns is an array', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.ok(Array.isArray(body.turns), 'turns must be an array');
      assert.strictEqual(body.turns.length, 1, 'expected the seeded session turn');
    });
  });

  queue.push(function() {
    return test('completedStages is an array containing the completed discovery stage', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.ok(Array.isArray(body.completedStages), 'completedStages must be an array');
      assert.ok(body.completedStages.some(function(s) { return s.skillName === 'discovery'; }), 'expected discovery in completedStages');
    });
  });

  queue.push(function() {
    return test('stages is an array (breadcrumb)', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.ok(Array.isArray(body.stages), 'stages must be an array');
    });
  });

  queue.push(function() {
    return test('stage and activeSkill reflect the active stage', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.strictEqual(body.activeSkill, 'benefit-metric');
      assert.strictEqual(body.stage, 'benefit-metric');
    });
  });

  queue.push(function() {
    return test('ownerId reflects the journey owner (not null once set)', async function() {
      var req = authReq({ params: { journeyId: journeyId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.strictEqual(body.ownerId, 'e2e-tester');
    });
  });

  queue.push(function() {
    return test('ownerId is null (not undefined/missing) for a journey with no owner set', async function() {
      store._clear();
      var noOwnerJourney = store.createJourney('bri-s3-2-shape-no-owner');
      var noOwnerId = noOwnerJourney.journeyId;
      journey.setJourneyStoreModule(store);
      journey.setGetHtmlSession(function() { return null; });
      var req = authReq({ params: { journeyId: noOwnerId } });
      var res = makeRes();
      await journey.handleGetJourneyState(req, res);
      var body = JSON.parse(res._body || '{}');
      assert.ok(Object.prototype.hasOwnProperty.call(body, 'ownerId'), 'ownerId key must be present even when unset');
      assert.strictEqual(body.ownerId, null);
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s3.2-journey-response-shape] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(function(f) { console.error('FAILED: ' + f.name + ' -- ' + (f.err && f.err.stack || f.err)); });
    process.exit(1);
  }
  process.exit(0);
}

main();
