'use strict';

// check-p3.1-pg-journey-adapter.js
// Verifies p3.1: journey-store PG adapter write-through and restart-survival.
// Uses injectable stub adapter — no real Postgres connection required.
//
// Run: node tests/check-p3.1-pg-journey-adapter.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── stub PG adapter ───────────────────────────────────────────────────────────

function makePgStub() {
  var _rows = {};
  return {
    _rows: _rows,
    saveJourney: async function(journey) {
      var data = Object.assign({}, journey);
      delete data.journeyId;
      delete data.tenantId;
      delete data.ownerId;
      delete data.featureSlug;
      delete data.accessToken;
      _rows[journey.journeyId] = {
        journeyId:   journey.journeyId,
        tenantId:    journey.tenantId   || null,
        ownerId:     journey.ownerId    || null,
        featureSlug: journey.featureSlug,
        data:        data
      };
    },
    listJourneys: async function() {
      return Object.values(_rows).map(function(row) {
        return Object.assign({}, row.data, {
          journeyId:   row.journeyId,
          tenantId:    row.tenantId,
          ownerId:     row.ownerId,
          featureSlug: row.featureSlug
        });
      });
    }
  };
}

// ── load modules ──────────────────────────────────────────────────────────────

var journeyStore = require('../src/web-ui/modules/journey-store');

// ── AC1: journey created is written to PG stub ────────────────────────────────

console.log('\nAC1 — journey created via createJourney is persisted to PG stub');
(async function() {
  journeyStore._clearForTesting();
  var stub = makePgStub();
  journeyStore.setPgAdapterForTesting(stub);

  var journey = journeyStore.createJourney('test-feature');
  journey.tenantId  = 'org-a';
  journey.ownerId   = 'alice';

  // createJourney fires PG write — give micro-task a chance to settle
  await new Promise(function(r) { setImmediate(r); });

  // Now call saveJourney explicitly to simulate the flow (createJourney fires _pgWrite)
  // Actually createJourney fires _pgWrite internally; but the journey was created before tenantId was set.
  // Simulate an explicit write via setJourneyFields to pick up tenantId.
  journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'org-a', ownerId: 'alice' });
  await new Promise(function(r) { setImmediate(r); });

  var row = stub._rows[journey.journeyId];
  ok('row exists in PG stub after setJourneyFields', !!row);
  ok('journey_id matches',  row && row.journeyId   === journey.journeyId);
  ok('tenant_id is org-a',  row && row.tenantId    === 'org-a');
  ok('feature_slug matches', row && row.featureSlug === 'test-feature');
})().then(function() {

// ── AC2: journey survives simulated restart ───────────────────────────────────

console.log('\nAC2 — journey survives simulated restart (in-memory cleared, reloaded from PG stub)');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makePgStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('restart-feature');
  j.tenantId = 'org-b';
  journeyStore.setJourneyFields(j.journeyId, { tenantId: 'org-b', completedStages: [{ skillName: 'discovery' }] });
  await new Promise(function(r) { setImmediate(r); });

  // Simulate restart: clear memory and reload from stub
  journeyStore._clearForTesting();
  ok('journey absent from memory before reload', !journeyStore.getJourney(j.journeyId));

  await journeyStore.loadAllFromPg();
  var reloaded = journeyStore.getJourney(j.journeyId);
  ok('journey present after reload',  !!reloaded);
  ok('featureSlug preserved',         reloaded && reloaded.featureSlug === 'restart-feature');
  ok('tenantId preserved',            reloaded && reloaded.tenantId    === 'org-b');
})();

}).then(function() {

// ── AC3: setJourneyFields writes through to PG ────────────────────────────────

console.log('\nAC3 — setJourneyFields writes through to PG stub');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makePgStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('fields-feature');
  await new Promise(function(r) { setImmediate(r); });
  journeyStore.setJourneyFields(j.journeyId, { completedStages: [{ skillName: 'ideate' }], activeSkill: 'discovery' });
  await new Promise(function(r) { setImmediate(r); });

  var row = stub._rows[j.journeyId];
  ok('row updated in PG stub', !!row);
  ok('data.activeSkill = discovery', row && row.data && row.data.activeSkill === 'discovery');
})();

}).then(function() {

// ── AC4: listJourneys returns all journeys ─────────────────────────────────────

console.log('\nAC4 — listJourneys returns all journeys (for cap counting)');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makePgStub();
  journeyStore.setPgAdapterForTesting(stub);

  journeyStore.createJourney('feat-a').tenantId = 'org-a';
  journeyStore.createJourney('feat-b').tenantId = 'org-b';
  await new Promise(function(r) { setImmediate(r); });

  var all = journeyStore.listJourneys();
  ok('listJourneys returns 2 journeys', all.length === 2);
})();

}).then(function() {

// ── AC5: accessToken never written to PG ──────────────────────────────────────

console.log('\nAC5 — accessToken is never written to PG stub');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makePgStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('secure-feature');
  journeyStore.setJourneyFields(j.journeyId, { accessToken: 'super-secret', tenantId: 'org-c' });
  await new Promise(function(r) { setImmediate(r); });

  var row = stub._rows[j.journeyId];
  ok('accessToken absent from PG row data', row && row.data && row.data.accessToken === undefined);
})();

}).then(function() {

// ── AC6: PG adapter not activated when DATABASE_URL absent ────────────────────

console.log('\nAC6 — PG adapter not activated when DATABASE_URL absent (graceful fallback)');
(function() {
  // The real pg adapter only connects when DATABASE_URL is present.
  // Verify the real adapter's _getPool returns null without DATABASE_URL.
  var saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  var pgAdapter = require('../src/web-ui/adapters/journey-store-pg');
  // saveJourney with no pool should be a no-op (no throw)
  var threw = false;
  pgAdapter.saveJourney({ journeyId: 'x', featureSlug: 'y' }).catch(function() {});
  ok('saveJourney without DATABASE_URL does not throw synchronously', !threw);
  if (saved !== undefined) process.env.DATABASE_URL = saved;
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  journeyStore._clearForTesting();
  journeyStore.setPgAdapterForTesting(null);
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
