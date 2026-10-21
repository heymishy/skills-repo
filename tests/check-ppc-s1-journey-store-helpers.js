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

queue.push(function() {
  return test('captureAcScreenshots is importable from src/ (deployed), not just scripts/', function() {
    var fromSrc = require('../src/utils/capture-screenshots');
    assert.strictEqual(typeof fromSrc.captureAcScreenshots, 'function');
  });
});

queue.push(function() {
  return test('isDodComplete: true when completedStages has a definition-of-done entry', function() {
    var store = require('../src/web-ui/modules/journey-store');
    var complete = { completedStages: [{ skillName: 'definition-of-done', artefactPath: 'x', completedAt: 'now' }] };
    var incomplete = { completedStages: [{ skillName: 'test-plan', artefactPath: 'x', completedAt: 'now' }] };
    assert.strictEqual(store.isDodComplete(complete), true);
    assert.strictEqual(store.isDodComplete(incomplete), false);
  });
});

queue.push(function() {
  return test('getCaptureTargetState: returns NOT_SET for an AC with no stored target, the stored target otherwise', function() {
    var store = require('../src/web-ui/modules/journey-store');
    var targets = [{ acId: 'AC1', url: 'http://x', selector: '#y' }];
    assert.strictEqual(store.getCaptureTargetState(targets, 'AC2'), store.CAPTURE_TARGET_NOT_SET);
    assert.deepStrictEqual(store.getCaptureTargetState(targets, 'AC1'), { acId: 'AC1', url: 'http://x', selector: '#y' });
  });
});

queue.push(function() {
  return test('getJourneyByTenantProductSlug: scoped by BOTH tenant_id and product_id, not slug alone', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('duplicate-slug');
    store.setJourneyFields(a.journeyId, { tenantId: 'tenant-a', productId: 'product-a' });
    var b = store.createJourney('duplicate-slug');
    store.setJourneyFields(b.journeyId, { tenantId: 'tenant-b', productId: 'product-b' });

    var found = store.getJourneyByTenantProductSlug('tenant-a', 'product-a', 'duplicate-slug');
    assert.strictEqual(found.journeyId, a.journeyId);

    var notFound = store.getJourneyByTenantProductSlug('tenant-a', 'product-b', 'duplicate-slug');
    assert.strictEqual(notFound, null);
  });
});

queue.push(function() {
  return test('getJourneyByTenantProductSlug: returns null when tenantId or productId is missing (never a false-positive null==null match)', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('no-tenant-slug'); // tenantId/productId never set
    assert.strictEqual(store.getJourneyByTenantProductSlug(null, null, 'no-tenant-slug'), null);
    assert.strictEqual(store.getJourneyByTenantProductSlug(undefined, undefined, 'no-tenant-slug'), null);
  });
});

queue.push(function() {
  return test('setCaptureTarget: stores a new target, and replaces (not duplicates) an existing one for the same acId', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var j = store.createJourney('target-test-slug');

    store.setCaptureTarget(j.journeyId, 'AC1', 'http://x/1', '#sel1');
    var after1 = store.getJourney(j.journeyId);
    assert.strictEqual(after1.captureTargets.length, 1);
    assert.deepStrictEqual(after1.captureTargets[0], { acId: 'AC1', url: 'http://x/1', selector: '#sel1' });

    store.setCaptureTarget(j.journeyId, 'AC1', 'http://x/2', '#sel2');
    var after2 = store.getJourney(j.journeyId);
    assert.strictEqual(after2.captureTargets.length, 1, 'must replace, not duplicate');
    assert.deepStrictEqual(after2.captureTargets[0], { acId: 'AC1', url: 'http://x/2', selector: '#sel2' });
  });
});

queue.push(function() {
  return test('journey-store-pg _sanitise: captureTargets survives the Postgres allowlist (fdn-s1 regression)', function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/journey-store-pg')];
    var pg = require('../src/web-ui/adapters/journey-store-pg');
    var calls = [];
    pg._setPoolForTesting({ query: async function(sql, params) { calls.push(params); return { rows: [] }; } });
    var journey = {
      journeyId: 'j1', featureSlug: 's1', completedStages: [],
      captureTargets: [{ acId: 'AC1', url: 'http://x', selector: '#y' }]
    };
    return pg.saveJourney(journey).then(function() {
      // Find the JSON data blob by shape, not by a hardcoded positional
      // index -- this params array has already grown once before (jrf-s2
      // added product_id), so a bare index would silently misread the
      // wrong param if it grows again.
      var dataJson = calls[0].find(function(p) { return typeof p === 'string' && p.trim().startsWith('{'); });
      assert.ok(dataJson, 'expected to find a JSON-shaped string param in the query call');
      var data = JSON.parse(dataJson);
      assert.deepStrictEqual(data.captureTargets, [{ acId: 'AC1', url: 'http://x', selector: '#y' }]);
    });
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-journey-store-helpers.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
