// check-s1.1-board-advance-action.js -- TDD tests for s1.1 (Epic 1, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s1.1-board-advance-action.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s1.1-board-advance-action-test-plan.md
//
// Covers: Unit (readinessLookupIsBatchedNotLinear, notReadyCardOffersNoAdvanceAction),
// Integration (readyCardAdvanceCallsRealGateConfirm, readyCardAdvanceUpdatesCompletedStages,
// crossTenantAdvanceRejected404, realGateConfirmFailureSurfacesActualReason).
// E2E tests live in tests/e2e/s1.1-board-advance-action.spec.js (Playwright, separate run).

'use strict';

const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
    });
}

const PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

function freshAll() {
  // Clear all three so adapter state / in-memory journey map never leaks
  // between tests (each test gets a fully fresh require graph).
  try { delete require.cache[require.resolve(PRODUCTS_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  const products = require(PRODUCTS_PATH);
  const journey = require(JOURNEY_PATH);
  const store = require(JOURNEY_STORE_PATH);
  store._clear();
  return { products: products, journey: journey, store: store };
}

function makeMockRes() {
  return {
    _statusCode: null, _headers: {}, _body: '',
    writeHead(code, headers) { this._statusCode = code; this._headers = headers || {}; },
    end(body) { this._body += (body || ''); }
  };
}

function makeMockPool(rowsByQuery) {
  return {
    query: async function(sql, params) {
      return { rows: rowsByQuery(sql, params) };
    }
  };
}

const queue = [];

// ---------------------------------------------------------------------------
// Unit: readinessLookupIsBatchedNotLinear (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('readinessLookupIsBatchedNotLinear: session-store bulk read call count stays constant as N grows', function() {
    const { products } = freshAll();
    assert.strictEqual(typeof products.setGetHtmlSessionsBulk, 'function', 'products.js must export setGetHtmlSessionsBulk for test spying');

    let bulkCallCount = 0;
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      bulkCallCount++;
      const map = {};
      (sessionIds || []).forEach(function(id) { map[id] = { done: true }; });
      return map;
    });

    function rowsFor(n) {
      const rows = [];
      for (let i = 0; i < n; i++) {
        rows.push({ journey_id: 'j' + i, feature_slug: 'feature-' + i, stage: 'discovery', active_session_id: 'sid-' + i });
      }
      return rows;
    }

    bulkCallCount = 0;
    products.buildProductKanbanColumns(rowsFor(5));
    const callsForN5 = bulkCallCount;

    bulkCallCount = 0;
    products.buildProductKanbanColumns(rowsFor(50));
    const callsForN50 = bulkCallCount;

    assert.ok(callsForN5 >= 1, 'N=5 board render must perform at least one bulk session read');
    assert.ok(callsForN50 <= callsForN5 * 2, 'N=50 read-call count (' + callsForN50 + ') must not exceed 2x the N=5 read-call count (' + callsForN5 + ') -- NFR pass threshold');
    assert.strictEqual(callsForN5, 1, 'exactly one bulk call for N=5 (batched, not per-card)');
    assert.strictEqual(callsForN50, 1, 'exactly one bulk call for N=50 (batched, not per-card)');
  });
});

// ---------------------------------------------------------------------------
// Unit: notReadyCardOffersNoAdvanceAction (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('notReadyCardOffersNoAdvanceAction: not-done session -> ready:false, no advance markup in rendered HTML', function() {
    const { products } = freshAll();
    const { renderKanban } = require('../src/web-ui/views/kanban-view');

    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { map[id] = { done: false }; });
      return map;
    });

    const rows = [{ journey_id: 'j1', feature_slug: 'not-ready-feature', stage: 'discovery', active_session_id: 'sid-1' }];
    const columns = products.buildProductKanbanColumns(rows);
    const discoveryCol = columns.find(function(c) { return c.stage === 'discovery'; });
    assert.strictEqual(discoveryCol.cards[0].ready, false, 'card.ready must be false when session.done is false');

    const html = renderKanban({ columns: columns });
    assert.ok(!/<button[^>]*class="kb-advance-btn"/.test(html), 'no kb-advance-btn <button> element rendered for a not-ready card (the CSS rule name alone always appears in the static stylesheet, so this checks for the actual element)');
  });
});

// ---------------------------------------------------------------------------
// Integration: readyCardAdvanceCallsRealGateConfirm (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('readyCardAdvanceCallsRealGateConfirm: POST to board-action endpoint advances the journey exactly as gate-confirm would', async function() {
    const { products, journey, store } = freshAll();

    const journeyObj = store.createJourney('s1-1-it1-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it1-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-x' });
    const sid = 'sid-it1-' + Date.now();
    store.setActiveSession(journeyId, sid, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setPipelineStateWriter(function() {});
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return { skillName: 'discovery', done: true, artefactPath: null, artefactContent: '# Discovery done', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });

    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) {
        if (id === sid) map[id] = { done: true };
      });
      return map;
    });

    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) {
        return [{ tenant_id: 'tenant-x' }];
      }
      return [];
    });

    const req = { session: { tenantId: 'tenant-x', accessToken: 'tok', login: 'user' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    assert.strictEqual(res._statusCode, 200, 'expected 200 on successful advance, got ' + res._statusCode + ' body=' + res._body);
    const updated = store.getJourney(journeyId);
    assert.strictEqual(updated.activeSkill, 'benefit-metric', 'journey must have advanced to the real next stage (discovery -> benefit-metric)');
  });
});

// ---------------------------------------------------------------------------
// Integration: readyCardAdvanceUpdatesCompletedStages (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('readyCardAdvanceUpdatesCompletedStages: completedStages includes the just-completed stage', async function() {
    const { products, journey, store } = freshAll();

    const journeyObj = store.createJourney('s1-1-it2-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it2-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-y' });
    const sid = 'sid-it2-' + Date.now();
    store.setActiveSession(journeyId, sid, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setPipelineStateWriter(function() {});
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return { skillName: 'discovery', done: true, artefactPath: null, artefactContent: '# Discovery done', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { if (id === sid) map[id] = { done: true }; });
      return map;
    });

    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) return [{ tenant_id: 'tenant-y' }];
      return [];
    });

    const req = { session: { tenantId: 'tenant-y', accessToken: 'tok', login: 'user' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    const updated = store.getJourney(journeyId);
    assert.ok(updated.completedStages.some(function(s) { return s.skillName === 'discovery'; }), 'completedStages must include the just-completed discovery stage');
  });
});

// ---------------------------------------------------------------------------
// Integration: crossTenantAdvanceRejected404 (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('crossTenantAdvanceRejected404: journey belonging to tenant B rejected 404 for tenant A, no state written', async function() {
    const { products, journey, store } = freshAll();

    const journeyObj = store.createJourney('s1-1-it3-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it3-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-b' });
    const sid = 'sid-it3-' + Date.now();
    store.setActiveSession(journeyId, sid, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    let psWriterCalled = false;
    journey.setPipelineStateWriter(function() { psWriterCalled = true; });
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setGetHtmlSession(function(s) {
      if (s === sid) return { skillName: 'discovery', done: true, artefactPath: null, artefactContent: '# Discovery done', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      return null;
    });
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { if (id === sid) map[id] = { done: true }; });
      return map;
    });

    // Real cross-tenant journey ID: DB row says tenant-b, requester is tenant-a.
    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) return [{ tenant_id: 'tenant-b' }];
      return [];
    });

    const req = { session: { tenantId: 'tenant-a', accessToken: 'tok', login: 'attacker' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    assert.strictEqual(res._statusCode, 404, 'cross-tenant advance must be rejected 404 (not 403), got ' + res._statusCode);
    assert.ok(!psWriterCalled, 'pipelineStateWriter must NOT be called for a rejected cross-tenant request');
    const stillJourney = store.getJourney(journeyId);
    assert.strictEqual(stillJourney.activeSkill, 'discovery', 'journey stage must be unchanged after a rejected cross-tenant request');
  });
});

// ---------------------------------------------------------------------------
// Integration: realGateConfirmFailureSurfacesActualReason (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('realGateConfirmFailureSurfacesActualReason: a real validation failure surfaces the actual reason, not a generic message', async function() {
    const { products, journey, store } = freshAll();

    const journeyObj = store.createJourney('s1-1-it4-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it4-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-z' });
    const sid = 'sid-it4-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setPipelineStateWriter(function() {});
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setValidate(function() {
      return { exitCode: 3, stderr: 'H3: AC section missing or malformed' };
    });
    const artefactPath = 'artefacts/test-s1-1-it4/dor.md';
    journey.setGetHtmlSession(function(s) {
      if (s === sid) return { skillName: 'definition-of-ready', done: true, artefactPath: artefactPath, artefactContent: '# incomplete DoR', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      return null;
    });
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { if (id === sid) map[id] = { done: true }; });
      return map;
    });

    const os = require('os');
    const path2 = require('path');
    const fs2 = require('fs');
    const tmpRoot = path2.join(os.tmpdir(), 's1-1-it4-' + Date.now());
    fs2.mkdirSync(path2.join(tmpRoot, path2.dirname(artefactPath)), { recursive: true });
    fs2.writeFileSync(path2.join(tmpRoot, artefactPath), '# incomplete DoR', 'utf8');
    journey.setRepoRoot(tmpRoot);

    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) return [{ tenant_id: 'tenant-z' }];
      return [];
    });

    const req = { session: { tenantId: 'tenant-z', accessToken: 'tok', login: 'user' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    assert.strictEqual(res._statusCode, 422, 'expected 422 for a real validation failure, got ' + res._statusCode);
    const body = JSON.parse(res._body);
    assert.strictEqual(body.error, 'validation-failed', 'must surface the real validation-failed error shape');
    assert.strictEqual(body.exitCode, 3, 'must surface the real exitCode from _validate()');
    assert.ok((body.detail || '').indexOf('H3') !== -1, 'must surface the real detail text, not a generic failure message. Got: ' + JSON.stringify(body));
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-s1.1-board-advance-action.js');
  for (let i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
    });
    process.exit(1);
  }
})();
