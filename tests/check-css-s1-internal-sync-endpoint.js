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

var internalSync = require('../src/web-ui/routes/internal-sync');
var journeyStore = require('../src/web-ui/modules/journey-store');
var exportDataSource = require('../src/web-ui/adapters/export-data-source');

function makeRes() {
  var res = { _status: null, _headers: {}, _body: null };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body = body; };
  return res;
}
function makeReq(body) {
  return { headers: {}, body: body };
}
function withSyncSecret(secret, fn) {
  var saved = process.env.INTERNAL_SYNC_SECRET;
  process.env.INTERNAL_SYNC_SECRET = secret;
  return Promise.resolve().then(fn).finally(function() {
    if (saved === undefined) delete process.env.INTERNAL_SYNC_SECRET;
    else process.env.INTERNAL_SYNC_SECRET = saved;
  });
}

queue.push(function() {
  return test('internalEndpoint_rejectsRequest_withMissingOrIncorrectCredential', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var queried = false;
      exportDataSource.setDbPool({ query: async function() { queried = true; return { rows: [] }; } });

      var reqMissing = makeReq({ featureSlug: 'any' });
      var resMissing = makeRes();
      await internalSync.handleJourneySyncResolve(reqMissing, resMissing);
      assert.strictEqual(resMissing._status, 403);

      var reqWrong = makeReq({ featureSlug: 'any' });
      reqWrong.headers['x-internal-sync-secret'] = 'wrong-secret';
      var resWrong = makeRes();
      await internalSync.handleJourneySyncResolve(reqWrong, resWrong);
      assert.strictEqual(resWrong._status, 403);

      assert.strictEqual(queried, false, 'the endpoint must never reach the Postgres client when the credential check fails');
    });
  });
});

queue.push(function() {
  return test('internalEndpoint_acceptsRequest_withCorrectCredential', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var journey = journeyStore.createJourney('css-s1-fixture-feature');
      journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-1', productId: 'product-1' });
      exportDataSource.setDbPool({ query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } });

      var req = makeReq({ featureSlug: 'css-s1-fixture-feature' });
      req.headers['x-internal-sync-secret'] = 'right-secret';
      var res = makeRes();
      await internalSync.handleJourneySyncResolve(req, res);

      assert.strictEqual(res._status, 200);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.found, true);
      assert.strictEqual(body.journey.repoOwner, 'acme');
      assert.strictEqual(body.journey.repoName, 'widgets');
    });
  });
});

queue.push(function() {
  return test('handleJourneySyncResolve_returnsNotFound_whenNoJourneyMatchesSlug', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var req = makeReq({ featureSlug: 'no-such-feature' });
      req.headers['x-internal-sync-secret'] = 'right-secret';
      var res = makeRes();
      await internalSync.handleJourneySyncResolve(req, res);
      assert.strictEqual(res._status, 200);
      assert.deepStrictEqual(JSON.parse(res._body), { found: false });
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-internal-sync-endpoint.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
