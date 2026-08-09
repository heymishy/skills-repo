'use strict';

// check-jpws-s1-journey-pg-write-serialization.js
// Verifies jpws-s1: journey-store's per-journeyId Postgres write-order chain.
// Uses a controllable stub adapter whose saveJourney() resolves/rejects on
// demand, so the tests can prove genuine serialization (not just eventual
// correctness by luck) -- see tests/check-p3.1-pg-journey-adapter.js for the
// established auto-resolving stub pattern this extends, including its
// sequential .then()-chained test-block structure (module-level state via
// setPgAdapterForTesting/_clearForTesting must not run concurrently across
// blocks).
//
// Run: node tests/check-jpws-s1-journey-pg-write-serialization.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── controllable stub PG adapter ────────────────────────────────────────────

function makeControllableStub() {
  var calls = []; // [{ journey, resolve, reject }]
  return {
    calls: calls,
    saveJourney: function(journey) {
      var record = { journey: Object.assign({}, journey) };
      var p = new Promise(function(resolve, reject) {
        record.resolve = function() { resolve(); };
        record.reject = function(err) { reject(err); };
      });
      calls.push(record);
      return p;
    }
  };
}

function tick() {
  return new Promise(function(r) { setImmediate(r); });
}

var journeyStore = require('../src/web-ui/modules/journey-store');

// ── AC1: later write's tenantId always wins, regardless of resolution order ──

console.log('\nAC1 — later write (tenantId set) always wins, even though it settles after the earlier write');
(async function() {
  journeyStore._clearForTesting();
  var stub = makeControllableStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('feat-ac1'); // write #1: no tenantId
  journeyStore.setJourneyFields(j.journeyId, { tenantId: 'org-a' }); // write #2: tenantId set

  await tick();
  ok('only write #1 issued so far (write #2 queued behind it)', stub.calls.length === 1);

  stub.calls[0].resolve();
  await tick();
  ok('write #2 issued after write #1 settled', stub.calls.length === 2);

  stub.calls[1].resolve();
  await tick();

  var lastCall = stub.calls[stub.calls.length - 1];
  ok('final write carries the correct tenantId', lastCall.journey.tenantId === 'org-a');
})().then(function() {

// ── AC2: same-journey writes invoked once each, strictly in call order ───────

console.log('\nAC2 — three writes for the same journey are each invoked exactly once, strictly in call order');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makeControllableStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('feat-ac2');
  journeyStore.setJourneyFields(j.journeyId, { tenantId: 'org-b' });
  journeyStore.setJourneyFields(j.journeyId, { ownerId: 'bob' });

  await tick();
  ok('exactly one write issued immediately after 3 calls', stub.calls.length === 1);

  stub.calls[0].resolve();
  await tick();
  ok('second write issued after first settles', stub.calls.length === 2);

  stub.calls[1].resolve();
  await tick();
  ok('third write issued after second settles', stub.calls.length === 3);

  stub.calls[2].resolve();
  await tick();

  ok('exactly 3 total invocations, no more', stub.calls.length === 3);
  ok('writes were issued in call order (tenantId set before ownerId)',
    stub.calls[1].journey.tenantId === 'org-b' && stub.calls[2].journey.ownerId === 'bob');
})();

}).then(function() {

// ── AC3: writes for different journeys are not serialized against each other ─

console.log('\nAC3 — writes for two different journeys are not blocked on each other');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makeControllableStub();
  journeyStore.setPgAdapterForTesting(stub);

  journeyStore.createJourney('feat-ac3-a');
  journeyStore.createJourney('feat-ac3-b');

  await tick();
  ok('both journeys\' writes issued immediately, neither waits on the other', stub.calls.length === 2);

  stub.calls[0].resolve();
  stub.calls[1].resolve();
  await tick();
})();

}).then(function() {

// ── AC4: a rejected earlier write does not block a later write for the same journey ─

console.log('\nAC4 — a rejected write does not permanently jam that journey\'s write queue');
return (async function() {
  journeyStore._clearForTesting();
  var stub = makeControllableStub();
  journeyStore.setPgAdapterForTesting(stub);

  var j = journeyStore.createJourney('feat-ac4');
  journeyStore.setJourneyFields(j.journeyId, { tenantId: 'org-c' });

  await tick();
  ok('only write #1 issued so far', stub.calls.length === 1);

  stub.calls[0].reject(new Error('simulated transient PG error'));
  await tick();

  ok('write #2 still issued despite write #1 rejecting', stub.calls.length === 2);
  ok('write #2 carries the correct tenantId', stub.calls[1].journey.tenantId === 'org-c');

  stub.calls[1].resolve();
  await tick();
})();

}).then(function() {

// ── AC5: no-PG-adapter case remains a no-op (regression guard) ───────────────

console.log('\nAC5 — no PG adapter configured: _pgWrite remains a no-op');
journeyStore._clearForTesting();
journeyStore.setPgAdapterForTesting(null);
var threw = false;
try {
  journeyStore.createJourney('feat-ac5');
} catch (_) { threw = true; }
ok('createJourney with no PG adapter does not throw', !threw);

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
