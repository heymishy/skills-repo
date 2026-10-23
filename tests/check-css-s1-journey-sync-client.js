'use strict';
var assert = require('assert');
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
var queue = [];

var client = require('../src/sync/journey-sync-client');

function withEnv(vars, fn) {
  var saved = {};
  Object.keys(vars).forEach(function(k) {
    saved[k] = process.env[k];
    if (vars[k] === null) delete process.env[k];
    else process.env[k] = vars[k];
  });
  return Promise.resolve().then(fn).finally(function() {
    Object.keys(saved).forEach(function(k) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });
}

queue.push(function() {
  return test('journeySyncClient_callsInternalEndpoint_withServiceCredential', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake-internal-sync.test', INTERNAL_SYNC_SECRET: 'test-secret' }, async function() {
      var calls = [];
      client.setJourneySyncClient(async function(op, payload) {
        calls.push({ op: op, payload: payload });
        return { found: true, journey: { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' } };
      });
      var journey = await client.resolveJourneyForFeatureSlug('test-feature');
      assert.strictEqual(calls.length, 1, 'exactly one transport call expected');
      assert.strictEqual(calls[0].op, 'resolve');
      assert.strictEqual(calls[0].payload.featureSlug, 'test-feature');
      assert.strictEqual(journey.journeyId, 'j1');
      assert.strictEqual(journey.featureSlug, 'test-feature');
    });
  });
});

queue.push(function() {
  return test('journeySyncClient_returnsNull_whenEndpointReportsNoJourney', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake-internal-sync.test', INTERNAL_SYNC_SECRET: 'test-secret' }, async function() {
      client.setJourneySyncClient(async function() { return { found: false }; });
      var journey = await client.resolveJourneyForFeatureSlug('no-such-feature');
      assert.strictEqual(journey, null);
    });
  });
});

queue.push(function() {
  return test('journeySyncClient_noOps_whenSyncEnvNotConfigured', function() {
    return withEnv({ INTERNAL_SYNC_URL: null, INTERNAL_SYNC_SECRET: null }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { found: false }; });
      var journey = await client.resolveJourneyForFeatureSlug('any-feature');
      assert.strictEqual(journey, null);
      assert.strictEqual(calls, 0, 'no HTTP call should be attempted when sync env is not configured');
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-journey-sync-client.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
