'use strict';

// tests/check-jpor-s1-no-orphan-pending-journey.js
//
// jpor-s1: creating a feature must not leave an untagged placeholder journey (slug "pending") on disk.
// Story: artefacts/2026-11-21-journey-pending-orphan/stories/jpor-s1-no-orphan-pending-journey.md
// Test plan: artefacts/2026-11-21-journey-pending-orphan/test-plans/jpor-s1-test-plan.md
//
// handlePostProductFeature creates its journey with the placeholder slug "pending" (it needs the journey id to
// build a fallback slug) and then sets the real slug, tenant and product. When the disk adapter is wired,
// createJourney used to save the placeholder to workspace/journeys/pending/ at once, and the later save went to
// the real directory, leaving the untagged "pending" directory behind for every tenant's dashboard to count.
//
// T1, T2: the journey store. T3: the real handler with a recording disk adapter and a fake pool (same shape as
// tests/check-das-s2-require-connected-repo.js).
//
// Run: node tests/check-jpor-s1-no-orphan-pending-journey.js

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.stack || err)); }
  );
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var TENANT_PLAN_PATH = path.resolve(__dirname, '../src/web-ui/modules/tenant-plan.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

/** A disk adapter that records a snapshot of every journey it is asked to save. */
function recordingDisk() {
  var saves = [];
  return {
    saves: saves,
    saveJourney: function(journey) { saves.push(JSON.parse(JSON.stringify(journey))); }
  };
}

/** pg-Pool-shaped mock: the product has a connected repo, so the das-s2 gate lets the first feature through. */
function poolWithRepo(productId, tenantId) {
  return {
    query: function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') !== -1) {
        return Promise.resolve({ rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function() {
  console.log('\ncheck-jpor-s1-no-orphan-pending-journey.js');

  // AC1: with { skipDisk: true } the journey is created in memory and not saved to disk; the next field update
  // saves it once, under the real slug with its tenant and product.
  await test('T1 AC1: createJourney with skipDisk makes no disk save, setJourneyFields then saves once under the real slug', function() {
    var store = freshRequire(JOURNEY_STORE_PATH);
    store._clearForTesting();
    var disk = recordingDisk();
    store.setDiskAdapter(disk);

    var created = store.createJourney('pending', 'default', { skipDisk: true });
    assert.ok(store.getJourney(created.journeyId), 'the journey must exist in memory');
    assert.strictEqual(disk.saves.length, 0, 'no disk save at creation, got ' + JSON.stringify(disk.saves.map(function(s) { return s.featureSlug; })));

    store.setJourneyFields(created.journeyId, { featureSlug: 'real-slug', tenantId: 'tenant-t1', productId: 'prod-t1' });
    assert.strictEqual(disk.saves.length, 1, 'exactly one disk save after the field update, got ' + disk.saves.length);
    assert.strictEqual(disk.saves[0].featureSlug, 'real-slug');
    assert.strictEqual(disk.saves[0].tenantId, 'tenant-t1');
    assert.strictEqual(disk.saves[0].productId, 'prod-t1');
    store.setDiskAdapter(null);
  });

  // AC2: the default is unchanged -- every other caller still gets a disk save at creation.
  await test('T2 AC2: createJourney without the option still saves to disk once', function() {
    var store = freshRequire(JOURNEY_STORE_PATH);
    store._clearForTesting();
    var disk = recordingDisk();
    store.setDiskAdapter(disk);

    var created = store.createJourney('some-feature', 'default');
    assert.strictEqual(disk.saves.length, 1, 'one disk save at creation, got ' + disk.saves.length);
    assert.strictEqual(disk.saves[0].featureSlug, 'some-feature');
    assert.strictEqual(disk.saves[0].journeyId, created.journeyId);
    store.setDiskAdapter(null);
  });

  // AC3: the real handler never asks the disk adapter to save a "pending" journey, and saves the real one with
  // the session's tenant and the product id.
  await test('T3 AC3: handlePostProductFeature never saves a "pending" journey to disk and saves the real one', async function() {
    var store = freshRequire(JOURNEY_STORE_PATH);
    store._clearForTesting();
    var disk = recordingDisk();
    store.setDiskAdapter(disk);
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = poolWithRepo('prod-t3', 'tenant-t3');
    var req = { params: { id: 'prod-t3' }, session: { tenantId: 'tenant-t3', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    assert.ok(res._headers.Location, 'the handler must complete with a redirect, got status ' + res._status);
    var pending = disk.saves.filter(function(s) { return s.featureSlug === 'pending'; });
    assert.strictEqual(pending.length, 0, 'no journey with slug "pending" may be saved to disk, got ' + pending.length);
    var real = disk.saves.filter(function(s) { return s.featureSlug !== 'pending' && s.tenantId === 'tenant-t3' && s.productId === 'prod-t3'; });
    assert.ok(real.length >= 1, 'the real journey must be saved with its tenant and product, saves: ' + JSON.stringify(disk.saves.map(function(s) { return [s.featureSlug, s.tenantId, s.productId]; })));
    store.setDiskAdapter(null);
  });

  console.log('\n  ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
