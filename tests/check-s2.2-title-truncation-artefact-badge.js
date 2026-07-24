// check-s2.2-title-truncation-artefact-badge.js -- TDD tests for s2.2 (Epic 2, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s2.2-title-truncation-artefact-badge.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s2.2-title-truncation-artefact-badge-test-plan.md
//
// Covers: Unit (longTitleTruncatesAt48Chars, shortTitleDisplaysUnmodified,
// artefactBadgeShown_IF_dataAvailable), Integration (fullTitleAvailableViaHoverAttribute,
// artefactCountDataFetchIntegration, titleTruncationShipsIndependentOfBadgeOutcome),
// NFR (artefactCountLookupNotUnboundedN1).

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

function freshProducts() {
  try { delete require.cache[require.resolve(PRODUCTS_PATH)]; } catch (_) {}
  return require(PRODUCTS_PATH);
}

function makeMockRes() {
  return {
    _statusCode: null, _headers: {}, _body: '',
    writeHead(code, headers) { this._statusCode = code; this._headers = headers || {}; },
    end(body) { this._body += (body || ''); }
  };
}

// Same shape as tests/check-psh-s6-product-kanban.js's makeMockPool.
function makeMockPool(journeys, tenantId) {
  return {
    query: async function(sql, params) {
      if (/SELECT tenant_id FROM products WHERE product_id/i.test(sql)) {
        return { rows: [{ tenant_id: tenantId }] };
      }
      if (/FROM journeys WHERE.*product_id/i.test(sql)) {
        const pid = params && params[0];
        return { rows: pid ? journeys.filter(j => j.product_id === pid) : journeys };
      }
      return { rows: [] };
    }
  };
}

const queue = [];

// ---------------------------------------------------------------------------
// Unit: longTitleTruncatesAt48Chars (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('longTitleTruncatesAt48Chars: a 60-char card title truncates to 48 chars + ellipsis via truncateTitle()', function() {
    const { _renderKanbanColumns, truncateTitle } = require('../src/web-ui/views/kanban-view');

    const longTitle = 'A'.repeat(60);
    const columns = [{ stage: 'discovery', cards: [{ id: 'j1', title: longTitle }] }];
    const html = _renderKanbanColumns({ columns: columns });

    const titleDivMatch = html.match(/<div class="kb-card-title">([^<]*)<\/div>/);
    assert.ok(titleDivMatch, 'kb-card-title div found');
    const displayed = titleDivMatch[1];
    assert.ok(displayed.length <= 49, 'displayed title is 48 chars + ellipsis (' + displayed.length + ' chars)');
    assert.ok(displayed.endsWith('…'), 'displayed title ends with an ellipsis character');
    assert.strictEqual(displayed, truncateTitle(longTitle, 48), 'displayed title matches the existing truncateTitle() output exactly -- not a new implementation');
    assert.notStrictEqual(displayed, longTitle, 'the full 60-char title is not shown verbatim');
  });
});

// ---------------------------------------------------------------------------
// Unit: shortTitleDisplaysUnmodified (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('shortTitleDisplaysUnmodified: a 30-char card title displays unmodified, no truncation', function() {
    const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

    const shortTitle = 'B'.repeat(30);
    const columns = [{ stage: 'discovery', cards: [{ id: 'j2', title: shortTitle }] }];
    const html = _renderKanbanColumns({ columns: columns });

    const titleDivMatch = html.match(/<div class="kb-card-title">([^<]*)<\/div>/);
    assert.ok(titleDivMatch, 'kb-card-title div found');
    assert.strictEqual(titleDivMatch[1], shortTitle, 'full 30-char title displayed unmodified');
    assert.ok(!titleDivMatch[1].endsWith('…'), 'no ellipsis appended for a short title');
  });
});

// ---------------------------------------------------------------------------
// Unit: artefactBadgeShown_IF_dataAvailable (AC4, conditional)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('artefactBadgeShown_IF_dataAvailable: a card with a known artefact count renders the matching badge (3 and 0 cases)', function() {
    const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

    const htmlWithCount = _renderKanbanColumns({
      columns: [{ stage: 'discovery', cards: [{ id: 'j3', title: 'Feature A', artefactCount: 3 }] }]
    });
    assert.ok(htmlWithCount.includes('kb-artefact-badge'), 'artefact-count badge class rendered');
    assert.ok(/3\s*artefacts/.test(htmlWithCount), 'count text "3 artefacts" rendered');

    const htmlEmpty = _renderKanbanColumns({
      columns: [{ stage: 'discovery', cards: [{ id: 'j4', title: 'Feature B', artefactCount: 0 }] }]
    });
    assert.ok(/no artefacts yet/i.test(htmlEmpty), 'explicit "no artefacts yet" state for zero-artefact card, distinct from the n-artefacts case');

    const htmlNoData = _renderKanbanColumns({
      columns: [{ stage: 'discovery', cards: [{ id: 'j5', title: 'Feature C' }] }]
    });
    assert.ok(!/<span class="kb-artefact-badge/.test(htmlNoData), 'no badge <span> element rendered when the caller never supplied artefactCount (backward-compatible, zero behaviour change; the CSS rule name alone always appears in the static stylesheet, so this checks for the actual element)');
  });
});

// ---------------------------------------------------------------------------
// Integration: fullTitleAvailableViaHoverAttribute (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('fullTitleAvailableViaHoverAttribute: the full untruncated title is present in a title= attribute on the card element', function() {
    const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

    const longTitle = 'A very long feature title that definitely exceeds forty eight characters in length';
    const columns = [{ stage: 'discovery', cards: [{ id: 'j6', title: longTitle }] }];
    const html = _renderKanbanColumns({ columns: columns });

    assert.ok(html.includes('title="' + longTitle + '"'), 'full title present in a title= attribute for hover/keyboard-focus access');
  });
});

// ---------------------------------------------------------------------------
// Integration: artefactCountDataFetchIntegration (AC4, conditional)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('artefactCountDataFetchIntegration: each card\'s rendered artefact count matches its real count from the (batched) data-fetch', async function() {
    const products = freshProducts();
    const { renderKanban } = require('../src/web-ui/views/kanban-view');

    assert.strictEqual(typeof products.setGetArtefactCountsBulk, 'function', 'products.js must export setGetArtefactCountsBulk for test spying');

    products.setGetArtefactCountsBulk(async function(journeyIds) {
      const map = {};
      (journeyIds || []).forEach(function(id) {
        if (id === 'j-count-3') map[id] = 3;
        if (id === 'j-count-0') map[id] = 0;
      });
      return map;
    });

    require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

    const journeys = [
      { journey_id: 'j-count-3', product_id: 'p-ac4', stage: 'discovery', health: 'green', feature_slug: 'F-three' },
      { journey_id: 'j-count-0', product_id: 'p-ac4', stage: 'discovery', health: 'green', feature_slug: 'F-zero' }
    ];
    const pool = makeMockPool(journeys, 'tenant-ac4');
    const req = { session: { tenantId: 'tenant-ac4', login: 'u' }, params: { id: 'p-ac4' } };
    const res = makeMockRes();
    const ph = { capture: function() {} };

    await products.handleGetProductKanban(req, res, null, pool, ph);

    assert.strictEqual(res._statusCode, 200, 'expected 200, got ' + res._statusCode);
    assert.ok(/3\s*artefacts/.test(res._body), 'card for j-count-3 shows "3 artefacts"');
    assert.ok(/no artefacts yet/i.test(res._body), 'card for j-count-0 shows "no artefacts yet"');
  });
});

// ---------------------------------------------------------------------------
// Integration: titleTruncationShipsIndependentOfBadgeOutcome (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('titleTruncationShipsIndependentOfBadgeOutcome: if artefact-count data is NOT obtainable, title truncation still ships', async function() {
    const products = freshProducts();

    // Simulate the "not obtainable" branch: the bulk reader throws (e.g. DB error,
    // adapter misconfiguration) -- AC5 says this must never take down the board.
    products.setGetArtefactCountsBulk(async function() {
      throw new Error('simulated: artefact-count data unavailable');
    });

    require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

    const longTitle = 'A'.repeat(60);
    const journeys = [
      { journey_id: 'j-fallback', product_id: 'p-ac5', stage: 'discovery', health: 'green', feature_slug: longTitle }
    ];
    const pool = makeMockPool(journeys, 'tenant-ac5');
    const req = { session: { tenantId: 'tenant-ac5', login: 'u' }, params: { id: 'p-ac5' } };
    const res = makeMockRes();
    const ph = { capture: function() {} };

    await products.handleGetProductKanban(req, res, null, pool, ph);

    assert.strictEqual(res._statusCode, 200, 'board render must still succeed (200) even when artefact-count data-fetch fails, got ' + res._statusCode);
    assert.ok(res._body.includes('…'), 'long title still truncates with an ellipsis even though the artefact-count fetch failed');
    assert.ok(!/<span class="kb-artefact-badge/.test(res._body), 'no artefact badge <span> element rendered when the data-fetch fails (graceful degrade, not a crash; the CSS rule name alone always appears in the static stylesheet, so this checks for the actual element)');
  });
});

// ---------------------------------------------------------------------------
// NFR: artefactCountLookupNotUnboundedN1
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('artefactCountLookupNotUnboundedN1: bulk artefact-count read call count stays constant as N grows', async function() {
    const products = freshProducts();

    require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

    let bulkCallCount = 0;
    products.setGetArtefactCountsBulk(async function(journeyIds) {
      bulkCallCount++;
      const map = {};
      (journeyIds || []).forEach(function(id) { map[id] = 1; });
      return map;
    });

    function journeysFor(n, productId, tenantId) {
      const rows = [];
      for (let i = 0; i < n; i++) {
        rows.push({ journey_id: 'j' + i, product_id: productId, stage: 'discovery', health: 'green', feature_slug: 'feature-' + i });
      }
      return rows;
    }

    const ph = { capture: function() {} };

    bulkCallCount = 0;
    const pool5 = makeMockPool(journeysFor(5, 'p5', 't5'), 't5');
    await products.handleGetProductKanban({ session: { tenantId: 't5', login: 'u' }, params: { id: 'p5' } }, makeMockRes(), null, pool5, ph);
    const callsForN5 = bulkCallCount;

    bulkCallCount = 0;
    const pool50 = makeMockPool(journeysFor(50, 'p50', 't50'), 't50');
    await products.handleGetProductKanban({ session: { tenantId: 't50', login: 'u' }, params: { id: 'p50' } }, makeMockRes(), null, pool50, ph);
    const callsForN50 = bulkCallCount;

    assert.strictEqual(callsForN5, 1, 'exactly one bulk artefact-count call for N=5 (batched, not per-card)');
    assert.strictEqual(callsForN50, 1, 'exactly one bulk artefact-count call for N=50 (batched, not per-card)');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-s2.2-title-truncation-artefact-badge.js');
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
