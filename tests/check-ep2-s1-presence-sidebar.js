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
