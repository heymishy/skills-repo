'use strict';
// check-css-s2-gate-confirm-sync-log-integration.js
// Integration test for css-s2: when the already-wired pipeline-state writer
// fails (its own internal retries already exhausted -- that retry behaviour
// is wsd-s2's own, already tested), stage completion still succeeds for the
// operator (das-s1's artefact commit is unaffected, no 502), and a sync_log
// gap entry is written. Reuses acdg-s2's proven fixture pattern
// (setupStageSession / authReq / makeRes).
//
// Covers AC3 (integration half) per the revised css-s2-test-plan.md.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var SYNC_LOG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/sync-log.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}
function getStore() { return require(JOURNEY_STORE_PATH); }
function getSyncLog() { return require(SYNC_LOG_PATH); }

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
    session: { accessToken: 'test-token', userId: 1, login: 'user', csrfToken: 'test-csrf-token', tenantId: 'tenant-css-s2' },
    params: {},
    body: { _csrf: 'test-csrf-token' }
  }, extra || {});
}

var tmpRoot = path.join(os.tmpdir(), 'css-s2-tests-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

function setupStageSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || ('test-feature-css-s2-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var skillName = opts.skillName || 'review';
  var artefactRelPath = opts.artefactRelPath || ('artefacts/' + featureSlug + '/' + skillName + '.md');
  var artefactContent = opts.artefactContent || ('# ' + skillName + ' artefact for ' + featureSlug);

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  var sid = 'sid-css-s2-' + Date.now() + '-' + Math.random();
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

function makeFakePool() {
  var calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      return { rows: [] };
    }
  };
}

var queue = [];

queue.push(function() {
  return test('stageCompletionRequest_succeedsForOperator_andLogsGap_whenPipelineStateWriteFails', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var syncLog = getSyncLog();

    var setup = setupStageSession(journey, store, {});

    // Simulates wsd-s2's own internal retries having already been exhausted
    // inside the writer -- that retry behaviour is already tested in
    // tests/check-wsd-s2-github-pipeline-state-writer.js; this test is about
    // what happens AFTER that failure reaches journey.js's own catch block.
    journey.setPipelineStateWriter(function() {
      return Promise.reject(new Error('simulated: pipeline-state write retries exhausted'));
    });

    var fakePool = makeFakePool();
    syncLog._setPoolForTesting(fakePool);
    var origDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://fake-test-value-never-connected';

    try {
      var res = makeRes();
      await journey.handlePostGateConfirm(authReq({ params: { journeyId: setup.journeyId } }), res);

      assert.ok(res._status === null || res._status < 400, 'stage completion must succeed even when the pipeline-state write fails, got status ' + res._status);

      var gapCall = fakePool.calls.find(function(c) {
        var sqlUpper = String(c.sql).replace(/\s+/g, ' ').trim().toUpperCase();
        return sqlUpper.indexOf('INSERT') === 0 && sqlUpper.indexOf('SYNC_LOG') !== -1;
      });
      assert.ok(gapCall, 'expected a sync_log gap-entry INSERT to have been written');
      assert.ok(gapCall.params.indexOf(setup.featureSlug) !== -1, 'expected the gap entry to reference this journey\'s own feature slug');
      assert.ok(gapCall.params.indexOf('gap') !== -1, "expected entry_type='gap'");
    } finally {
      if (origDbUrl === undefined) { delete process.env.DATABASE_URL; } else { process.env.DATABASE_URL = origDbUrl; }
    }
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
