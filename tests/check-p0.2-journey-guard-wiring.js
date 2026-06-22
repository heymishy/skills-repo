'use strict';
const assert = require('assert');
const path = require('path');

// ── Factory helpers ──────────────────────────────────────────────────────────

const makeReq = (overrides) => Object.assign(
  { session: { accessToken: 'tok-alice', userId: '1', login: 'alice' }, params: {}, body: {} },
  overrides
);

const makeRes = () => {
  let _status, _body;
  return {
    status(s)      { _status = s; return this; },
    json(b)        { _body = b; return this; },
    redirect(s)    { _status = s; },
    writeHead(s)   { _status = s; return this; },
    end(b)         { if (b != null) { try { _body = JSON.parse(b); } catch(_) { _body = b; } } },
    _get: ()       => ({ status: _status, body: _body })
  };
};

function freshRequire() {
  const journeyPath = require.resolve('../src/web-ui/routes/journey');
  const guardPath   = require.resolve('../src/web-ui/middleware/journey-access');
  delete require.cache[journeyPath];
  delete require.cache[guardPath];
  return require('../src/web-ui/routes/journey');
}

// Mock journey store builders
const bobJourney    = (id) => ({ journeyId: id, ownerId: 'bob',  featureSlug: 'test-feature', activeSkill: 'discovery', completedStages: [] });
const aliceJourney  = (id) => ({ journeyId: id, ownerId: 'alice', featureSlug: 'test-feature', activeSkill: 'discovery', completedStages: [] });
const legacyJourney = (id) => ({ journeyId: id, ownerId: null,   featureSlug: 'test-feature', activeSkill: 'discovery', completedStages: [] });

const mockStore = (journeyFn) => ({ getJourney: (id) => journeyFn(id) });

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

// ── Tests (wrapped in async main for top-level await in CJS) ────────────────
(async () => {

// ── Test 1 — AC1: handleGetJourneyState cross-user → 404 ────────────────────
await checkAsync('1 AC1: handleGetJourneyState cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  await m.handleGetJourneyState(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 2 — AC2: handleGetJourney cross-user with journeyId → 404 ──────────
await checkAsync('2 AC2: handleGetJourney cross-user with journeyId → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  m.handleGetJourney(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404 for cross-user with journeyId, got: ' + res._get().status);
});

// ── Test 3 — AC3: handleGetJourneyById cross-user → 404 ─────────────────────
await checkAsync('3 AC3: handleGetJourneyById cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  m.handleGetJourneyById(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 4 — AC4: handleGetJourneyViewers cross-user → 404 ──────────────────
await checkAsync('4 AC4: handleGetJourneyViewers cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  await m.handleGetJourneyViewers(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 5 — AC5: handleGetJourneyStageView cross-user → 404 ────────────────
await checkAsync('5 AC5: handleGetJourneyStageView cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1', stageName: 'discovery' } });
  const res = makeRes();
  await m.handleGetJourneyStageView(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 6 — AC6: handleGetStageControls cross-user → 404 ───────────────────
await checkAsync('6 AC6: handleGetStageControls cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  m.handleGetStageControls(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 7 — AC7: handlePostSideTripClarify cross-user → 404 ────────────────
await checkAsync('7 AC7: handlePostSideTripClarify cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' }, body: {} });
  const res = makeRes();
  await m.handlePostSideTripClarify(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 8 — AC8: handleDeleteSideTrip cross-user → 404 ─────────────────────
await checkAsync('8 AC8: handleDeleteSideTrip cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  await m.handleDeleteSideTrip(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 9 — AC9: handleGetTrace cross-user → 404 ───────────────────────────
await checkAsync('9 AC9: handleGetTrace cross-user → 404', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1' } });
  const res = makeRes();
  await m.handleGetTrace(req, res);
  assert.strictEqual(res._get().status, 404, 'expected 404, got: ' + res._get().status);
});

// ── Test 10 — AC10: handlePostJourneyRecommit cross-user → 403 ──────────────
await checkAsync('10 AC10: handlePostJourneyRecommit cross-user → 403', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1', stageName: 'discovery' }, body: { confirmed: true } });
  const res = makeRes();
  await m.handlePostJourneyRecommit(req, res);
  assert.strictEqual(res._get().status, 403, 'expected 403 (OWNER policy), got: ' + res._get().status);
});

// ── Test 11 — AC11: handlePostJourneyStageCommit cross-user → 403 ───────────
await checkAsync('11 AC11: handlePostJourneyStageCommit cross-user → 403', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(bobJourney));
  const req = makeReq({ params: { journeyId: 'j1', stageName: 'discovery' }, body: {} });
  const res = makeRes();
  await m.handlePostJourneyStageCommit(req, res);
  assert.strictEqual(res._get().status, 403, 'expected 403 (OWNER policy), got: ' + res._get().status);
});

// ── Test 12 — AC12: owner access not blocked (regression) ───────────────────
await checkAsync('12 AC12: handleGetJourneyState owner alice → not 4xx', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(aliceJourney));
  m.setGetHtmlSession(() => () => null);
  const req = makeReq({ params: { journeyId: 'j1' }, session: { accessToken: 'tok-alice', userId: '1', login: 'alice' } });
  const res = makeRes();
  await m.handleGetJourneyState(req, res);
  const s = res._get().status;
  assert.ok(!s || s < 400, 'owner access should not be blocked; got status: ' + s);
});

// ── Test 13 — AC13: legacy ownerId null accessible (passthrough) ─────────────
await checkAsync('13 AC13: handleGetJourneyState ownerId null → not 4xx', async () => {
  const m = freshRequire();
  m.setJourneyStoreModule(mockStore(legacyJourney));
  m.setGetHtmlSession(() => () => null);
  const req = makeReq({ params: { journeyId: 'j1' }, session: { accessToken: 'tok-alice', userId: '1', login: 'alice' } });
  const res = makeRes();
  await m.handleGetJourneyState(req, res);
  const s = res._get().status;
  assert.ok(!s || s < 400, 'legacy null ownerId should pass through; got status: ' + s);
});

// ── Summary ──────────────────────────────────────────────────────────────────
if (failed === 0) {
  console.log('\nAll ' + (passed) + ' tests passed.');
} else {
  console.error('\n' + failed + ' test(s) FAILED, ' + passed + ' passed.');
}

})().catch(e => { console.error('Unexpected error:', e); process.exit(1); });
