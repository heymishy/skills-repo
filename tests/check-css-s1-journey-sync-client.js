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

// --- AC1/AC3/AC4 + NFR-Audit/Security: syncGateAdvanceToJourney -------------

queue.push(function() {
  return test('syncGateAdvanceToJourney_updatesCompletedStages_forDiscoveryApprovedGate', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = [];
      client.setJourneySyncClient(async function(op, payload) { calls.push({ op: op, payload: payload }); return { updated: true }; });
      var journey = { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(journey, 'discovery-approved');
      assert.strictEqual(calls.length, 1, 'exactly one write-request call expected');
      assert.strictEqual(calls[0].op, 'update');
      assert.strictEqual(calls[0].payload.journeyId, 'j1');
      assert.strictEqual(calls[0].payload.stage, 'discovery');
    });
  });
});

queue.push(function() {
  return test('syncGateAdvanceToJourney_doesNotAttemptSync_forNonDiscoveryApprovedGate', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { updated: true }; });
      var journey = { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(journey, 'test-plan-complete');
      assert.strictEqual(calls, 0, 'no sync attempt should be made for a gate other than discovery-approved');
    });
  });
});

queue.push(function() {
  return test('syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { updated: true }; });
      var warnings = [];
      client.setLogger({ info: function() {}, warn: function(event, data) { warnings.push({ event: event, data: data }); } });
      // This journey resolves to a DIFFERENT repo than this CLI's own
      // (process.env.GITHUB_REPO_OWNER/NAME above) -- a cross-repo slug
      // coincidence, not the same feature.
      var journey = { journeyId: 'j2', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(journey, 'discovery-approved');
      assert.strictEqual(calls, 0, 'no write call should be made on a repo mismatch');
      assert.strictEqual(warnings.length, 1, 'exactly one mismatch log entry expected');
      assert.strictEqual(warnings[0].data.featureSlug, 'test-feature');
      assert.strictEqual(warnings[0].data.journeyId, 'j2');
    });
  });
});

queue.push(function() {
  return test('syncLogEntries_containNoCredentialOrTokenFields', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets', INTERNAL_SYNC_SECRET: 'super-secret-value' }, async function() {
      var logged = [];
      client.setLogger({ info: function(event, data) { logged.push(data); }, warn: function(event, data) { logged.push(data); } });
      client.setJourneySyncClient(async function() { return { updated: true }; });

      var mismatchJourney = { journeyId: 'j3', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(mismatchJourney, 'discovery-approved');

      var okJourney = { journeyId: 'j4', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(okJourney, 'discovery-approved');

      var serialised = JSON.stringify(logged);
      assert.ok(!serialised.includes('super-secret-value'), 'no log entry may contain the sync secret value');
      assert.ok(!/accessToken|Authorization/i.test(serialised), 'no log entry may contain a token-like field name');
    });
  });
});

queue.push(function() {
  return test('syncAttempts_areLoggedForBothSuccessAndMismatchCases', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var infoCount = 0; var warnCount = 0;
      client.setLogger({ info: function() { infoCount++; }, warn: function() { warnCount++; } });
      client.setJourneySyncClient(async function() { return { updated: true }; });

      var okJourney = { journeyId: 'j5', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(okJourney, 'discovery-approved');
      assert.strictEqual(infoCount, 1, 'exactly one success log entry expected');

      var mismatchJourney = { journeyId: 'j6', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(mismatchJourney, 'discovery-approved');
      assert.strictEqual(warnCount, 1, 'exactly one mismatch log entry expected');

      var boundaryJourney = { journeyId: 'j7', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(boundaryJourney, 'test-plan-complete');
      assert.strictEqual(infoCount, 1, 'the AC4 boundary case (wrong gate) must log nothing -- there was no attempt to log');
      assert.strictEqual(warnCount, 1);
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
