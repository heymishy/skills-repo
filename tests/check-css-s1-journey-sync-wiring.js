'use strict';
var assert = require('assert');
var http = require('http');
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
var internalSync = require('../src/web-ui/routes/internal-sync');
var journeyStore = require('../src/web-ui/modules/journey-store');

function startRealServer() {
  var server = http.createServer(function(req, res) {
    var u = new URL(req.url, 'http://localhost');
    if (u.pathname === '/internal/journey-sync/resolve' && req.method === 'POST') {
      internalSync.handleJourneySyncResolve(req, res);
    } else if (u.pathname === '/internal/journey-sync/update' && req.method === 'POST') {
      internalSync.handleJourneySyncUpdate(req, res);
    } else {
      res.writeHead(404); res.end();
    }
  });
  return new Promise(function(resolve) {
    server.listen(0, '127.0.0.1', function() { resolve(server); });
  });
}

queue.push(function() {
  return test('realJourneySyncTransport_wiring_resolvesTwoDifferentFeatureSlugsToTwoDifferentCorrectJourneys', function() {
    return (async function() {
      journeyStore._clearForTesting();
      var journeyA = journeyStore.createJourney('css-s1-wiring-feature-a');
      var journeyB = journeyStore.createJourney('css-s1-wiring-feature-b');

      var server = await startRealServer();
      var port = server.address().port;
      var savedUrl = process.env.INTERNAL_SYNC_URL;
      var savedSecret = process.env.INTERNAL_SYNC_SECRET;
      process.env.INTERNAL_SYNC_URL = 'http://127.0.0.1:' + port;
      process.env.INTERNAL_SYNC_SECRET = 'wiring-test-secret';

      try {
        client.setJourneySyncClient(client.realJourneySyncTransport);

        var resolvedA = await client.resolveJourneyForFeatureSlug('css-s1-wiring-feature-a');
        var resolvedB = await client.resolveJourneyForFeatureSlug('css-s1-wiring-feature-b');

        assert.ok(resolvedA, 'feature-a must resolve to a real journey');
        assert.ok(resolvedB, 'feature-b must resolve to a real journey');
        assert.strictEqual(resolvedA.journeyId, journeyA.journeyId);
        assert.strictEqual(resolvedB.journeyId, journeyB.journeyId);
        assert.notStrictEqual(resolvedA.journeyId, resolvedB.journeyId,
          'two different feature slugs must resolve to two different journey records, not the same one or a hardcoded value');
      } finally {
        process.env.INTERNAL_SYNC_URL = savedUrl;
        process.env.INTERNAL_SYNC_SECRET = savedSecret;
        server.close();
      }
    })();
  });
});

(async function() {
  console.log('\ncheck-css-s1-journey-sync-wiring.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
