'use strict';
const assert = require('assert');
const { execSync } = require('child_process');

// ── Module load ────────────────────────────────────────────────────────────
let isSameTenant;
try {
  const journeyAccess = require('../src/web-ui/middleware/journey-access');
  isSameTenant = journeyAccess.isSameTenant;
  if (typeof isSameTenant !== 'function') throw new Error('isSameTenant not exported from journey-access');
} catch (e) {
  console.error('FAIL: Cannot load journey-access:', e.message);
  process.exit(1);
}

// ── Factory helpers ──────────────────────────────────────────────────────────

const JOURNEY_PATH = require.resolve('../src/web-ui/routes/journey');
const STORE_PATH   = require.resolve('../src/web-ui/modules/journey-store');

function freshRequire() {
  delete require.cache[JOURNEY_PATH];
  delete require.cache[STORE_PATH];
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null, _headers: {}, _body: '',
    writeHead: function(s, h) { res._status = s; Object.assign(res._headers, h || {}); return res; },
    setHeader:  function(k, v) { res._headers[k] = v; },
    end:        function(b)    { res._body += (b || ''); }
  };
  return res;
}

function makeReq(overrides) {
  return Object.assign(
    { session: { accessToken: 'tok', userId: '1', login: 'alice' }, params: {}, body: {} },
    overrides
  );
}

// Minimal journey objects for mock store
function bobJourney(id) {
  return { journeyId: id, ownerId: 'bob', tenantId: 'org-b', featureSlug: 'f', activeSkill: null, completedStages: [], activeSessionId: null };
}
function aliceJourney(id) {
  return { journeyId: id, ownerId: 'alice', tenantId: 'org-a', featureSlug: 'f', activeSkill: null, completedStages: [], activeSessionId: null };
}

// ── Sequential test runner ────────────────────────────────────────────────────

(async function runTests() {
  let passed = 0;
  let failed = 0;

  function pass(n, msg) { console.log('PASS ' + n + ': ' + msg); passed++; }
  function fail(n, msg) { console.error('FAIL ' + n + ': ' + msg); failed++; }

  // ── Test 1 — AC1: handlePostJourney stores tenantId from 4-field session ──
  try {
    var m1 = freshRequire();
    var store1 = getStore();
    store1._clear();
    m1.setRegisterHtmlSession(function() {});
    m1.setLinkSessionToJourney(function() {});
    var req1 = makeReq({
      session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: 'my-org' },
      body: { featureName: 'test-feature', startSkill: 'discovery', profileName: 'default' }
    });
    var res1 = makeRes();
    await m1.handlePostJourney(req1, res1);
    // Find the created journey
    var allJourneys1 = store1.listJourneys ? store1.listJourneys() : [];
    assert.ok(allJourneys1.length > 0, 'AC1: expected at least one journey in store after createJourney');
    var createdJourney = allJourneys1[0];
    assert.strictEqual(createdJourney.tenantId, 'my-org', 'AC1: expected journey.tenantId === "my-org", got: ' + createdJourney.tenantId);
    pass(1, 'AC1 — handlePostJourney stores tenantId from 4-field session');
  } catch (e) { fail(1, e.message); }

  // ── Test 2 — AC2: isSameTenant returns false when tenantIds differ ──
  try {
    var result2 = isSameTenant({ tenantId: 'org-a' }, { tenantId: 'org-b' });
    assert.strictEqual(result2, false, 'AC2: expected false when journey.tenantId=org-a, session.tenantId=org-b, got: ' + result2);
    pass(2, 'AC2 — isSameTenant returns false when tenantIds differ');
  } catch (e) { fail(2, e.message); }

  // ── Test 3 — AC3: isSameTenant returns true when tenantIds match ──
  try {
    var result3 = isSameTenant({ tenantId: 'org-a' }, { tenantId: 'org-a' });
    assert.strictEqual(result3, true, 'AC3: expected true when tenantIds match, got: ' + result3);
    pass(3, 'AC3 — isSameTenant returns true when tenantIds match');
  } catch (e) { fail(3, e.message); }

  // ── Test 4 — AC4a: isSameTenant returns true when journey.tenantId is null ──
  try {
    var result4a = isSameTenant({ tenantId: null }, { tenantId: 'org-a' });
    assert.strictEqual(result4a, true, 'AC4a: expected true when journey.tenantId=null, got: ' + result4a);
    pass(4, 'AC4a — isSameTenant returns true when journey.tenantId is null (Phase 0 passthrough)');
  } catch (e) { fail(4, e.message); }

  // ── Test 5 — AC4b: isSameTenant returns true when session.tenantId is undefined ──
  try {
    var result4b = isSameTenant({ tenantId: 'org-a' }, { tenantId: undefined });
    assert.strictEqual(result4b, true, 'AC4b: expected true when session.tenantId=undefined, got: ' + result4b);
    pass(5, 'AC4b — isSameTenant returns true when session.tenantId is undefined (Phase 0 passthrough)');
  } catch (e) { fail(5, e.message); }

  // ── Test 6 — AC4c: isSameTenant returns true when both tenantIds absent ──
  try {
    var result4c = isSameTenant({}, {});
    assert.strictEqual(result4c, true, 'AC4c: expected true when both tenantIds absent, got: ' + result4c);
    pass(6, 'AC4c — isSameTenant returns true when both tenantIds absent (single-user mode)');
  } catch (e) { fail(6, e.message); }

  // ── Test 7 — AC4d: isSameTenant returns true when journey.tenantId is undefined + session has tenantId ──
  try {
    var result4d = isSameTenant({ tenantId: undefined }, { tenantId: 'org-a' });
    assert.strictEqual(result4d, true, 'AC4d: expected true when journey.tenantId=undefined, got: ' + result4d);
    pass(7, 'AC4d — isSameTenant returns true when journey.tenantId is undefined');
  } catch (e) { fail(7, e.message); }

  // ── Test 8 — AC6: cross-tenant read returns 404 ──
  try {
    var m8 = freshRequire();
    m8.setJourneyStoreModule({ getJourney: function(id) { return bobJourney(id); } });
    var req8 = makeReq({
      session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: 'org-a' },
      params: { journeyId: 'j1' }
    });
    var res8 = makeRes();
    await m8.handleGetJourneyState(req8, res8);
    assert.strictEqual(res8._status, 404, 'AC6: expected 404 for cross-tenant read (alice/org-a, bob/org-b), got: ' + res8._status);
    pass(8, 'AC6 — cross-tenant read returns 404');
  } catch (e) { fail(8, e.message); }

  // ── Test 9 — AC6 regression: owner access not broken when tenantId present ──
  try {
    var m9 = freshRequire();
    m9.setJourneyStoreModule({ getJourney: function(id) { return aliceJourney(id); } });
    m9.setGetHtmlSession(function() { return function() { return null; }; });
    var req9 = makeReq({
      session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: 'org-a' },
      params: { journeyId: 'j1' }
    });
    var res9 = makeRes();
    await m9.handleGetJourneyState(req9, res9);
    var s9 = res9._status;
    assert.ok(!s9 || s9 < 400, 'AC6 regression: owner access should not be blocked; got status: ' + s9);
    pass(9, 'AC6 regression — owner access not blocked when tenantId present');
  } catch (e) { fail(9, e.message); }

  // ── Tests 10–12: AC7 regression — pre-existing suites must pass ─────────────
  try {
    execSync('node tests/check-p0.1-journey-access.js', { stdio: 'inherit' });
    pass(10, 'AC7 regression — check-p0.1-journey-access.js exit 0');
  } catch (e) { fail(10, 'check-p0.1-journey-access.js failed: ' + e.message); }

  try {
    execSync('node tests/check-p0.2-journey-guard-wiring.js', { stdio: 'inherit' });
    pass(11, 'AC7 regression — check-p0.2-journey-guard-wiring.js exit 0');
  } catch (e) { fail(11, 'check-p0.2-journey-guard-wiring.js failed: ' + e.message); }

  try {
    execSync('node tests/check-p1.1-oauth-tenant-resolution.js', { stdio: 'inherit' });
    pass(12, 'AC7 regression — check-p1.1-oauth-tenant-resolution.js exit 0');
  } catch (e) { fail(12, 'check-p1.1-oauth-tenant-resolution.js failed: ' + e.message); }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (failed > 0) {
    console.error('\n' + failed + ' test(s) FAILED — see above.');
    process.exitCode = 1;
  } else {
    console.log('\nAll ' + passed + ' tests passed.');
  }
})();
