'use strict';
const assert = require('assert');
const products = require('../src/web-ui/routes/products.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

(async function main() {
  console.log('\n[sob-s3] AC1/AC2 -- _enrichColumnsWithSessionOrigin derives card.sessionOrigin from the raw completedStages bulk read');
  await testAsync('fully session-backed and mixed cards each get the correct tri-state value', async function() {
    // _getSessionOriginBulk (getSessionOriginForJourneys) returns RAW
    // completedStages arrays keyed by journeyId, not a pre-derived
    // tri-state -- deriveSessionOrigin is called per-card inside
    // _enrichColumnsWithSessionOrigin itself. See sob-s3-plan.md Task 2
    // Step 3's note for why (confirmed by reading journey-store-pg.js
    // directly, not assumed).
    products.setGetSessionOriginBulk(async function(journeyIds) {
      assert.deepStrictEqual(journeyIds.sort(), ['j1', 'j2']);
      return {
        j1: [{ sessionId: 's1' }, { sessionId: 's2' }],
        j2: [{ sessionId: 's1' }, { sessionId: null }]
      };
    });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }, { id: 'j2' }] }];
      await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(columns[0].cards[0].sessionOrigin, 'fully-session-backed');
      assert.strictEqual(columns[0].cards[1].sessionOrigin, 'mixed');
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC3 -- handleGetOrgKanban calls the shared _getSessionOriginBulk seam, not a second implementation');
  await testAsync('_enrichColumnsWithSessionOrigin is the only path org kanban uses to populate sessionOrigin', async function() {
    let callCount = 0;
    products.setGetSessionOriginBulk(async function() { callCount++; return {}; });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }] }];
      await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(callCount, 1, 'expected exactly one call to the shared bulk seam');
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC4 -- a bulk-read failure omits sessionOrigin without throwing');
  await testAsync('board render survives a thrown bulk read, cards simply have no sessionOrigin', async function() {
    products.setGetSessionOriginBulk(async function() { throw new Error('db down'); });
    try {
      const columns = [{ stage: 'discovery', cards: [{ id: 'j1' }] }];
      const result = await products._enrichColumnsWithSessionOrigin(columns);
      assert.strictEqual(result[0].cards[0].sessionOrigin, undefined);
    } finally {
      products.setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s3] AC5 -- handleGetOrgKanban\'s own query has no taxonomy-merge call (documents the "no session" state is structurally unreachable there today)');
  test('handleGetOrgKanban source contains no taxonomy-merge/mergeFeatureSources reference', function() {
    const src = require('fs').readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
    const fnStart = src.indexOf('async function handleGetOrgKanban');
    const fnEnd = src.indexOf('\nasync function ', fnStart + 10);
    const fnBody = src.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);
    assert.ok(!/mergeFeatureSources|taxonomy/i.test(fnBody), 'handleGetOrgKanban must not merge in taxonomy-only (non-journey) rows -- its query is journeys-table-only by design (see decisions.md/story Architecture Constraints)');
  });

  console.log('\n[sob-s3] AC1/AC2 (render-level) -- kanban-view renders the session-origin badge from card.sessionOrigin');
  test('renderKanban outputs data-sob-session-origin for a card carrying sessionOrigin', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j1', title: 'Test', sessionOrigin: 'fully-session-backed' }] }]
    });
    assert.ok(html.includes('data-sob-session-origin="fully-session-backed"'), 'expected the session-origin badge to render on a card carrying sessionOrigin');
  });

  test('sob-s4: the badge carries the sw-pill--neutral tone modifier, not just sw-pill sw-pill--nodot', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j3', title: 'Test3', sessionOrigin: 'fully-session-backed' }] }]
    });
    assert.ok(html.includes('class="sw-pill sw-pill--nodot sw-pill--neutral"'),
      'expected the session-origin badge to carry sw-pill--neutral so it actually gets a background colour');
  });

  test('renderKanban outputs data-sob-session-origin for a card carrying the "mixed" tri-state (AC2, render-level -- not just Task 2\'s data-derivation coverage)', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j2', title: 'Test2', sessionOrigin: 'mixed' }] }]
    });
    assert.ok(html.includes('data-sob-session-origin="mixed"'), 'expected the mixed-state session-origin badge to render');
  });

  test('renderKanban renders no session-origin badge for a card without sessionOrigin (zero behaviour change for other callers)', function() {
    const kanbanView = require('../src/web-ui/views/kanban-view.js');
    const html = kanbanView.renderKanban({
      columns: [{ stage: 'discovery', cards: [{ id: 'j3', title: 'Test3' }] }]
    });
    assert.ok(!html.includes('data-sob-session-origin'), 'expected no session-origin badge for a card the caller never enriched');
  });

  console.log('\n--- sob-s3 full results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
})();
