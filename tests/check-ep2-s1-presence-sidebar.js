'use strict';
// tests/check-ep2-s1-presence-sidebar.js — Part 1
const assert = require('assert');
const presenceStore = require('../src/web-ui/modules/presence-store');

function testOnlineWithinThreshold() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-1', 'darren');
  t += 20000; // 20s later — still within 30s threshold
  const result = presenceStore.getStatus('journey-1', 'darren');
  assert.strictEqual(result.status, 'online', 'expected online within 30s threshold');
}
testOnlineWithinThreshold();
console.log('  ok - online within 30s threshold');

function testOfflineAfterThreshold() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-1', 'darren');
  t += 35000; // 35s later — past 30s threshold
  const result = presenceStore.getStatus('journey-1', 'darren');
  assert.strictEqual(result.status, 'offline', 'expected offline after 30s threshold');
  assert.strictEqual(result.lastSeenMs, 1000000, 'lastSeenMs should be the last registered timestamp');
}
testOfflineAfterThreshold();
console.log('  ok - offline after 30s threshold, lastSeenMs preserved');

function testNeverSeenIsOffline() {
  presenceStore._clearForTesting();
  const result = presenceStore.getStatus('journey-1', 'never-seen-user');
  assert.strictEqual(result.status, 'offline');
  assert.strictEqual(result.lastSeenMs, null);
}
testNeverSeenIsOffline();
console.log('  ok - never-seen user is offline with null lastSeenMs');

// tests/check-ep2-s1-presence-sidebar.js — Part 2
const journeyRoute = require('../src/web-ui/routes/journey');

async function testCollaboratorsPresenceHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handleGetJourneyCollaboratorsPresence, 'function');
  assert.strictEqual(typeof journeyRoute.handlePostJourneyHeartbeat, 'function');
  assert.strictEqual(typeof journeyRoute.handleGetJourneyPresenceStream, 'function');
}
testCollaboratorsPresenceHandlerExists()
  .then(() => console.log('  ok - all 3 new handlers exported'))
  .catch((err) => { console.error('  FAIL - testCollaboratorsPresenceHandlerExists:', err.message); process.exitCode = 1; });

// tests/check-ep2-s1-presence-sidebar.js — Part 3
// Full render-path assertion (sidebar container + script tag present in
// HTML output) is exercised by the E2E test (Task 6) against a real
// server -- handleGetFeatureArtefacts's HTML assembly has too many
// upstream branches (breadcrumb resolution, artefact fallback) to
// fixture cheaply at the unit level without duplicating that logic.
function testFeaturePageHandlerStillExported() {
  const { handleGetFeatureArtefacts } = require('../src/web-ui/routes/features');
  assert.strictEqual(typeof handleGetFeatureArtefacts, 'function');
}
testFeaturePageHandlerStillExported();
console.log('  ok - handleGetFeatureArtefacts still exported after sidebar injection edit');

// tests/check-ep2-s1-presence-sidebar.js — Part 4
// Full-path integration test: exercise the real getFeatureCollaborators +
// presence-store combination against a fake pool returning 3
// feature_collaborators rows, with presence pre-seeded for 2 online + 1
// offline (mirrors ep1-s3's own makeFakePool() convention from
// check-ep1-s3-feature-pod-inheritance.js).
async function testFullPathPresenceLoad() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-a1', 'hamish');
  presenceStore.registerActivity('journey-a1', 'susan');
  presenceStore.registerActivity('journey-a1', 'darren');
  t += 35000; // darren goes stale; hamish/susan re-register below stay fresh
  presenceStore.registerActivity('journey-a1', 'hamish');
  presenceStore.registerActivity('journey-a1', 'susan');

  const fakePool = {
    query: async (sql, params) => {
      if (sql.indexOf('feature_collaborators') !== -1) {
        return { rows: [
          { collaborator_id: 'c1', user_id: 'hamish', role_id: 'conductor', pod_id: 'pod-1' },
          { collaborator_id: 'c2', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
          { collaborator_id: 'c3', user_id: 'darren', role_id: 'engineer', pod_id: 'pod-1' }
        ] };
      }
      return { rows: [] };
    }
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  const withStatus = rows.map(r => Object.assign({}, r, presenceStore.getStatus('journey-a1', r.userId)));

  assert.strictEqual(withStatus.length, 3);
  assert.strictEqual(withStatus.find(c => c.userId === 'hamish').status, 'online');
  assert.strictEqual(withStatus.find(c => c.userId === 'susan').status, 'online');
  assert.strictEqual(withStatus.find(c => c.userId === 'darren').status, 'offline');
}
// NOTE: testPresenceIsolationByJourney is deliberately chained after this
// test's promise settles (rather than fired independently, as elsewhere in
// this file) because both tests mutate the same shared presence-store
// global. Firing them back-to-back races: this test suspends at its
// `await getFeatureCollaborators(...)` call, and testPresenceIsolationByJourney's
// synchronous `_clearForTesting()` would run and wipe state before this
// test resumes and reads it back.
testFullPathPresenceLoad()
  .then(() => console.log('  ok - full path: 2 online, 1 offline, correct roles'))
  .catch((err) => { console.error('  FAIL - testFullPathPresenceLoad:', err.message); process.exitCode = 1; })
  .then(() => testPresenceIsolationByJourney())
  .then(() => console.log('  ok - presence isolated per journeyId (tenant boundary enforced upstream by requireJourneyAccess)'))
  .catch((err) => { console.error('  FAIL - testPresenceIsolationByJourney:', err.message); process.exitCode = 1; });

// Journey isolation: presence-store keys are journeyId, and journeyId access
// is already tenant-gated by requireJourneyAccess (POLICY.TENANT) in every
// handler that calls into presence-store or feature-collaborator-store --
// there is no tenant_id column on feature_collaborators to test directly
// (by design -- see decisions.md's architecture-correction entry). This
// test proves the isolation is structural: two different journeyIds never
// share a presence map entry, even for the same login string across
// tenants/journeys.
async function testPresenceIsolationByJourney() {
  presenceStore._clearForTesting();
  presenceStore.setNow(() => 5000000);
  presenceStore.registerActivity('journey-tenant-a', 'hamish');
  const crossJourneyLookup = presenceStore.getStatus('journey-tenant-b', 'hamish');
  assert.strictEqual(crossJourneyLookup.status, 'offline', 'presence for one journey must not leak into another');
}
// Invoked chained after testFullPathPresenceLoad above (function declarations
// hoist, so the forward reference at the top of the file is valid) -- see
// the NOTE above testFullPathPresenceLoad's invocation for why.
