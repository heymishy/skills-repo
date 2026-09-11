// check-ibg-s1-dashboard-impersonation-banner.js — AC verification tests for ibg-s1
// Story: artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
// Test plan: artefacts/2026-08-17-impersonation-banner-dashboard-gap/test-plans/ibg-s1-test-plan.md
// No external dependencies — Node.js built-ins only.

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
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

function makeMockPool(products, journeysByProduct) {
  return {
    query: async function(sql, params) {
      if (sql.includes('FROM products')) {
        return { rows: products || [] };
      }
      if (sql.includes('product_id IS NULL')) {
        return { rows: [] };
      }
      if (sql.includes('WHERE product_id = $1')) {
        const pid = params && params[0];
        const rows = ((journeysByProduct || {})[pid] || []).map(function(j) {
          return Object.assign({ updated_at: '2026-08-01' }, j);
        });
        return { rows: rows };
      }
      return { rows: [] };
    }
  };
}

function makeImpersonatingSession(extra) {
  return Object.assign({
    tenantId: 'tenant-1',
    login: 'alice',
    sessionId: 'sess-ibg-s1',
    impersonation: {
      active: true,
      admin: { userId: 1, login: 'alice', tenantId: 'tenant-1', role: 'admin' },
      target: { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }
    }
  }, extra || {});
}

const twoProducts = [
  { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
  { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
];
const twoProductJourneys = {
  p1: [{ journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery' }],
  p2: [{ journey_id: 'j2', feature_slug: 'feat-b', stage: 'review' }]
};

async function runTests() {

  console.log('\nT1 -- activeImpersonationRendersBannerOnMainDashboard (AC1)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys);
    const req = { session: makeImpersonatingSession(), query: {} };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard -> 200');
    assert(res._body.includes('<div class="sw-imp-banner"'), 'impersonation banner div rendered on main dashboard view');
    assert(res._body.includes('Exit impersonation') && res._body.includes('bob'), 'banner exit control present and references the impersonated target login (bob)');
  }

  console.log('\nT2 -- activeImpersonationRendersBannerOnBoardView (AC1)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys);
    const req = { session: makeImpersonatingSession(), query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard?view=board -> 200');
    assert(res._body.includes('<div class="sw-imp-banner"'), 'impersonation banner div rendered on board view (same route, same accountability gap)');
    assert(res._body.includes('Exit impersonation') && res._body.includes('bob'), 'banner exit control present and references the impersonated target login (bob) on board view too');
  }

  console.log('\nT3 -- noImpersonationNoBannerMainDashboard (AC2)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys);
    const req = { session: { tenantId: 'tenant-1', login: 'alice' }, query: {} };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard (no impersonation) -> 200');
    assert(!res._body.includes('<div class="sw-imp-banner"') && !res._body.includes('Exit impersonation'), 'no impersonation banner div/exit-control when session is not impersonating');
    assert(res._body.includes('Product One') && res._body.includes('Product Two'), 'product list still renders unchanged');
  }

  console.log('\nT4 -- noImpersonationNoBannerBoardView (AC2, non-regression)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys);
    const req = { session: { tenantId: 'tenant-1', login: 'alice' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard?view=board (no impersonation) -> 200');
    assert(!res._body.includes('<div class="sw-imp-banner"') && !res._body.includes('Exit impersonation'), 'no impersonation banner div/exit-control on board view when session is not impersonating');
    assert(res._body.includes('feat-a') && res._body.includes('feat-b'), 'board content still renders unchanged');
  }

  console.log('\nT5 -- bannerCarriesRealCsrfToken (AC3)');
  {
    const pool = makeMockPool(twoProducts, twoProductJourneys);
    const req = { session: makeImpersonatingSession(), query: {} };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    const csrfMatch = res._body.match(/name="_csrf"\s+value="([^"]+)"/);
    assert(!!csrfMatch && !!csrfMatch[1] && csrfMatch[1].length > 10, 'exit-impersonation form carries a real, non-placeholder CSRF token');
  }

  console.log('\nT6 -- existingD2SuiteStillPasses (AC4, regression, integration)');
  {
    try {
      execFileSync(process.execPath, [path.join(ROOT, 'tests/check-d2-banner-exit-permission-visibility.js')], { stdio: 'pipe' });
      assert(true, 'check-d2-banner-exit-permission-visibility.js exits 0 (no regression)');
    } catch (e) {
      assert(false, 'check-d2-banner-exit-permission-visibility.js exits 0 (no regression): ' + (e.stdout || e.message || '').toString().slice(0, 400));
    }
  }

  console.log('\n[ibg-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

runTests();
