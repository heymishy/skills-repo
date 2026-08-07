'use strict';
// check-bri-s1.5-initial-flags-wired.js — AC verification for bri-s1.5
// (Create and wire the 3 initial flags across both projects — wizard-ui,
// product-kanban-view, org-kanban-view — gated through the shared isEnabled()
// helper (bri-s1.1), no flag-specific bespoke evaluation logic per D37)
// See test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md

var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var flags = require('../src/web-ui/modules/posthog-flags');
var flagKeys = require('../src/web-ui/modules/flag-keys');
var { handleGetWizard } = require('../src/web-ui/routes/journey');
var { handleGetProductKanban, handleGetOrgKanban } = require('../src/web-ui/routes/products');

function mockRes() {
  var res = { statusCode: 200, _b: null, headers: {} };
  res.status = function(code) { res.statusCode = code; return res; };
  res.json = function(body) { res._b = body; return res; };
  res.writeHead = function(code, hdrs) { res.statusCode = code; if (hdrs) Object.assign(res.headers, hdrs); return res; };
  res.end = function(data) { res._raw = data; return res; };
  return res;
}

function makePool(rowsByQuery) {
  return {
    calls: [],
    query: async function(sql, params) {
      this.calls.push({ sql: sql, params: params });
      for (var i = 0; i < rowsByQuery.length; i++) {
        if (rowsByQuery[i].match.test(sql)) return { rows: rowsByQuery[i].rows(params) };
      }
      return { rows: [] };
    }
  };
}

var mockPosthog = { capture: function() {} };

async function main() {
  var queue = [];

  // ── AC4 (unit, code-side) — flag key constants match the exact 3 names ──────

  queue.push(function() {
    console.log('\n[bri-s1.5] U1 -- flag-keys.js exports this story\'s original 3 flag name strings unmodified (AC4 code-side)');
    return test('U1: flag-keys module includes { WIZARD_UI, PRODUCT_KANBAN_VIEW, ORG_KANBAN_VIEW } with their original values', function() {
      assert.strictEqual(flagKeys.WIZARD_UI, 'wizard-ui');
      assert.strictEqual(flagKeys.PRODUCT_KANBAN_VIEW, 'product-kanban-view');
      assert.strictEqual(flagKeys.ORG_KANBAN_VIEW, 'org-kanban-view');
      // Edge case — guard against the corrected story's stale placeholder names leaking back in
      var values = Object.keys(flagKeys).map(function(k) { return flagKeys[k]; });
      assert.ok(values.indexOf('model-routing-glm52') === -1, 'stale placeholder model-routing-glm52 must not appear');
      assert.ok(values.indexOf('billing-v2') === -1, 'stale placeholder billing-v2 must not appear');
      // d4 (2026-07-22): flag-keys.js is a shared, ever-growing registry across
      // stories (see ADMIN_IMPERSONATION, added by d4) -- asserting an exact
      // key count here would make this AC4 test fail every time any later
      // story adds its own flag, which is not a real regression of THIS
      // story's own 3 keys. Assert at-least-3 with the exact values above
      // (which does still catch a typo/drift in this story's own 3 keys)
      // rather than an exact total count.
      assert.ok(Object.keys(flagKeys).length >= 3, 'expected at least this story\'s original 3 flag keys to still be present');
    });
  });

  // ── AC2 (unit) — handleGetProductKanban does not query the DB when the flag is off ──

  queue.push(function() {
    console.log('\n[bri-s1.5] U2 -- handleGetProductKanban does not query the database when product-kanban-view is off (AC2)');
    return test('U2: pool.query is never called when isEnabled(product-kanban-view) resolves false', async function() {
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return false; } });
      var pool = makePool([{ match: /FROM journeys/i, rows: function() { return [{ journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' }]; } }]);
      var req = { session: { tenantId: 'acme' }, params: { id: 'prod-1' } };
      var res = mockRes();
      await handleGetProductKanban(req, res, null, pool, mockPosthog);
      assert.strictEqual(pool.calls.length, 0, 'pool.query must not be called when the flag is off');
      assert.ok(res.statusCode === 404 || (res._b && res._b.error), 'expected a not-found/disabled response');
    });
  });

  // ── AC1 (integration) — wizard-ui off/on gates the wizard canvas element ────

  queue.push(function() {
    console.log('\n[bri-s1.5] IT1 -- wizard-ui flag off omits the wizard-canvas gated element (AC1)');
    return test('IT1: handleGetWizard omits #wizard-canvas-gated when req.session.flags["wizard-ui"] is false', function() {
      var req = { session: { flags: {} } };
      req.session.flags[flagKeys.WIZARD_UI] = false;
      var res = mockRes();
      handleGetWizard(req, res);
      assert.ok(!/wizard-canvas-gated/.test(String(res._raw)), 'gated element must not be present when flag is off');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.5] IT2 -- wizard-ui flag on includes the wizard-canvas gated element (AC1)');
    return test('IT2: handleGetWizard includes #wizard-canvas-gated when req.session.flags["wizard-ui"] is true', function() {
      var req = { session: { flags: {} } };
      req.session.flags[flagKeys.WIZARD_UI] = true;
      var res = mockRes();
      handleGetWizard(req, res);
      assert.ok(/wizard-canvas-gated/.test(String(res._raw)), 'gated element must be present when flag is on');
    });
  });

  // ── AC2 (integration) — product-kanban-view off/on gates handleGetProductKanban ──

  queue.push(function() {
    console.log('\n[bri-s1.5] IT3 -- product-kanban-view flag off returns a not-found/disabled response (AC2)');
    return test('IT3: handleGetProductKanban returns not-found/disabled shape when flag is off', async function() {
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return false; } });
      var pool = makePool([{ match: /FROM journeys/i, rows: function() { return []; } }]);
      var req = { session: { tenantId: 'acme' }, params: { id: 'prod-1' } };
      var res = mockRes();
      await handleGetProductKanban(req, res, null, pool, mockPosthog);
      assert.strictEqual(res.statusCode, 404, 'expected HTTP 404 when the flag is off');
      assert.ok(!res._b || !res._b.columns, 'must not return the normal columns payload when the flag is off');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.5] IT4 -- product-kanban-view flag on returns the normal kanban board (AC2)');
    return test('IT4: handleGetProductKanban returns { columns } when the flag is on', async function() {
      flags.setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });
      var pool = makePool([
        // bri-s3.4: handleGetProductKanban now also checks the product's tenant_id
        // ownership after the flag gate — mock a matching row so this flag-focused
        // test still reaches the real kanban-columns logic instead of 404ing.
        { match: /FROM products/i, rows: function() { return [{ tenant_id: 'acme' }]; } },
        { match: /FROM journeys/i, rows: function() { return [{ journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' }]; } }
      ]);
      var req = { session: { tenantId: 'acme' }, params: { id: 'prod-1' } };
      var res = mockRes();
      await handleGetProductKanban(req, res, null, pool, mockPosthog);
      // kbc-s1: handleGetProductKanban now renders real HTML via the shared
      // renderer (AC2) instead of res.json({ columns }) -- assert on the
      // rendered board content instead of the old JSON payload shape. The "8
      // stage columns, unchanged from pre-flag behaviour" guarantee still
      // holds; it is now verified via STAGE_COLUMNS directly (kbc-s1's own
      // test suite, check-kanban-consolidation.js, covers the column count).
      assert.ok(res._raw && typeof res._raw === 'string' && res._raw.includes('<div'), 'expected the normal rendered HTML board when the flag is on');
      assert.ok(res._raw.includes('f1'), 'expected the fixture feature to appear in the rendered board');
    });
  });

  // ── AC3 (integration) — org-kanban-view on for the targeted tenant, off for others, no leak ──

  queue.push(function() {
    console.log('\n[bri-s1.5] IT5 -- org-kanban-view on for the targeted tenant renders via handleGetOrgKanban (AC3)');
    return test('IT5: handleGetOrgKanban returns { groups } for tenant-x when the flag resolves true for tenant-x', async function() {
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { return context.tenantId === 'tenant-x'; }
      });
      var pool = makePool([
        { match: /FROM products/i, rows: function() { return [{ product_id: 'pA', name: 'Product A' }]; } },
        { match: /FROM journeys/i, rows: function() { return [{ journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' }]; } }
      ]);
      var req = { session: { tenantId: 'tenant-x' }, query: {} };
      var res = mockRes();
      await handleGetOrgKanban(req, res, null, pool, mockPosthog);
      // kbc-s1: handleGetOrgKanban now renders real HTML via the shared
      // renderer (AC3) instead of res.json({ groups }) -- assert on the
      // rendered board content instead of the old JSON payload shape.
      assert.ok(res._raw && typeof res._raw === 'string' && res._raw.includes('<div'), 'expected the normal rendered HTML board for the targeted tenant');
      assert.ok(res._raw.includes('Product A') || res._raw.includes('f1'), 'expected the fixture product/feature to appear in the rendered board');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.5] IT6 -- org-kanban-view off for a non-targeted tenant returns not-found/disabled with no cross-tenant leak (AC3, Security NFR)');
    return test('IT6: handleGetOrgKanban never leaks tenant-x data into tenant-y\'s flag-off response', async function() {
      flags.setPostHogFlagsAdapter({
        evaluateFlag: async function(flagKey, context) { return context.tenantId === 'tenant-x'; }
      });
      var pool = makePool([
        { match: /FROM products/i, rows: function() { return [{ product_id: 'pA', name: 'Acme Secret Product', tenant_id: 'tenant-x' }]; } },
        { match: /FROM journeys/i, rows: function() { return [{ journey_id: 'secret-journey-id', feature_slug: 'acme-secret-feature', stage: 'discovery' }]; } }
      ]);
      var req = { session: { tenantId: 'tenant-y' }, query: {} };
      var res = mockRes();
      await handleGetOrgKanban(req, res, null, pool, mockPosthog);
      assert.strictEqual(res.statusCode, 404, 'expected HTTP 404 for the non-targeted tenant');
      assert.strictEqual(pool.calls.length, 0, 'no DB query should run at all for the non-targeted tenant (flag-off short-circuit)');
      var raw = JSON.stringify(res._b || {}) + String(res._raw || '');
      assert.ok(raw.indexOf('Acme Secret Product') === -1, 'tenant-x product name must never appear in tenant-y\'s response');
      assert.ok(raw.indexOf('secret-journey-id') === -1, 'tenant-x journey_id must never appear in tenant-y\'s response');
      assert.ok(raw.indexOf('acme-secret-feature') === -1, 'tenant-x feature name must never appear in tenant-y\'s response');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s1.5] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
