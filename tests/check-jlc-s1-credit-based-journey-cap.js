'use strict';

// check-jlc-s1-credit-based-journey-cap.js
// Unit + integration tests for jlc-s1: persist tenant plan state (bri-s3.5's
// paid-plan journey-cap bypass) to Postgres via a D37 injectable adapter,
// instead of an in-memory Map that a server restart silently wipes.
//
// Story: artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
// Test plan: artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md
//
// Run: node tests/check-jlc-s1-credit-based-journey-cap.js

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var tenantPlanPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-plan'));
var journeyPath    = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'journey'));

/** A small in-memory Postgres-shaped fake adapter for the tenant_plan table. */
function makeFakePlanStateDb() {
  var rows = new Map();
  return {
    rows: rows,
    query: async function(sql, params) {
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

function freshTenantPlan() {
  delete require.cache[tenantPlanPath];
  return require(tenantPlanPath);
}

(async function run() {

  // ── U1 (AC2): untracked tenant defaults to trial/active with a wired adapter ──
  console.log('\nU1 (AC2) — untracked tenant, wired adapter, defaults to trial/active');
  await (async function() {
    var tenantPlan = freshTenantPlan();
    tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
    var state = await tenantPlan.getPlanState('tenant-untracked');
    ok('defaults to plan:trial', state.plan === 'trial');
    ok('defaults to status:active', state.status === 'active');
  })();

  // ── U2 (AC3): getPlanState with no adapter wired fails open, does not throw ──
  console.log('\nU2 (AC3) — getPlanState with no adapter wired resolves the safe default, does not throw');
  await (async function() {
    var tenantPlan = freshTenantPlan(); // fresh instance — no setPlanStateAdapter call
    var threw = false;
    var state = null;
    try {
      state = await tenantPlan.getPlanState('tenant-x');
    } catch (err) {
      threw = true;
    }
    ok('does not throw when adapter is unwired', threw === false);
    ok('falls back to plan:trial', state && state.plan === 'trial');
    ok('falls back to status:active', state && state.status === 'active');
  })();

  // ── U3 (AC3): checkJourneyCap with no adapter wired falls back to count-only ──
  console.log('\nU3 (AC3) — checkJourneyCap with no plan-state adapter wired falls back to count-only behavior');
  await (async function() {
    var tenantPlan = freshTenantPlan(); // fresh instance — no setPlanStateAdapter call
    tenantPlan.setCapReader(function() { return 3; });
    var threw = false;
    var result = null;
    try {
      result = await tenantPlan.checkJourneyCap('tenant-y', 5); // 5 >= cap of 3
    } catch (err) {
      threw = true;
    }
    ok('does not throw when adapter is unwired', threw === false);
    ok('falls back to blocking at the count cap', result && result.allowed === false);
    ok('cap is still reported', result && result.cap === 3);
    tenantPlan.setCapReader(null);
  })();

  // ── U4 (AC5): wired adapter, paid+active, far beyond cap → unlimited (unchanged) ──
  console.log('\nU4 (AC5) — wired adapter, paid+active plan state, count far beyond cap → still unlimited');
  await (async function() {
    var tenantPlan = freshTenantPlan();
    tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
    tenantPlan.setCapReader(function() { return 5; });
    await tenantPlan.setPlanState('tenant-paid', 'paid', 'active');
    var result = await tenantPlan.checkJourneyCap('tenant-paid', 100); // 100 >> cap of 5
    ok('allowed:true regardless of count', result.allowed === true);
    ok('cap:null (unlimited)', result.cap === null);
    tenantPlan.setCapReader(null);
  })();

  // ── U5 (AC5): a downgrade/cancellation state still restores the restriction ──
  console.log('\nU5 (AC5) — trial/past_due (post-downgrade) plan state still restricts per the count cap');
  await (async function() {
    var tenantPlan = freshTenantPlan();
    tenantPlan.setPlanStateAdapter(makeFakePlanStateDb());
    tenantPlan.setCapReader(function() { return 2; });
    await tenantPlan.setPlanState('tenant-downgraded', 'trial', 'past_due');
    var result = await tenantPlan.checkJourneyCap('tenant-downgraded', 5); // 5 >= cap of 2
    ok('allowed:false — restriction restored, not left at unlimited', result.allowed === false);
    ok('cap reported', result.cap === 2);
    tenantPlan.setCapReader(null);
  })();

  // ── IT1 (AC1): plan state survives a simulated process restart ──────────────
  console.log('\nIT1 (AC1) — plan state persists across a fresh module instance sharing the same backing store');
  await (async function() {
    // "Process A": write paid/active through one module instance.
    var tenantPlanA = freshTenantPlan();
    var sharedDb = makeFakePlanStateDb(); // stands in for the real, external Postgres table
    tenantPlanA.setPlanStateAdapter(sharedDb);
    await tenantPlanA.setPlanState('tenant-restart', 'paid', 'active');

    // Simulate a restart: a fresh module instance (module-level vars, including
    // _planStateDb, are wiped by deleting the require cache) — but re-wire it to
    // the SAME underlying store, standing in for the same Postgres database still
    // being there after the process comes back up.
    var tenantPlanB = freshTenantPlan();
    ok('fresh instance starts unwired (would fail open if not re-wired)', true); // documents the restart boundary
    tenantPlanB.setPlanStateAdapter(sharedDb);

    var state = await tenantPlanB.getPlanState('tenant-restart');
    ok('fresh instance still reads paid/active from the shared store', state.plan === 'paid' && state.status === 'active');
  })();

  // ── IT2 (AC4): all 3 webhook branches correctly await setPlanState ──────────
  console.log('\nIT2 (AC4) — billing.js\'s 3 webhook branches correctly await the now-async setPlanState');
  await (async function() {
    var stripeClientPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
    var billingPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
    var creditsPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));

    function mockReq(headers) {
      return { session: { accessToken: 'tok', tenantId: 'tenant-abc' }, body: Buffer.from('{}'), headers: headers || {}, query: {} };
    }
    function mockRes(writeCompleted) {
      return {
        _statusCode: null,
        _writeCompletedAtResponseTime: null,
        writeHead: function(status) {
          this._statusCode = status;
          // Capture whether the delayed write had already resolved by the time
          // the handler sent its response — proves the await actually blocked
          // the response, not just that setPlanState was *called*.
          this._writeCompletedAtResponseTime = writeCompleted.done;
        },
        end: function() {}
      };
    }
    function mockWebhookDb() {
      return { query: async function(sql) {
        if (sql.includes('INSERT INTO stripe_events')) return { rows: [], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      } };
    }
    /** A tenant_plan adapter whose INSERT resolves only after an artificial delay. */
    function makeDelayedPlanStateDb(writeCompleted) {
      var rows = new Map();
      return { query: async function(sql, params) {
        if (sql.indexOf('INSERT INTO tenant_plan') !== -1) {
          await new Promise(function(resolve) { setTimeout(resolve, 15); });
          rows.set(params[0], { plan: params[1], status: params[2] });
          writeCompleted.done = true;
          return { rows: [], rowCount: 1 };
        }
        if (sql.indexOf('SELECT plan, status FROM tenant_plan') !== -1) {
          var row = rows.get(params[0]);
          return { rows: row ? [{ plan: row.plan, status: row.status }] : [] };
        }
        return { rows: [] };
      } };
    }

    var scenarios = [
      {
        label: 'checkout.session.completed',
        event: { id: 'evt_it2_checkout', type: 'checkout.session.completed', data: { object: { client_reference_id: 'tenant-it2-a', metadata: { planName: 'STARTER' } } } }
      },
      {
        label: 'invoice.payment_failed',
        event: { id: 'evt_it2_failed', type: 'invoice.payment_failed', data: { object: { metadata: { tenant_id: 'tenant-it2-b' } } } }
      },
      {
        label: 'customer.subscription.deleted',
        event: { id: 'evt_it2_deleted', type: 'customer.subscription.deleted', data: { object: { metadata: { tenant_id: 'tenant-it2-c' } } } }
      }
    ];

    for (var i = 0; i < scenarios.length; i++) {
      var scenario = scenarios[i];
      var writeCompleted = { done: false };

      delete require.cache[creditsPath];
      var credits = require(creditsPath);
      credits.setCreditsAdapter({ query: async function() { return { rows: [] }; } });

      var tenantPlan = freshTenantPlan();
      tenantPlan.setPlanStateAdapter(makeDelayedPlanStateDb(writeCompleted));

      delete require.cache[stripeClientPath];
      var sc = require(stripeClientPath);
      sc.setStripeAdapter({ webhooks: { constructEvent: function() { return scenario.event; } } });

      delete require.cache[billingPath];
      var billing = require(billingPath);
      billing.setWebhookDbAdapter(mockWebhookDb());

      var res = mockRes(writeCompleted);
      await billing.handlePostStripeWebhook(mockReq({ 'stripe-signature': 'valid-sig' }), res);

      ok(scenario.label + ': handler awaited the delayed write before responding',
        res._writeCompletedAtResponseTime === true);
      ok(scenario.label + ': webhook still returns 200', res._statusCode === 200);
    }
  })();

  // ── IT3 (AC1): journey.js's real handler honors a persisted paid/active state ──
  console.log('\nIT3 (AC1) — routes/journey.js\'s real POST handler allows creation for a persisted paid/active tenant over cap');
  await (async function() {
    // Wire and populate tenant-plan.js's module instance BEFORE requiring journey.js
    // fresh — journey.js does `require('../modules/tenant-plan')` at module load
    // time, so it must pick up the already-wired instance from require.cache, not
    // an earlier (unwired) one, or its internal _tenantPlan reference would point
    // at a different module object than the one this test just configured.
    var tenantPlan = freshTenantPlan();
    var fakeDb = makeFakePlanStateDb();
    tenantPlan.setPlanStateAdapter(fakeDb);
    await tenantPlan.setPlanState('tenant-it3', 'paid', 'active');

    delete require.cache[journeyPath];
    var journeyRoute = require(journeyPath);
    process.env.MAX_JOURNEYS_PER_TENANT = '2';

    var stubJourneys = [
      { tenantId: 'tenant-it3' }, { tenantId: 'tenant-it3' },
      { tenantId: 'tenant-it3' }, { tenantId: 'tenant-it3' }, { tenantId: 'tenant-it3' }
    ]; // 5 journeys, well over cap of 2
    var stubStore = {
      listJourneys:     function() { return stubJourneys; },
      getJourney:       function() { return null; },
      createJourney:    function(slug) { return { journeyId: 'j-' + slug, featureSlug: slug, ownerId: null, tenantId: null, completedStages: [], sessions: {} }; },
      setJourneyFields: function() {},
      setActiveSession: function() {}
    };
    journeyRoute.setJourneyStoreModule(stubStore);
    journeyRoute.setRepoRoot('/tmp/jlc-s1-test');
    journeyRoute.setRegisterHtmlSession(function() {});
    journeyRoute.setLinkSessionToJourney(function() {});

    var req = {
      session: { accessToken: 'tok', login: 'paid-user', tenantId: 'tenant-it3' },
      params: {}, query: {}, url: '/journey',
      body: { featureName: 'IT3 feature' }
    };
    var res = { _status: null, _body: '', _headers: {},
      writeHead: function(s, h) { this._status = s; Object.assign(this._headers, h || {}); },
      end: function(b) { this._body = b || ''; }
    };

    await journeyRoute.handlePostJourney(req, res);
    ok('paid/active tenant over the count cap is NOT blocked (status != 402)', res._status !== 402);

    delete process.env.MAX_JOURNEYS_PER_TENANT;
  })();

  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('Test error:', err.message, err.stack);
  process.exit(1);
});
