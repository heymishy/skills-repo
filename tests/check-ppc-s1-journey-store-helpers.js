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
  return test('getJourneyForTenantProductSlug: scoped by BOTH tenant_id and product_id, not slug alone', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('duplicate-slug');
    store.setJourneyFields(a.journeyId, { tenantId: 'tenant-a', productId: 'product-a' });
    var b = store.createJourney('duplicate-slug');
    store.setJourneyFields(b.journeyId, { tenantId: 'tenant-b', productId: 'product-b' });

    var found = store.getJourneyForTenantProductSlug('tenant-a', 'product-a', 'duplicate-slug');
    assert.strictEqual(found.journeyId, a.journeyId);

    var notFound = store.getJourneyForTenantProductSlug('tenant-a', 'product-b', 'duplicate-slug');
    assert.strictEqual(notFound, null);
  });
});

queue.push(function() {
  return test('getJourneyForTenantProductSlug: returns null when tenantId or productId is missing (never a false-positive null==null match)', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('no-tenant-slug'); // tenantId/productId never set
    assert.strictEqual(store.getJourneyForTenantProductSlug(null, null, 'no-tenant-slug'), null);
    assert.strictEqual(store.getJourneyForTenantProductSlug(undefined, undefined, 'no-tenant-slug'), null);
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
