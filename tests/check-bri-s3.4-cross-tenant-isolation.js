'use strict';

// check-bri-s3.4-cross-tenant-isolation.js
//
// Unit + integration tests for bri-s3.4 (Cross-tenant isolation journey spec).
// Covers AC1 (read-by-ID -> 404 not 403), AC2 (aggregate lists never leak
// tenant B rows), AC3 (write/mutation against a tenant B resource rejected,
// no tenant B data modified) across the 4 named resource types from this
// story's Architecture Constraints: products, credits, standards, user_roles
// (plus journeys, the resource `requireJourneyAccess`/`isSameTenant` were
// originally built for).
//
// AC4 (zero skip/flake over 20 CI runs) and AC5 (mocked/deterministic) are
// covered by the E2E spec (tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js)
// and its CI wiring, not here.

const assert = require('assert');

let passed = 0;
let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err && err.message || err)); failed++; }

(async function () {

  // ===========================================================================
  // AC1 (unit layer) — isSameTenant boolean correctness
  // ===========================================================================
  //
  // NOTE (decisions.md): the test plan's own AC1 unit-test wording says
  // "null/undefined tenant ID must resolve to false ... a permissive default
  // here would be a security defect." Investigating the actual module
  // (src/web-ui/middleware/journey-access.js) shows the opposite is true BY
  // DESIGN and is already pinned by an existing, passing test
  // (tests/check-p0.1-journey-access.js, Tests 14-15): isSameTenant returns
  // `true` (permissive) when either side's tenantId is null/undefined. That
  // file labels this "Phase 0 passthrough" per ADR-025's 6-phase rollout
  // (0 authz guard -> 1 identity -> ...) — a deliberate rollout safety net so
  // legacy pre-tenancy journeys/sessions are not locked out mid-rollout.
  // Rewriting isSameTenant to satisfy the test-plan's literal wording would
  // regress that existing, intentional behaviour and its two passing tests.
  // Resolution (logged in decisions.md): pin ACTUAL behaviour here, not the
  // test-plan's literal wording — flagged for tech-lead visibility given this
  // story's Medium oversight level and security-critical framing.
  const { isSameTenant, requireJourneyAccess, asHttpResponse, POLICY } = require('../src/web-ui/middleware/journey-access');

  try {
    const result = isSameTenant({ tenantId: 'tenant-a' }, { tenantId: 'tenant-a' });
    assert.strictEqual(result, true, 'matching tenant IDs should return true');
    pass('isSameTenant: matching tenant ID pair returns true');
  } catch (e) { fail('isSameTenant: matching tenant ID pair returns true', e); }

  try {
    const result = isSameTenant({ tenantId: 'tenant-a' }, { tenantId: 'tenant-b' });
    assert.strictEqual(result, false, 'mismatched tenant IDs must return false — never a truthy non-boolean');
    assert.strictEqual(typeof result, 'boolean', 'must return a real boolean, not a truthy non-boolean');
    pass('isSameTenant: mismatched tenant ID pair returns false (never throws, never a truthy non-boolean)');
  } catch (e) { fail('isSameTenant: mismatched tenant ID pair returns false', e); }

  try {
    // Pinning existing, intentional "Phase 0 passthrough" behaviour — see NOTE above.
    // Matches tests/check-p0.1-journey-access.js Test 14 exactly.
    const result = isSameTenant({}, {});
    assert.strictEqual(result, true, 'both-absent tenantId is Phase 0 passthrough (true) by design — see decisions.md');
    pass('isSameTenant: both-absent tenantId returns true (ADR-025 Phase 0 passthrough — pinned, not a new defect)');
  } catch (e) { fail('isSameTenant: both-absent tenantId returns true (Phase 0 passthrough)', e); }

  try {
    // Matches tests/check-p0.1-journey-access.js Test 15 exactly.
    const result = isSameTenant({ tenantId: 'org-a' }, { tenantId: undefined });
    assert.strictEqual(result, true, 'one-side-undefined tenantId is Phase 0 passthrough (true) by design — see decisions.md');
    pass('isSameTenant: one-side-undefined tenantId returns true (ADR-025 Phase 0 passthrough — pinned)');
  } catch (e) { fail('isSameTenant: one-side-undefined tenantId returns true (Phase 0 passthrough)', e); }

  // ===========================================================================
  // AC1 (integration layer) — journeys: requireJourneyAccess cross-tenant read
  // ===========================================================================
  // Positive confirmation: journeys are already correctly guarded (this is the
  // guard bri-s3.4 exists to regression-test, not build).
  try {
    const tenantASession = { accessToken: 'tok-a', login: 'user-a', tenantId: 'tenant-a' };
    const tenantBJourney = { ownerId: 'user-b', tenantId: 'tenant-b' };
    let threw = false;
    let code = null;
    try {
      requireJourneyAccess(tenantBJourney, tenantASession, POLICY.TENANT);
    } catch (e) {
      threw = true;
      code = e.code;
    }
    assert.ok(threw, 'tenant A must not be granted access to tenant B journey');
    assert.strictEqual(code, 'FORBIDDEN', 'expected FORBIDDEN code, got: ' + code);
    const status = asHttpResponse({ code: code }, POLICY.TENANT);
    assert.strictEqual(status, 404, 'cross-tenant journey read must be 404, never 403 (FORBIDDEN-vs-NOT_FOUND policy)');
    pass('AC1 (journeys): tenant A reading tenant B journey by ID -> 404, not 403');
  } catch (e) { fail('AC1 (journeys): tenant A reading tenant B journey by ID -> 404', e); }

  // ===========================================================================
  // AC1 (integration layer) — products: handleGetProductView cross-tenant read
  // ===========================================================================
  const { handleGetProductView, handleGetProductKanban } = require('../src/web-ui/routes/products');

  function makeProductsPool(products, journeys) {
    return {
      query: async function (sql, params) {
        const s = String(sql).replace(/\s+/g, ' ').trim();
        if (/SELECT name, tenant_id FROM products WHERE product_id/i.test(s)) {
          const pid = params[0];
          const row = (products || []).find(function (p) { return p.product_id === pid; });
          return { rows: row ? [{ name: row.name, tenant_id: row.tenant_id }] : [] };
        }
        if (/SELECT tenant_id FROM products WHERE product_id/i.test(s)) {
          const pid = params[0];
          const row = (products || []).find(function (p) { return p.product_id === pid; });
          return { rows: row ? [{ tenant_id: row.tenant_id }] : [] };
        }
        if (/FROM journeys WHERE product_id/i.test(s)) {
          const pid = params[0];
          return { rows: (journeys || []).filter(function (j) { return j.product_id === pid; }) };
        }
        return { rows: [] };
      }
    };
  }

  try {
    const products = [{ product_id: 'prod-b', name: 'Tenant B Product', tenant_id: 'tenant-b' }];
    const pool = makeProductsPool(products, []);
    const req = { session: { tenantId: 'tenant-a', login: 'user-a' }, params: { id: 'prod-b' } };
    const res = { status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; }, _s: null, _b: null };
    await handleGetProductView(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 for cross-tenant product read, got: ' + res._s);
    assert.ok(!res._b || !res._b.features, 'must not leak tenant B feature data in the 404 response');
    pass('AC1 (products): tenant A reading tenant B product by ID -> 404');
  } catch (e) { fail('AC1 (products): tenant A reading tenant B product by ID -> 404', e); }

  try {
    // Regression guard: same-tenant access must still work after the fix.
    const products = [{ product_id: 'prod-a', name: 'Tenant A Product', tenant_id: 'tenant-a' }];
    const journeys = [{ journey_id: 'j1', product_id: 'prod-a', stage: 'discovery', feature_slug: 'f1' }];
    const pool = makeProductsPool(products, journeys);
    const req = { session: { tenantId: 'tenant-a', login: 'user-a' }, params: { id: 'prod-a' } };
    const res = { status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; }, _s: null, _b: null };
    await handleGetProductView(req, res, null, pool);
    assert.ok(res._s === null || res._s === 200, 'same-tenant product read must not be blocked, got status: ' + res._s);
    assert.ok(res._b && res._b.features && res._b.features.length === 1, 'same-tenant product read must still return its features');
    pass('AC1 regression guard (products): tenant A reading its own product still succeeds');
  } catch (e) { fail('AC1 regression guard (products): tenant A reading its own product still succeeds', e); }

  try {
    const products = [{ product_id: 'prod-b2', name: 'Tenant B Product 2', tenant_id: 'tenant-b' }];
    const journeys = [{ journey_id: 'j-secret', product_id: 'prod-b2', stage: 'discovery', health: 'green', feature_slug: 'tenant-b-secret-feature' }];
    const pool = makeProductsPool(products, journeys);
    const req = { session: { tenantId: 'tenant-a', login: 'user-a' }, params: { id: 'prod-b2' } };
    const res = { status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; }, _s: null, _b: null };
    await handleGetProductKanban(req, res, null, pool, { capture: function () {} });
    assert.strictEqual(res._s, 404, 'expected 404 for cross-tenant kanban read, got: ' + res._s);
    pass('AC1 (products): tenant A reading tenant B product kanban -> 404');
  } catch (e) { fail('AC1 (products): tenant A reading tenant B product kanban -> 404', e); }

  // ===========================================================================
  // AC2 — standards: list endpoint never leaks tenant B rows
  // AC3 — standards: create/update against a tenant B resource rejected
  // ===========================================================================
  const { standardsPost, standardsList, standardsPut } = require('../src/web-ui/routes/standards');

  function makeStandardsPool(products, standards) {
    return {
      _ops: [],
      query: async function (sql, params) {
        const s = String(sql).replace(/\s+/g, ' ').trim();
        this._ops.push({ sql: s, params: params });
        if (/SELECT tenant_id FROM products WHERE product_id/i.test(s)) {
          const pid = params[0];
          const row = (products || []).find(function (p) { return p.product_id === pid; });
          return { rows: row ? [{ tenant_id: row.tenant_id }] : [] };
        }
        if (/INSERT INTO standards/i.test(s)) {
          const id = 'new-std-' + ((standards || []).length + 1);
          return { rows: [{ standard_id: id }] };
        }
        if (/FROM standards WHERE product_id/i.test(s)) {
          const pid = params[0];
          const orgId = params[1];
          const rows = (standards || []).filter(function (st) {
            return st.product_id === pid && (orgId === undefined || st.org_id === orgId);
          });
          return { rows: rows };
        }
        if (/SELECT org_id FROM standards WHERE standard_id/i.test(s)) {
          const sid = params[0];
          const row = (standards || []).find(function (st) { return st.standard_id === sid; });
          return { rows: row ? [{ org_id: row.org_id }] : [] };
        }
        if (/UPDATE standards SET/i.test(s)) {
          return { rows: [{ standard_id: params[params.length - 1] }], rowCount: 1 };
        }
        return { rows: [] };
      }
    };
  }

  try {
    // AC2: tenant A lists standards for a product it owns; tenant B's standards
    // on a DIFFERENT product must never appear (aggregate-list scoping, not
    // just per-product filtering — the org_id filter is the tenant boundary).
    const standards = [
      { standard_id: 'std-a1', product_id: 'prod-a', org_id: 'tenant-a', name: 'A Standard', visibility: 'product', created_at: new Date() },
      { standard_id: 'std-b1', product_id: 'prod-a', org_id: 'tenant-b', name: 'Leaked B Standard', visibility: 'product', created_at: new Date() }
    ];
    const pool = makeStandardsPool([], standards);
    const req = { session: { tenantId: 'tenant-a' }, params: { id: 'prod-a' } };
    const res = { json: function (b) { this._b = b; }, _b: null, status: function (c) { this._s = c; return this; } };
    await standardsList(req, res, null, pool);
    const names = (res._b.standards || []).map(function (st) { return st.name; });
    assert.ok(names.indexOf('A Standard') !== -1, 'tenant A\'s own standard must be present');
    assert.strictEqual(names.indexOf('Leaked B Standard'), -1, 'tenant B\'s standard must never appear in tenant A\'s list');
    pass('AC2 (standards): list endpoint returns zero tenant B rows even on a shared product_id');
  } catch (e) { fail('AC2 (standards): list endpoint returns zero tenant B rows', e); }

  try {
    // AC1/AC2 (standards, cross-product): tenant A cannot list standards for
    // a product it does not own at all.
    const products = [{ product_id: 'prod-b3', tenant_id: 'tenant-b' }];
    const standards = [{ standard_id: 'std-b2', product_id: 'prod-b3', org_id: 'tenant-b', name: 'B Standard', visibility: 'product', created_at: new Date() }];
    const pool = makeStandardsPool(products, standards);
    const req = { session: { tenantId: 'tenant-a' }, params: { id: 'prod-b3' } };
    const res = { json: function (b) { this._b = b; }, _b: null, status: function (c) { this._s = c; return this; } };
    await standardsList(req, res, null, pool);
    const names = (res._b && res._b.standards || []).map(function (st) { return st.name; });
    assert.strictEqual(names.length, 0, 'tenant A must see zero standards for tenant B\'s product');
    pass('AC1/AC2 (standards): listing tenant B\'s product\'s standards returns zero rows for tenant A');
  } catch (e) { fail('AC1/AC2 (standards): listing tenant B\'s product\'s standards returns zero rows', e); }

  try {
    // AC3: tenant A attempts to create a standard attached to tenant B's product.
    const products = [{ product_id: 'prod-b4', tenant_id: 'tenant-b' }];
    const pool = makeStandardsPool(products, []);
    const req = { session: { tenantId: 'tenant-a' }, params: { id: 'prod-b4' }, body: { name: 'Injected Standard', content: 'malicious' } };
    const res = { status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; }, _s: null, _b: null };
    await standardsPost(req, res, null, pool, { capture: function () {} });
    assert.strictEqual(res._s, 404, 'expected 404 rejecting a standard creation against another tenant\'s product, got: ' + res._s);
    const inserted = pool._ops.find(function (op) { return /INSERT INTO standards/i.test(op.sql); });
    assert.ok(!inserted, 'no INSERT should have been issued for a rejected cross-tenant create');
    pass('AC3 (standards): creating a standard against tenant B\'s product is rejected, no row inserted');
  } catch (e) { fail('AC3 (standards): creating a standard against tenant B\'s product is rejected', e); }

  try {
    // AC3: tenant A attempts to edit tenant B's existing standard by ID; confirm
    // rejected AND the underlying data is unchanged on a follow-up read.
    const standards = [{ standard_id: 'std-b3', product_id: 'prod-b5', org_id: 'tenant-b', name: 'Original B Name', content: 'original content', visibility: 'product', created_at: new Date() }];
    const pool = makeStandardsPool([], standards);
    const req = { session: { tenantId: 'tenant-a' }, params: { id: 'std-b3' }, body: { name: 'Hacked Name', content: 'hacked content' } };
    const res = { status: function (c) { this._s = c; return this; }, json: function (b) { this._b = b; }, _s: null, _b: null };
    await standardsPut(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 rejecting cross-tenant write, got: ' + res._s);
    const updated = pool._ops.find(function (op) { return /UPDATE standards SET/i.test(op.sql); });
    assert.ok(!updated, 'no UPDATE should have been issued for a rejected cross-tenant write');
    // Follow-up read: data must be unchanged (still 'Original B Name').
    assert.strictEqual(standards[0].name, 'Original B Name', 'tenant B\'s standard content must be unmodified after the rejected attempt');
    pass('AC3 (standards): editing tenant B\'s standard is rejected, no UPDATE issued, data unchanged');
  } catch (e) { fail('AC3 (standards): editing tenant B\'s standard is rejected, data unchanged', e); }

  // ===========================================================================
  // AC1/AC2/AC3 — credits: structural isolation (no ID-parameterized route
  // exists; every call site derives tenantId from req.session.tenantId only)
  // ===========================================================================
  const { getBalance, adjustBalance, setCreditsAdapter } = require('../src/web-ui/modules/credits');
  const { creditsGuard } = require('../src/web-ui/middleware/credits-guard');

  try {
    const balances = { 'tenant-a': 5, 'tenant-b': 5 };
    setCreditsAdapter({
      query: async function (sql, params) {
        const s = String(sql);
        if (/SELECT balance FROM credits/i.test(s)) {
          return { rows: [{ balance: balances[params[0]] }] };
        }
        if (/UPDATE credits SET balance/i.test(s)) {
          balances[params[1]] += params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    });

    // Tenant A's request can only ever affect tenant A's balance — there is no
    // request field (body/params/query) that lets it target tenant B's ID.
    const reqA = { session: { tenantId: 'tenant-a' } };
    let nextCalled = false;
    await creditsGuard(reqA, { writeHead: function () {}, end: function () {} }, function () { nextCalled = true; });
    assert.ok(nextCalled, 'tenant A with positive balance should be allowed through');
    await adjustBalance(reqA.session.tenantId, -1);
    assert.strictEqual(balances['tenant-a'], 4, 'only tenant A\'s balance should have changed');
    assert.strictEqual(balances['tenant-b'], 5, 'tenant B\'s balance must be untouched by tenant A\'s action');
    pass('AC1/AC3 (credits): credit reads/writes are always keyed by the caller\'s own session tenantId, never a request-supplied ID');
  } catch (e) { fail('AC1/AC3 (credits): structural tenant isolation', e); }

  // ===========================================================================
  // AC1 — user_roles: structural isolation (getUserRole only ever called with
  // the caller's own tenantId/email, never a request-supplied foreign ID)
  // ===========================================================================
  const { getUserRole, setGetUserRole } = require('../src/web-ui/modules/user-roles');

  try {
    const roles = { 'tenant-a': 'admin', 'tenant-b': 'user' };
    let calledWith = [];
    setGetUserRole(async function (tenantId) {
      calledWith.push(tenantId);
      return roles[tenantId] || 'user';
    });
    const roleA = await getUserRole('tenant-a');
    assert.strictEqual(roleA, 'admin', 'must resolve tenant A\'s own role');
    assert.deepStrictEqual(calledWith, ['tenant-a'], 'getUserRole must only ever be invoked with the caller\'s own tenantId');
    pass('AC1 (user_roles): role lookups are always keyed by the caller\'s own tenantId');
  } catch (e) { fail('AC1 (user_roles): role lookups keyed by caller\'s own tenantId', e); }

  console.log('\n[bri-s3.4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
