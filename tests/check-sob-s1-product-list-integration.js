// tests/check-sob-s1-product-list-integration.js
'use strict';
const assert = require('assert');
const { getSessionOriginForJourneys } = require('../src/web-ui/adapters/journey-store-pg.js');
const { _getSessionOriginBulk, setGetSessionOriginBulk, _renderConsolidatedFeaturesSection, handleGetProductView } = require('../src/web-ui/routes/products.js');

let passed = 0, failed = 0;
function test(name, fn) {
  const p = Promise.resolve().then(fn);
  return p.then(function() { console.log('  ✓ ' + name); passed++; })
    .catch(function(e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; });
}

async function main() {
  console.log('\n[sob-s1] getSessionOriginForJourneys -- no pool configured returns {}');
  await test('returns empty object with no DATABASE_URL/pool wired', async function() {
    const result = await getSessionOriginForJourneys(['j1', 'j2']);
    assert.deepStrictEqual(result, {});
  });
  await test('returns empty object for an empty journeyIds array', async function() {
    const result = await getSessionOriginForJourneys([]);
    assert.deepStrictEqual(result, {});
  });

  console.log('\n[sob-s1] _getSessionOriginBulk -- injectable seam calls the wired fn exactly once');
  await test('setGetSessionOriginBulk spy is called exactly once with the exact journeyIds array', async function() {
    let callCount = 0;
    let receivedArgs = null;
    setGetSessionOriginBulk(function(journeyIds) {
      callCount++;
      receivedArgs = journeyIds;
      return Promise.resolve({});
    });
    try {
      await _getSessionOriginBulk(['j1', 'j2', 'j3']);
      assert.strictEqual(callCount, 1);
      assert.deepStrictEqual(receivedArgs, ['j1', 'j2', 'j3']);
    } finally {
      setGetSessionOriginBulk(null);
    }
  });

  console.log('\n[sob-s1] _renderConsolidatedFeaturesSection -- session-origin indicator wiring (AC4, AC5, AC7, AC8)');

  await test('AC4: taxonomy-only mergedItems entry (no journeyId) renders the "no-session" indicator', async function() {
    var items = [{
      slug: 'tax-1',
      name: 'Taxonomy-only Feature',
      health: 'green',
      coverageLabel: 'No test data yet',
      source: 'taxonomy'
      // deliberately no journeyId field at all -- mirrors mergeFeatureSources'
      // real output shape for a CLI-authored, taxonomy-only feature.
    }];
    var html = _renderConsolidatedFeaturesSection(items, [], null, 'p1', 'csrf-tok', null, {});
    assert.ok(html.indexOf('data-sob-session-origin="no-session"') !== -1,
      'expected a no-session indicator for a taxonomy-only item with no journeyId');
  });

  await test('sob-s4: the badge carries the sw-pill--neutral tone modifier, not just sw-pill sw-pill--nodot', async function() {
    var items = [{
      slug: 'tax-2',
      name: 'Taxonomy-only Feature 2',
      health: 'green',
      coverageLabel: 'No test data yet',
      source: 'taxonomy'
    }];
    var html = _renderConsolidatedFeaturesSection(items, [], null, 'p1', 'csrf-tok', null, {});
    assert.ok(html.indexOf('class="sw-pill sw-pill--nodot sw-pill--neutral"') !== -1,
      'expected the session-origin badge to carry sw-pill--neutral so it actually gets a background colour (the base .sw-pill rule alone paints nothing)');
  });

  await test('AC5: journey-backed item with zero completed stages renders no session-origin indicator', async function() {
    var items = [{
      slug: 'jrn-1',
      name: 'Idea-stage Feature',
      health: 'unknown',
      coverageLabel: 'No test data yet',
      journeyId: 'j-empty',
      source: 'journey'
    }];
    // sessionOriginByJourneyId has an entry for j-empty, but it's an empty
    // array (zero completed stages) -- deriveSessionOrigin's own contract
    // (AC9) says this must yield null (no indicator), not "no-session".
    var sessionOriginByJourneyId = { 'j-empty': [] };
    var html = _renderConsolidatedFeaturesSection(items, [], null, 'p1', 'csrf-tok', null, sessionOriginByJourneyId);
    assert.ok(html.indexOf('data-sob-session-origin') === -1,
      'expected no session-origin indicator element at all for a zero-completed-stages journey');
  });

  await test('AC7: bulk-read failure (simulated by an empty fallback map) renders successfully with no indicators', async function() {
    // Simulates exactly what handleGetProductView's own try/catch produces
    // when the injected _getSessionOriginBulk throws: sessionOriginByJourneyId
    // falls back to {}. _getSessionOriginBulk itself does not catch (same
    // shape as _getArtefactCountsBulk) -- the catch lives in the caller, so
    // this also confirms the seam's throwing behaviour propagates as designed.
    var callCount = 0;
    setGetSessionOriginBulk(function() {
      callCount++;
      throw new Error('simulated bulk-read failure');
    });
    var thrown = false;
    try {
      await _getSessionOriginBulk(['j1']);
    } catch (e) {
      thrown = true;
    } finally {
      setGetSessionOriginBulk(null);
    }
    assert.strictEqual(thrown, true, 'expected _getSessionOriginBulk to propagate the injected throw (no swallowing at the seam itself)');
    assert.strictEqual(callCount, 1);

    // Deliberately only journey-backed items here -- a taxonomy-only item
    // (no journeyId) always shows "no-session" regardless of the bulk map's
    // state (that's AC4's correct, independent behaviour), so it would be
    // the wrong fixture for isolating "bulk-read failure degrades to no
    // indicator" (AC7) specifically.
    var items = [
      { slug: 'jrn-2', name: 'Journey Feature', health: 'green', coverageLabel: 'No test data yet', journeyId: 'j-2', source: 'journey' },
      { slug: 'jrn-3', name: 'Another Journey Feature', health: 'green', coverageLabel: 'No test data yet', journeyId: 'j-3', source: 'journey' }
    ];
    var html;
    assert.doesNotThrow(function() {
      html = _renderConsolidatedFeaturesSection(items, [], null, 'p1', 'csrf-tok', null, {});
    }, 'the page render must never throw when the bulk lookup failed upstream');
    assert.strictEqual(typeof html, 'string');
    assert.ok(html.length > 0);
    assert.ok(html.indexOf('data-sob-session-origin') === -1,
      'expected zero session-origin indicators when the bulk map degraded to {}');
  });

  await test('AC8: every rendered session-origin state carries a non-empty title naming the state', async function() {
    var cases = [
      { state: 'fully-session-backed', completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }], wordFragment: 'driven through a live session' },
      { state: 'mixed', completedStages: [{ sessionId: 's1' }, { sessionId: null }], wordFragment: 'partially resumable' },
      { state: 'no-session', completedStages: [{ sessionId: null }], wordFragment: 'No live session' }
    ];
    cases.forEach(function(c) {
      var items = [{
        slug: 'jrn-' + c.state,
        name: 'Feature ' + c.state,
        health: 'green',
        coverageLabel: 'No test data yet',
        journeyId: 'j-' + c.state,
        source: 'journey'
      }];
      var sessionOriginByJourneyId = {};
      sessionOriginByJourneyId['j-' + c.state] = c.completedStages;
      var html = _renderConsolidatedFeaturesSection(items, [], null, 'p1', 'csrf-tok', null, sessionOriginByJourneyId);
      var marker = 'data-sob-session-origin="' + c.state + '"';
      assert.ok(html.indexOf(marker) !== -1, 'expected ' + marker + ' in rendered HTML');
      var spanStart = html.indexOf(marker);
      var spanChunk = html.slice(spanStart, spanStart + 400);
      var titleMatch = spanChunk.match(/title="([^"]+)"/);
      assert.ok(titleMatch && titleMatch[1].length > 0, 'expected a non-empty title attribute for state ' + c.state);
      assert.ok(titleMatch[1].indexOf(c.wordFragment) !== -1,
        'expected title to contain "' + c.wordFragment + '" for state ' + c.state + ', got: ' + titleMatch[1]);
      var ariaMatch = spanChunk.match(/aria-label="([^"]+)"/);
      assert.ok(ariaMatch && ariaMatch[1].length > 0, 'expected a non-empty aria-label for state ' + c.state);
    });
  });

  console.log('\n[sob-s1] handleGetProductView -- _getSessionOriginBulk called exactly once per render (AC6)');

  await test('AC6: exactly one batched call to _getSessionOriginBulk regardless of journey count', async function() {
    // Mirrors check-fps-s1-progress-proxy.js's own exactlyOneBatchedCallPerRender
    // test for the sibling _getArtefactCountsBulk/setGetArtefactCountsBulk seam --
    // same mock pool shape, same spy-via-injected-setter technique, same
    // end-to-end call through handleGetProductView.
    var callCount = 0;
    var receivedJourneyIds = null;
    setGetSessionOriginBulk(function(journeyIds) {
      callCount++;
      receivedJourneyIds = journeyIds;
      return Promise.resolve({});
    });

    var journeyRows = [
      { journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' },
      { journey_id: 'j2', feature_slug: 'f2', stage: 'discovery' },
      { journey_id: 'j3', feature_slug: 'f3', stage: 'discovery' }
    ];
    var pool = {
      query: async function(sql) {
        if (/FROM products WHERE/.test(sql)) return { rows: [{ product_id: 'p1', name: 'P', tenant_id: 'tenant-1', repo_owner: null, repo_name: null }] };
        if (/FROM journeys WHERE/.test(sql)) return { rows: journeyRows };
        if (/product_rollup/.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    var req = { params: { id: 'p1' }, session: { tenantId: 'tenant-1', login: 'u' } };
    var res = {
      _status: null, _body: '',
      writeHead: function(s) { res._status = s; },
      end: function(b) { res._body += (b || ''); }
    };

    try {
      await handleGetProductView(req, res, null, pool);
      assert.strictEqual(res._status, 200, 'expected the render to actually succeed, not fail silently before reaching the bulk read');
      assert.strictEqual(callCount, 1, 'expected exactly 1 batched call to _getSessionOriginBulk regardless of the ' + journeyRows.length + ' journeys, got ' + callCount);
      assert.ok(Array.isArray(receivedJourneyIds), 'expected _getSessionOriginBulk to receive a journeyIds array');
    } finally {
      setGetSessionOriginBulk(null);
    }
  });

  console.log('\n--- sob-s1 product-list integration results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}
main();
