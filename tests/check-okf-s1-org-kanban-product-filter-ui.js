'use strict';
// check-okf-s1-org-kanban-product-filter-ui.js — unit/integration tests for okf-s1
// (org kanban had a working, tested `?product=<id>` server-side filter, but no
// UI control anywhere to trigger it).
//
// Story:      artefacts/2026-08-10-org-kanban-filter-ui-gap/stories/okf-s1-product-filter-dropdown.md
// Test plan:  artefacts/2026-08-10-org-kanban-filter-ui-gap/test-plans/okf-s1-test-plan.md
//
// Coverage:
//   AC1 (unit + integration) — dropdown renders with all products + "All products", unfiltered board unchanged
//   AC2 (integration)        — selecting a product navigates with ?product=<id> and filters the board
//   AC3 (unit)                — filtered reload echoes the selected option
//   AC4 (unit)                — single-product account: no dropdown

const assert = require('assert');

function makeMockPool(products, journeys) {
  return {
    query: async function(sql, params) {
      if (/FROM products WHERE tenant_id/i.test(sql)) {
        return { rows: products.filter(p => !params || p.tenant_id === params[0]) };
      }
      if (/FROM journeys.*product_id.*=.*\$1/i.test(sql) || /FROM journeys WHERE product_id/i.test(sql)) {
        const pid = params && params[0];
        const tid = params && params[1];
        let rows = journeys.filter(j => j.product_id === pid);
        if (tid) rows = rows.filter(j => j.tenant_id === tid);
        return { rows };
      }
      return { rows: [] };
    }
  };
}

function makeMockRes() {
  const res = { _b: null, _raw: null, _headers: {}, _statusCode: null };
  res.json = function(b) { this._b = b; return this; };
  res.status = function(c) { this._statusCode = c; return this; };
  res.writeHead = function(code, hdrs) { this._statusCode = code; if (hdrs) Object.assign(this._headers, hdrs); return this; };
  res.end = function(data) { this._raw = data; return this; };
  return res;
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const FORM_MARK = '<form method="GET" action="/org/kanban"';

(async function() {
  const { handleGetOrgKanban } = require('../src/web-ui/routes/products');
  const { renderKanban } = require('../src/web-ui/views/kanban-view');
  require('../src/web-ui/modules/posthog-flags').setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });

  const columns = [{ stage: 'discovery', cards: [] }];

  // ── AC1 (unit): dropdown renders with all products + "All products" ──
  try {
    const html = renderKanban({
      columns: columns,
      products: [{ id: 'p1', name: 'Product One' }, { id: 'p2', name: 'Product Two' }],
      selectedProductId: null
    });
    assert(html.includes(FORM_MARK), 'Expected the filter form to render');
    assert(html.includes('<option value="" selected>All products</option>'), 'Expected an "All products" option, selected by default');
    assert(html.includes('Product One') && html.includes('Product Two'), 'Expected both products listed as options');
    pass('renderKanban_multipleProducts_rendersFilterDropdownWithAllProductsOption');
  } catch (e) { fail('renderKanban_multipleProducts_rendersFilterDropdownWithAllProductsOption', e); }

  // ── AC4 (unit): single-product account -> no dropdown ──
  try {
    const html = renderKanban({
      columns: columns,
      products: [{ id: 'p1', name: 'Product One' }],
      selectedProductId: null
    });
    assert(!html.includes(FORM_MARK), 'Expected no filter form with only 1 product');
    pass('renderKanban_singleProduct_noDropdownOrDisabled');
  } catch (e) { fail('renderKanban_singleProduct_noDropdownOrDisabled', e); }

  // ── AC3 (unit): filtered reload echoes the selected option ──
  try {
    const html = renderKanban({
      columns: columns,
      products: [{ id: 'p1', name: 'Product One' }, { id: 'p2', name: 'Product Two' }],
      selectedProductId: 'p2'
    });
    assert(html.includes('<option value="p2" selected>Product Two</option>'), 'Expected p2 to carry the selected attribute');
    assert(!html.includes('<option value="p1" selected>'), 'Expected p1 to NOT carry the selected attribute');
    assert(!html.includes('value="" selected'), 'Expected "All products" to NOT be selected when a specific product is filtered');
    pass('renderKanban_filteredReload_selectedOptionReflectsCurrentFilter');
  } catch (e) { fail('renderKanban_filteredReload_selectedOptionReflectsCurrentFilter', e); }

  const products = [
    { product_id: 'pA', name: 'Product A', tenant_id: 'tx' },
    { product_id: 'pB', name: 'Product B', tenant_id: 'tx' }
  ];
  const journeys = [
    { journey_id: 'j1', product_id: 'pA', tenant_id: 'tx', stage: 'discovery', health: 'green', feature_slug: 'f1' },
    { journey_id: 'j2', product_id: 'pB', tenant_id: 'tx', stage: 'discovery', health: 'green', feature_slug: 'f2' }
  ];

  // ── AC1 (integration): no product param -> full product list + unfiltered columns ──
  try {
    const ph = { capture: function() {} };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: {} };
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, null, pool, ph);
    assert(res._raw.includes('Product A: f1') && res._raw.includes('Product B: f2'), 'Expected both products\' journey cards in unfiltered board (unchanged behaviour)');
    assert(res._raw.includes(FORM_MARK), 'Expected the filter dropdown to render');
    assert(res._raw.includes('<option value="pA">Product A</option>') && res._raw.includes('<option value="pB">Product B</option>'), 'Expected both products listed in the dropdown');
    pass('handleGetOrgKanban_noProductParam_passesFullProductListAndUnfilteredColumns');
  } catch (e) { fail('handleGetOrgKanban_noProductParam_passesFullProductListAndUnfilteredColumns', e); }

  // ── AC2 (integration): ?product=<id> filters the board AND the dropdown shows it selected ──
  try {
    const ph = { capture: function() {} };
    const pool = makeMockPool(products, journeys);
    const req = { session: { tenantId: 'tx', login: 'u' }, query: { product: 'pB' } };
    const res = makeMockRes();
    await handleGetOrgKanban(req, res, null, pool, ph);
    // Card titles are "ProductName: cardLabel" (_aggregateJourneysByStage) --
    // a different, bounded shape from the dropdown's plain "Product A"
    // option text, so this correctly excludes Product A's CARD while still
    // allowing "Product A" to legitimately appear as one of the dropdown's
    // own listed options (AC1 requires every product stays listed there
    // regardless of which one is currently filtered).
    assert(res._raw.includes('Product B: f2'), 'Expected Product B\'s journey card in the filtered board');
    assert(!res._raw.includes('Product A: f1'), 'Expected Product A\'s journey card excluded from the filtered board');
    assert(res._raw.includes('<option value="pB" selected>Product B</option>'), 'Expected the dropdown to reflect pB as selected');
    assert(res._raw.includes('<option value="pA">Product A</option>'), 'Expected Product A to still be listed as a dropdown option (not removed, just not selected)');
    pass('handleGetOrgKanban_withProductParam_dropdownNavigationFiltersBoard');
  } catch (e) { fail('handleGetOrgKanban_withProductParam_dropdownNavigationFiltersBoard', e); }

  console.log(`\n[okf-s1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
