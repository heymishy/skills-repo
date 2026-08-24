'use strict';

// check-tpac-s1-admin-plan-state-control.js
// Tests for tpac-s1: give admins a real control to lift a tenant's journey
// cap, separate from credits.
//
// Real bug found live on wuce-staging (2026-08-06): checkJourneyCap() only
// lifts the 5-journey cap when a tenant's tenant_plan row shows plan:'paid',
// status:'active' -- set only by a real Stripe checkout.session.completed
// webhook. Admin credit top-ups (adjustBalanceWithAudit) never touch
// tenant_plan at all, so an admin had no way to unblock a tenant short of a
// real Stripe checkout. This story adds a new admin-only plan-state control
// to /admin/credits, reusing tenant-plan.js's already-existing, already-
// tested setPlanState(tenantId, plan, status) directly.
//
// Story: artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
// Test plan: artefacts/2026-08-06-tenant-plan-admin-control/test-plans/tpac-s1-test-plan.md
//
// Run: node tests/check-tpac-s1-admin-plan-state-control.js

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

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

var CREDITS_PATH        = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
var TENANT_PLAN_PATH    = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-plan'));
var ADMIN_CREDITS_PATH  = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'admin-credits'));
var JOURNEY_PATH        = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'journey'));
var PRODUCTS_PATH       = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'products'));
var requireAdmin        = require(path.resolve(ROOT, 'src', 'web-ui', 'middleware', 'require-admin')).requireAdmin;

function freshCredits() {
  delete require.cache[CREDITS_PATH];
  return require(CREDITS_PATH);
}

function freshTenantPlan() {
  delete require.cache[TENANT_PLAN_PATH];
  return require(TENANT_PLAN_PATH);
}

// Requires admin-credits.js fresh, having already wired credits.js and
// tenant-plan.js's module-cache entries so admin-credits.js's own
// `require('../modules/credits')` / `require('../modules/tenant-plan')`
// picks up the already-configured instances (same pattern as
// check-arl-s3-admin-credits.js's freshRequireAdminCredits and jlc-s1's IT3).
function freshAdminCredits() {
  delete require.cache[ADMIN_CREDITS_PATH];
  return require(ADMIN_CREDITS_PATH);
}

function freshJourney() {
  delete require.cache[JOURNEY_PATH];
  return require(JOURNEY_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

/** A small in-memory Postgres-shaped fake adapter for the tenant_plan table (mirrors jlc-s1). */
function makeFakePlanStateDb() {
  var rows = new Map();
  var queryCount = 0;
  return {
    rows: rows,
    get queryCount() { return queryCount; },
    query: async function(sql, params) {
      queryCount++;
      if (sql.indexOf('INSERT INTO tenant_plan') !== -1) {
        rows.set(params[0], { plan: params[1], status: params[2] });
        return { rows: [], rowCount: 1 };
      }
      if (sql.indexOf('SELECT plan, status FROM tenant_plan') !== -1) {
        var row = rows.get(params[0]);
        return { rows: row ? [{ plan: row.plan, status: row.status }] : [] };
      }
      if (sql.indexOf('DELETE FROM tenant_plan') !== -1) {
        rows.clear();
        return { rows: [], rowCount: 0 };
      }
      return { rows: [] };
    }
  };
}

/** A fake credits adapter covering getAllTenantBalances / getValidTenantIds / adjustBalanceWithAudit. */
function makeFakeCreditsDb(overrides) {
  return {
    query: async function(sql, params) {
      if (overrides && overrides.query) {
        var r = overrides.query(sql, params);
        if (r !== undefined) return r;
      }
      if (sql.includes('SELECT tenant_id, balance')) return { rows: [{ tenant_id: 'tenant-a', balance: 10 }] };
      if (sql.includes('SELECT email FROM users')) return { rows: [] };
      if (sql.includes('SELECT tenant_id FROM team_memberships')) return { rows: [] };
      if (sql.includes('SELECT tenant_id FROM credits')) return { rows: [{ tenant_id: 'tenant-a' }] };
      if (sql.includes('INSERT INTO credits')) return { rows: [{ balance: 60 }] };
      if (sql.includes('INSERT INTO credit_audit_log')) return { rows: [] };
      return { rows: [] };
    }
  };
}

function csrfReq(session, bodyParams) {
  var body = new URLSearchParams(bodyParams).toString();
  return {
    session: session,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(body);
      if (event === 'end') cb();
    }
  };
}

async function main() {
  var queue = [];

  // ── Unit: AC1 — admin credits page shows plan+status distinct from credits ──
  queue.push(function() {
    console.log('\n[tpac-s1] U1 (AC1) -- adminCreditsGet shows plan/status as fields distinct from balance');
    return test('adminCreditsGet: plan/status rendered as distinct fields from credits balance', async function() {
      var creditsDb = makeFakeCreditsDb();
      var credits = freshCredits();
      credits.setCreditsAdapter(creditsDb);

      var tenantPlan = freshTenantPlan();
      var planDb = makeFakePlanStateDb();
      tenantPlan.setPlanStateAdapter(planDb);
      await tenantPlan.setPlanState('tenant-a', 'trial', 'active');

      var handler = freshAdminCredits();
      var req = { session: { userId: 1, role: 'admin' } };
      var res = makeRes();
      await handler.adminCreditsGet(req, res);

      assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
      // Balance still present (existing behaviour untouched).
      assert.ok(res._body.includes('tenant-a'), 'HTML must contain tenant-a');
      assert.ok(res._body.includes('tpac-credits-balance'), 'Balance must be in its own distinct element');
      // Plan/status shown as a distinct, separately-labelled field.
      assert.ok(res._body.includes('tpac-plan-state'), 'HTML must contain a distinct plan-state field');
      assert.ok(res._body.includes('Plan: trial'), 'HTML must show the current plan');
      assert.ok(res._body.includes('Status: active'), 'HTML must show the current status');
      // Structurally distinct — the balance cell and the plan-state cell are different elements.
      var balanceIdx = res._body.indexOf('tpac-credits-balance');
      var planIdx = res._body.indexOf('tpac-plan-state');
      assert.ok(balanceIdx !== -1 && planIdx !== -1 && balanceIdx !== planIdx, 'Balance and plan-state must be separate elements, not merged');
      // The new admin control is additive -- the existing adjust form is untouched.
      assert.ok(res._body.includes('/api/admin/credits/adjust'), 'Existing credits adjust form must still be present');
      assert.ok(res._body.includes('/api/admin/plan/set'), 'New plan-state form must be present');
    });
  });

  // ── Unit: AC2 — setting plan paid/active lifts the journey cap ──
  queue.push(function() {
    console.log('\n[tpac-s1] U2 (AC2) -- settingPlanPaidActive_liftsJourneyCap');
    return test('adminSetPlanPost: setting plan paid/active lifts checkJourneyCap for that tenant', async function() {
      var credits = freshCredits();
      credits.setCreditsAdapter(makeFakeCreditsDb());

      var tenantPlan = freshTenantPlan();
      tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
      tenantPlan.setCapReader(function() { return 5; }); // fixture tenant at their cap

      var handler = freshAdminCredits();
      var req = csrfReq(
        { userId: 1, role: 'admin', csrfToken: 'tok' },
        { _csrf: 'tok', tenantId: 'tenant-a', plan: 'paid', status: 'active' }
      );
      var res = makeRes();
      await handler.adminSetPlanPost(req, res);
      assert.strictEqual(res._status, 302, 'Expected 302 redirect, got ' + res._status);

      var capResult = await tenantPlan.checkJourneyCap('tenant-a', 5); // 5 >= cap of 5
      assert.strictEqual(capResult.allowed, true, 'checkJourneyCap must now be allowed');
      assert.strictEqual(capResult.cap, null, 'checkJourneyCap must report cap:null (unlimited), matching a real paid Stripe customer');

      tenantPlan.setCapReader(null);
    });
  });

  // ── Unit: AC3 — REGRESSION GUARD — credits-only adjustment does NOT lift the cap ──
  queue.push(function() {
    console.log('\n[tpac-s1] U3 (AC3) -- creditsOnlyAdjustment_doesNotLiftCap (regression guard)');
    return test('adjustBalanceWithAudit alone (no plan-state call) does NOT lift checkJourneyCap', async function() {
      var credits = freshCredits();
      credits.setCreditsAdapter(makeFakeCreditsDb());

      var tenantPlan = freshTenantPlan();
      tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
      tenantPlan.setCapReader(function() { return 5; }); // fixture tenant at their cap, still trial

      // Existing credits-only flow, unchanged -- deliberately does NOT call setPlanState.
      await credits.adjustBalanceWithAudit('tenant-a', 100, 'admin-user');

      var capResult = await tenantPlan.checkJourneyCap('tenant-a', 5); // 5 >= cap of 5
      assert.strictEqual(capResult.allowed, false, 'checkJourneyCap must still be blocked -- credits and plan must remain independent');
      assert.strictEqual(capResult.cap, 5, 'checkJourneyCap must still report the existing cap');

      tenantPlan.setCapReader(null);
    });
  });

  // ── Unit: AC4 — "Journey limit reached" page distinguishes plan from credits ──
  queue.push(function() {
    console.log('\n[tpac-s1] U4 (AC4) -- journeyLimitErrorPage_distinguishesPlanFromCredits');
    return test('journey.js Journey-limit-reached page mentions "plan", not credits, as the cause', async function() {
      var tenantPlan = freshTenantPlan();
      tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
      tenantPlan.setCapReader(function() { return 1; });

      var journeyRoute = freshJourney();
      process.env.MAX_JOURNEYS_PER_TENANT = '1';

      var stubJourneys = [{ tenantId: 'tenant-cap' }]; // already at the cap of 1
      journeyRoute.setJourneyStoreModule({
        listJourneys: function() { return stubJourneys; },
        getJourney: function() { return null; },
        createJourney: function() { return {}; },
        setJourneyFields: function() {},
        setActiveSession: function() {}
      });
      journeyRoute.setRepoRoot('/tmp/tpac-s1-test');
      journeyRoute.setRegisterHtmlSession(function() {});
      journeyRoute.setLinkSessionToJourney(function() {});

      // rcfc-s1: handlePostJourney now requires a valid session-scoped CSRF token.
      var req = {
        session: { accessToken: 'tok', login: 'capped-user', tenantId: 'tenant-cap', csrfToken: 'test-csrf-token' },
        params: {}, query: {}, url: '/journey',
        body: { featureName: 'New feature', _csrf: 'test-csrf-token' }
      };
      var res = makeRes();
      await journeyRoute.handlePostJourney(req, res);

      assert.strictEqual(res._status, 402, 'Expected 402 Journey limit reached, got ' + res._status);
      assert.ok(res._body.toLowerCase().includes('plan'), 'Error page body must contain the word "plan"');
      assert.ok(!/tied to your credits|because of your credits|credits balance is/i.test(res._body), 'Error page must not phrase the limit as being about credits');

      delete require.cache[PRODUCTS_PATH]; // ensure products.js change is picked up fresh too
      var productsSrc = require('fs').readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'products.js'), 'utf8');
      assert.ok(productsSrc.includes('tied to your plan'), 'products.js Journey-limit-reached copy must also mention plan');

      tenantPlan.setCapReader(null);
      delete process.env.MAX_JOURNEYS_PER_TENANT;
    });
  });

  // ── Integration: AC2 — admin sets plan, tenant creates journey successfully end-to-end ──
  queue.push(function() {
    console.log('\n[tpac-s1] IT1 (AC2) -- adminSetsPlan_thenTenantCreatesJourneySuccessfully');
    return test('admin plan-set route + real journey.js gate: journey creation succeeds after admin lifts the cap', async function() {
      var credits = freshCredits();
      credits.setCreditsAdapter(makeFakeCreditsDb({
        query: function(sql) {
          if (sql.includes('SELECT tenant_id FROM credits')) return { rows: [{ tenant_id: 'tenant-it1' }] };
        }
      }));

      var tenantPlan = freshTenantPlan();
      tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
      tenantPlan.setCapReader(function() { return 1; });

      var adminCredits = freshAdminCredits();
      var setReq = csrfReq(
        { userId: 1, role: 'admin', csrfToken: 'tok' },
        { _csrf: 'tok', tenantId: 'tenant-it1', plan: 'paid', status: 'active' }
      );
      var setRes = makeRes();
      await adminCredits.adminSetPlanPost(setReq, setRes);
      assert.strictEqual(setRes._status, 302, 'Admin plan-set must succeed (302)');

      var journeyRoute = freshJourney();
      process.env.MAX_JOURNEYS_PER_TENANT = '1';
      var stubJourneys = [{ tenantId: 'tenant-it1' }]; // already at cap of 1
      journeyRoute.setJourneyStoreModule({
        listJourneys: function() { return stubJourneys; },
        getJourney: function() { return null; },
        createJourney: function(slug) { return { journeyId: 'j-' + slug, featureSlug: slug, ownerId: null, tenantId: null, completedStages: [], sessions: {} }; },
        setJourneyFields: function() {},
        setActiveSession: function() {}
      });
      journeyRoute.setRepoRoot('/tmp/tpac-s1-it1-test');
      journeyRoute.setRegisterHtmlSession(function() {});
      journeyRoute.setLinkSessionToJourney(function() {});

      // rcfc-s1: handlePostJourney now requires a valid session-scoped CSRF token.
      var journeyReq = {
        session: { accessToken: 'tok', login: 'paid-user', tenantId: 'tenant-it1', csrfToken: 'test-csrf-token' },
        params: {}, query: {}, url: '/journey',
        body: { featureName: 'IT1 feature', _csrf: 'test-csrf-token' }
      };
      var journeyRes = makeRes();
      await journeyRoute.handlePostJourney(journeyReq, journeyRes);

      assert.notStrictEqual(journeyRes._status, 402, 'Journey creation must not be blocked (402) after admin lifted the cap');

      tenantPlan.setCapReader(null);
      delete process.env.MAX_JOURNEYS_PER_TENANT;
    });
  });

  // ── NFR: Performance — plan-state write is a single-row query, no N+1 ──
  queue.push(function() {
    console.log('\n[tpac-s1] NFR1 -- planStateWrite_singleRowQuery');
    return test('setPlanState issues exactly one query against the tenant_plan adapter', async function() {
      var tenantPlan = freshTenantPlan();
      var planDb = makeFakePlanStateDb();
      tenantPlan.setPlanStateAdapter(planDb);

      var before = planDb.queryCount;
      await tenantPlan.setPlanState('tenant-perf', 'paid', 'active');
      var after = planDb.queryCount;

      assert.strictEqual(after - before, 1, 'Expected exactly 1 query for the plan-state write, got ' + (after - before));
    });
  });

  // ── NFR: Security — new plan-set route requires admin ──
  queue.push(function() {
    console.log('\n[tpac-s1] NFR2 -- planStateRoute_requiresAdmin');
    return test('requireAdmin + adminSetPlanPost: non-admin session is rejected identically to the existing adjust route', async function() {
      var credits = freshCredits();
      credits.setCreditsAdapter(makeFakeCreditsDb());

      var tenantPlan = freshTenantPlan();
      var planDb = makeFakePlanStateDb();
      tenantPlan.setPlanStateAdapter(planDb);

      var handler = freshAdminCredits();
      var req = csrfReq(
        { userId: 1, role: 'user' },
        { tenantId: 'tenant-a', plan: 'paid', status: 'active' }
      );
      var res = makeRes();

      var queryCountBefore = planDb.queryCount;

      await new Promise(function(resolve) {
        var called = false;
        requireAdmin(req, res, function() { called = true; });
        if (called) {
          handler.adminSetPlanPost(req, res).then(resolve).catch(resolve);
        } else {
          resolve();
        }
      });

      assert.strictEqual(res._status, 403, 'Expected 403 for non-admin role, got ' + res._status);
      assert.strictEqual(planDb.queryCount, queryCountBefore, 'setPlanState must never be called for a non-admin request');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[tpac-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tpac-s1] Unexpected error:', err);
  process.exit(1);
});
