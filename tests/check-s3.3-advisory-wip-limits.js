// check-s3.3-advisory-wip-limits.js -- TDD tests for s3.3 (Epic 3, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.3-advisory-wip-limits.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.3-advisory-wip-limits-test-plan.md
//
// Covers: Unit (overLimitColumnShowsDistinctIndicator, atLimitColumnShowsPlainCount,
// limitConventionConsistentAcrossScopes), Integration (advanceIntoOverLimitColumnStillSucceeds,
// dragIntoOverLimitColumnStillSucceeds).

'use strict';

const assert = require('assert');
const path = require('path');

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

const { renderKanban } = require('../src/web-ui/views/kanban-view');
const {
  buildProductKanbanColumns,
  buildOrgKanbanColumns,
  buildTenantKanbanColumns
} = require('../src/web-ui/routes/products');

const PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshAll() {
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

// Fixture builder: N cards in a single stage column.
function columnWithCards(stage, n) {
  const cards = [];
  for (let i = 0; i < n; i++) {
    cards.push({ id: 'card-' + stage + '-' + i, title: 'Card ' + i, health: 'green' });
  }
  return { stage: stage, cards: cards };
}

// The literal string "kb-wip--over" always appears once in the static
// <style> block regardless of whether any element uses it -- checks below
// must look for the actual rendered <span> element, not substring presence
// (the same pitfall the s1.1 suite already documents for its own
// not-ready/validation-failed classes).
function hasOverLimitElement(html) {
  return /<span class="kb-wip kb-wip--over"/.test(html);
}

const queue = [];

// ---------------------------------------------------------------------------
// Unit: overLimitColumnShowsDistinctIndicator (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('overLimitColumnShowsDistinctIndicator: 5 cards in a limit-4 stage renders kb-wip--over with "5/4"', function() {
    const columns = [columnWithCards('review', 5)];
    const html = renderKanban({ columns: columns });
    assert.ok(/<span class="kb-wip kb-wip--over"[^>]*>5\/4<\/span>/.test(html), 'over-limit badge with text "5/4" must be present. Got snippet: ' + (html.match(/kb-wip[^<]*<\/span>/g) || []).join(' | '));
  });
});

// ---------------------------------------------------------------------------
// Unit: atLimitColumnShowsPlainCount (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('atLimitColumnShowsPlainCount: exactly-at-limit (4 cards, limit 4) shows plain count, not over-limit styling', function() {
    const columns = [columnWithCards('review', 4)];
    const html = renderKanban({ columns: columns });
    assert.ok(!hasOverLimitElement(html), 'at-limit (not over) must not render the kb-wip--over element');
    assert.ok(/<span class="kb-wip">4<\/span>/.test(html), 'plain count badge "4" must be present. Got snippet: ' + (html.match(/kb-wip[^<]*<\/span>/g) || []).join(' | '));
  });
});

// ---------------------------------------------------------------------------
// Unit: limitConventionConsistentAcrossScopes (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('limitConventionConsistentAcrossScopes: the same "review" limit is applied identically on product/org/tenant boards', async function() {
    // Product scope: 5 journeys in "review" (over the default limit of 4).
    const productRows = [];
    for (let i = 0; i < 5; i++) productRows.push({ journey_id: 'p-j' + i, feature_slug: 'p-feature-' + i, stage: 'review' });
    const productColumns = buildProductKanbanColumns(productRows);
    const productHtml = renderKanban({ columns: productColumns });

    // Org scope: same 5 journeys, grouped under one product.
    const orgGroups = [{ productId: 'org-p1', productName: 'Org Product', journeys: productRows }];
    const orgColumns = buildOrgKanbanColumns(orgGroups);
    const orgHtml = renderKanban({ columns: orgColumns });

    // Tenant scope: same 5 journeys, aggregated via the tenant board query.
    const pool = makeMockPool(function(sql, params) {
      if (sql.includes('FROM products')) {
        return [{ product_id: 'tenant-p1', name: 'Tenant Product', created_at: '2026-01-01' }];
      }
      return productRows;
    });
    const tenantColumns = await buildTenantKanbanColumns(pool, 'tenant-wip-1');
    const tenantHtml = renderKanban({ columns: tenantColumns });

    [productHtml, orgHtml, tenantHtml].forEach(function(html, idx) {
      const scopeName = ['product', 'org', 'tenant'][idx];
      assert.ok(hasOverLimitElement(html), scopeName + ' scope must show the over-limit badge for "review" when 5 cards exceed the same configured limit');
      assert.ok(/5\/4/.test(html), scopeName + ' scope must show "5/4" -- same limit value (4) as the other scopes');
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: advanceIntoOverLimitColumnStillSucceeds (AC3)
// ---------------------------------------------------------------------------
// Target stage: "test-plan" (also a configured-limit stage), reached via the
// per-story "review -> test-plan" transition. NOTE: transitioning INTO
// "review" itself goes through a separate "switch to per-story routing"
// redirect in handlePostGateConfirm (it does not set activeSkill directly on
// that specific hop) -- so "review -> test-plan" is used here as the
// representative over-limit-target advance, exercising the same
// handlePostBoardAdvance/completeStage machinery as every other stage hop.
queue.push(function() {
  return test('advanceIntoOverLimitColumnStillSucceeds: clicking Advance into an already-over-limit "test-plan" column still succeeds', async function() {
    const { products, journey, store } = freshAll();

    // Pre-populate "test-plan" with 5 journeys -- already over the default
    // limit of 4 -- purely to prove the board's WIP-limit display state has
    // zero bearing on the real advance action below (advisory only, AC3).
    const existingTestPlanRows = [];
    for (let i = 0; i < 5; i++) existingTestPlanRows.push({ journey_id: 'existing-tp-' + i, feature_slug: 'existing-' + i, stage: 'test-plan' });
    const columnsBeforeAdvance = buildProductKanbanColumns(existingTestPlanRows);
    const htmlBeforeAdvance = renderKanban({ columns: columnsBeforeAdvance });
    assert.ok(hasOverLimitElement(htmlBeforeAdvance), 'precondition: "test-plan" column must already render as over-limit before the real advance is attempted');

    // The real ready card, currently in "review", about to be advanced INTO "test-plan".
    const journeyObj = store.createJourney('s3-3-it1-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it1-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-wip' });
    const sid = 'sid-s3-3-it1-' + Date.now();
    store.setActiveSession(journeyId, sid, 'review');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setPipelineStateWriter(function() {});
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return { skillName: 'review', done: true, artefactPath: null, artefactContent: '# Review done', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { if (id === sid) map[id] = { done: true }; });
      return map;
    });

    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) return [{ tenant_id: 'tenant-wip' }];
      return [];
    });

    const req = { session: { tenantId: 'tenant-wip', accessToken: 'tok', login: 'user' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    assert.strictEqual(res._statusCode, 200, 'advance into an already-over-limit column must still succeed (200), got ' + res._statusCode + ' body=' + res._body);
    const updated = store.getJourney(journeyId);
    assert.strictEqual(updated.activeSkill, 'test-plan', 'journey must have genuinely advanced into the over-limit "test-plan" stage -- WIP-limit state has zero effect on the real action');
  });
});

// ---------------------------------------------------------------------------
// Integration: dragIntoOverLimitColumnStillSucceeds (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('dragIntoOverLimitColumnStillSucceeds: dropping a card into an already-over-limit column still succeeds (S3.1 calls the same endpoint as click-advance -- no separate backend mechanism, per s3.1-drag-to-advance.md)', async function() {
    const { products, journey, store } = freshAll();

    // Same over-limit precondition as the click-advance test above.
    const existingTestPlanRows = [];
    for (let i = 0; i < 5; i++) existingTestPlanRows.push({ journey_id: 'existing-tp-drag-' + i, feature_slug: 'existing-drag-' + i, stage: 'test-plan' });
    const columnsBeforeDrag = buildProductKanbanColumns(existingTestPlanRows);
    const htmlBeforeDrag = renderKanban({ columns: columnsBeforeDrag });
    assert.ok(hasOverLimitElement(htmlBeforeDrag), 'precondition: "test-plan" column must already render as over-limit before the real drag-drop advance is attempted');

    const journeyObj = store.createJourney('s3-3-it2-feature');
    const journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it2-story']);
    store.setJourneyFields(journeyId, { tenantId: 'tenant-wip-drag' });
    const sid = 'sid-s3-3-it2-' + Date.now();
    store.setActiveSession(journeyId, sid, 'review');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setPipelineStateWriter(function() {});
    if (typeof journey.setWriteTrace === 'function') journey.setWriteTrace(function() {});
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return { skillName: 'review', done: true, artefactPath: null, artefactContent: '# Review done', journeyId: journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });
    products.setGetHtmlSessionsBulk(function(sessionIds) {
      const map = {};
      (sessionIds || []).forEach(function(id) { if (id === sid) map[id] = { done: true }; });
      return map;
    });

    const pool = makeMockPool(function(sql) {
      if (/FROM journeys WHERE journey_id/i.test(sql)) return [{ tenant_id: 'tenant-wip-drag' }];
      return [];
    });

    // Drag-drop (S3.1) is client-side HTML5 drag-and-drop that, on a valid
    // drop, calls this exact same POST /api/board/journey/:journeyId/advance
    // endpoint -- there is no separate backend mechanism to exercise.
    const req = { session: { tenantId: 'tenant-wip-drag', accessToken: 'tok', login: 'user' }, params: { journeyId: journeyId } };
    const res = makeMockRes();
    await products.handlePostBoardAdvance(req, res, null, pool, null);

    assert.strictEqual(res._statusCode, 200, 'drop into an already-over-limit column must still succeed (200), got ' + res._statusCode + ' body=' + res._body);
    const updated = store.getJourney(journeyId);
    assert.strictEqual(updated.activeSkill, 'test-plan', 'journey must have genuinely advanced into the over-limit "test-plan" stage via drop -- WIP-limit state has zero effect on the real action');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-s3.3-advisory-wip-limits.js');
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
