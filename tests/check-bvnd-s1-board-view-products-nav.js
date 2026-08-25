// check-bvnd-s1-board-view-products-nav.js — AC verification tests for bvnd-s1
// Story: artefacts/2026-08-25-board-view-nav-dead-end/stories/bvnd-s1-fix-board-view-missing-products-nav.md
// No external dependencies — Node.js built-ins only.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

const { handleGetDashboard } = require('../src/web-ui/routes/products');

function makeMockRes() {
  return {
    _statusCode: null, _headers: {}, _body: '',
    writeHead(code, headers) { this._statusCode = code; this._headers = headers || {}; },
    end(body) { this._body = body || ''; }
  };
}

// Mock pool covering both buildTenantKanbanColumns' queries (products +
// per-product journeys with stage) and getProductsNavSummary's queries
// (products + per-product journeys with updated_at + tenant-wide no-product
// journey count).
function makeMockPool(products, journeysByProduct, noProductJourneyIds) {
  return {
    query: async function(sql, params) {
      if (sql.includes('FROM products')) {
        return { rows: products };
      }
      if (sql.includes('product_id IS NULL')) {
        return { rows: (noProductJourneyIds || []).map(function(id) { return { journey_id: id }; }) };
      }
      if (sql.includes('WHERE product_id = $1')) {
        const pid = params && params[0];
        const rows = (journeysByProduct[pid] || []).map(function(j) {
          return Object.assign({ updated_at: '2026-08-01' }, j);
        });
        return { rows: rows };
      }
      return { rows: [] };
    }
  };
}

async function runTests() {
  const twoProducts = [
    { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
    { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
  ];
  const twoProductJourneys = {
    p1: [{ journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery' }],
    p2: [{ journey_id: 'j2', feature_slug: 'feat-b', stage: 'review' }]
  };

  console.log('\nT1 -- boardViewIncludesProductsNavSection (AC1)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys, []);
    const req = { session: { tenantId: 'tenant-1' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard?view=board -> 200');
    assert(res._body.includes('sw-product-nav-item'), 'response includes Products nav item rows');
    assert(res._body.includes('Product One') && res._body.includes('Product Two'), 'both product names present in nav');
    assert(res._body.includes('See all products') || res._body.includes('/dashboard'), '"See all products" link present');
    assert(res._body.includes('/products/new'), '"New product" link (/products/new) present');
  }

  console.log('\nT2 -- boardViewProductsMatchNonBoardView (AC1, AC3)');
  {
    const poolBoard = makeMockPool(twoProducts, twoProductJourneys, []);
    const reqBoard = { session: { tenantId: 'tenant-1' }, query: { view: 'board' } };
    const resBoard = makeMockRes();
    await handleGetDashboard(reqBoard, resBoard, null, poolBoard);

    const poolNonBoard = makeMockPool(twoProducts, twoProductJourneys, []);
    const reqNonBoard = { session: { tenantId: 'tenant-1' }, query: {} };
    const resNonBoard = makeMockRes();
    await handleGetDashboard(reqNonBoard, resNonBoard, null, poolNonBoard);

    assert(resBoard._body.includes('Product One') && resNonBoard._body.includes('Product One'),
      'Product One present in both board and non-board views');
    assert(resBoard._body.includes('Product Two') && resNonBoard._body.includes('Product Two'),
      'Product Two present in both board and non-board views');
  }

  console.log('\nT3 -- emptyTenantBoardViewShowsCreateProductCta (AC2)');
  {
    const pool = makeMockPool([], {}, []);
    const req = { session: { tenantId: 'tenant-empty' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'empty tenant board view -> 200');
    assert(res._body.toLowerCase().includes('first product'), 'empty-state CTA text present ("first product")');
    assert(res._body.includes('/products/new'), 'empty-state CTA links to /products/new');
  }

  console.log('\nT4 -- nonEmptyTenantBoardViewDoesNotShowEmptyCta (AC2, non-regression)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys, []);
    const req = { session: { tenantId: 'tenant-1' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(!res._body.toLowerCase().includes('no products yet'), 'empty-state CTA not shown for a tenant with products');
  }

  console.log('\nT5 -- boardViewReusesGetProductsNavSummary (AC3, structural)');
  {
    const src = fs.readFileSync(path.join(ROOT, 'src/web-ui/routes/products.js'), 'utf8');
    const boardBranchStart = src.indexOf("req.query.view === 'board'");
    const boardBranchEnd = src.indexOf('\n  }', boardBranchStart);
    const boardBranchSrc = src.slice(boardBranchStart, boardBranchEnd);
    assert(boardBranchSrc.includes('getProductsNavSummary('), 'board branch calls getProductsNavSummary()');
  }

  console.log('\nT6 -- kanbanColumnsRenderingUnchanged (AC4, non-regression)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys, []);
    const req = { session: { tenantId: 'tenant-1' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._body.includes('feat-a'), 'tenant board still includes product-1 journey');
    assert(res._body.includes('feat-b'), 'tenant board still includes product-2 journey');
  }

  console.log('\nT7 -- existingKanbanConsolidationSuiteStillPasses (AC4, non-regression, integration)');
  {
    try {
      execFileSync(process.execPath, [path.join(ROOT, 'tests/check-kanban-consolidation.js')], { stdio: 'pipe' });
      assert(true, 'check-kanban-consolidation.js exits 0 (no regression)');
    } catch (e) {
      assert(false, 'check-kanban-consolidation.js exits 0 (no regression): ' + (e.stdout || e.message || '').toString().slice(0, 300));
    }
  }

  console.log('\n[bvnd-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

runTests();
