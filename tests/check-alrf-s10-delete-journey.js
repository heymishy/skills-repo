'use strict';
// check-alrf-s10-delete-journey.js -- alrf-s10: DELETE /api/journey/:journeyId
// Operator-requested: a real way to delete stale/corrupted staging data (e.g.
// a feature whose artefacts were mis-recorded under another feature's slug
// before alrf-s8's fix landed). Hard delete, wuce-side data only, tenant-scoped.

var assert = require('assert');
var path   = require('path');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var FEATURES_PATH      = path.resolve(__dirname, '../src/web-ui/routes/features.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

function makeRes() {
  var res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'user', tenantId: 'tenant-a', csrfToken: 'real-csrf-token' },
    params: {}, body: {}, headers: {}
  }, overrides);
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
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {
  // -- AC1: real journey, matching tenant, valid CSRF -> 200 deleted:true, removed from store
  console.log('\n[alrf-s10] AC1 -- deletes a journey belonging to the requesting tenant');
  {
    var jStore = freshRequire(JOURNEY_STORE_PATH);
    var j      = freshRequire(JOURNEY_PATH);
    jStore._clear();
    var journey = jStore.createJourney('alrf-s10-feature-a');
    jStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a' });

    var req = makeReq({ params: { journeyId: journey.journeyId }, body: { _csrf: 'real-csrf-token' } });
    var res = makeRes();
    await test('AC1a: handleDeleteJourney returns 200', async function() {
      await j.handleDeleteJourney(req, res);
      assert.strictEqual(res._code, 200, 'expected 200, got ' + res._code + ' body=' + res._body);
    });
    await test('AC1b: response body reports deleted:true', function() {
      var parsed = JSON.parse(res._body);
      assert.strictEqual(parsed.deleted, true);
    });
    await test('AC1c: journey no longer resolvable via getJourney', function() {
      assert.strictEqual(jStore.getJourney(journey.journeyId), null);
    });
  }

  // -- AC2: nonexistent journeyId -> 404
  console.log('\n[alrf-s10] AC2 -- nonexistent journeyId returns 404');
  {
    var jStore = freshRequire(JOURNEY_STORE_PATH);
    var j      = freshRequire(JOURNEY_PATH);
    jStore._clear();

    var req = makeReq({ params: { journeyId: 'does-not-exist' }, body: { _csrf: 'real-csrf-token' } });
    var res = makeRes();
    await test('AC2: 404 for a journeyId that does not exist', async function() {
      await j.handleDeleteJourney(req, res);
      assert.strictEqual(res._code, 404);
    });
  }

  // -- AC3: journey belongs to a DIFFERENT tenant -> 404 (not 403 -- FORBIDDEN-vs-NOT_FOUND policy)
  console.log('\n[alrf-s10] AC3 -- cross-tenant journey returns 404, not 403 (matches existing FORBIDDEN-vs-NOT_FOUND policy)');
  {
    var jStore = freshRequire(JOURNEY_STORE_PATH);
    var j      = freshRequire(JOURNEY_PATH);
    jStore._clear();
    var journey = jStore.createJourney('alrf-s10-feature-b');
    jStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-OTHER' });

    var req = makeReq({ params: { journeyId: journey.journeyId }, body: { _csrf: 'real-csrf-token' } }); // requester is tenant-a
    var res = makeRes();
    await test('AC3a: 404 for a journey owned by a different tenant', async function() {
      await j.handleDeleteJourney(req, res);
      assert.strictEqual(res._code, 404);
    });
    await test('AC3b: the other tenant\'s journey was NOT deleted', function() {
      assert.notStrictEqual(jStore.getJourney(journey.journeyId), null);
    });
  }

  // -- AC4: missing/wrong CSRF token -> 403, journey NOT deleted
  console.log('\n[alrf-s10] AC4 -- wrong CSRF token is rejected, journey survives');
  {
    var jStore = freshRequire(JOURNEY_STORE_PATH);
    var j      = freshRequire(JOURNEY_PATH);
    jStore._clear();
    var journey = jStore.createJourney('alrf-s10-feature-c');
    jStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a' });

    var req = makeReq({ params: { journeyId: journey.journeyId }, body: { _csrf: 'WRONG-TOKEN' } });
    var res = makeRes();
    await test('AC4a: 403 for a mismatched CSRF token', async function() {
      await j.handleDeleteJourney(req, res);
      assert.strictEqual(res._code, 403);
    });
    await test('AC4b: the journey was NOT deleted', function() {
      assert.notStrictEqual(jStore.getJourney(journey.journeyId), null);
    });
  }

  // -- AC5: no accessToken -> 401
  console.log('\n[alrf-s10] AC5 -- unauthenticated request returns 401');
  {
    var j = freshRequire(JOURNEY_PATH);
    var req = makeReq({ session: { csrfToken: 'x' }, params: { journeyId: 'anything' } });
    var res = makeRes();
    await test('AC5: 401 with no accessToken', async function() {
      await j.handleDeleteJourney(req, res);
      assert.strictEqual(res._code, 401);
    });
  }

  // -- AC6: journey-store.deleteJourney also deletes the journey's artefact rows via the pg adapter
  console.log('\n[alrf-s10] AC6 -- deleteJourney delegates to the pg adapter (artefacts + journey rows)');
  {
    var jStore = freshRequire(JOURNEY_STORE_PATH);
    jStore._clear();
    var journey = jStore.createJourney('alrf-s10-feature-d');

    var pgDeleteCalls = [];
    jStore.setPgAdapterForTesting({
      deleteJourney: function(journeyId) { pgDeleteCalls.push(journeyId); return Promise.resolve({ deleted: true }); }
    });

    await test('AC6a: journey-store.deleteJourney calls the pg adapter with the right journeyId', async function() {
      await jStore.deleteJourney(journey.journeyId);
      assert.strictEqual(pgDeleteCalls.length, 1);
      assert.strictEqual(pgDeleteCalls[0], journey.journeyId);
    });
    jStore.setPgAdapterForTesting(null);
  }

  // -- AC7: the feature-index page (features.js) renders a real Delete button
  //         with the journey's own journeyId, only when a journey was resolved
  console.log('\n[alrf-s10] AC7 -- features.js renders a Delete button targeting the real journeyId');
  {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-alrf-s10-ac7', featureSlug: 'x', displayName: null, completedStages: [] }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var req = { session: { accessToken: 'tok', login: 'user' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await test('AC7a: delete button present, targeting the real journeyId', async function() {
      // pncg-s1: handleGetFeatureArtefacts now threads a `pool` param (4th
      // positional, after featureSlug) through to renderShellWithNav's own
      // getProductsNavSummary(pool, tenantId) call -- empty rows is fine,
      // this test doesn't assert on the Products nav section itself.
      await routes.handleGetFeatureArtefacts(req, res, 'x', { query: async function() { return { rows: [] }; } });
      assert.ok(res._body.indexOf('alrf-s10-delete-feature-btn') !== -1, 'expected the delete button element');
      assert.ok(res._body.indexOf('/api/journey/jid-alrf-s10-ac7') !== -1, 'expected the fetch target to reference the real journeyId');
    });
  }

  console.log('\n--- alrf-s10 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
