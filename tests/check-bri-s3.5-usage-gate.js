'use strict';

// check-bri-s3.5-usage-gate.js
// Unit tests for the pre-flight usage-gate function (bri-s3.5 AC2).
// Verifies checkJourneyCap() blocks over-limit actions with a human-readable
// message (not a raw error code) and allows under-limit actions, exercising
// the exactly-at-limit and one-under-limit boundary cases. Also verifies a
// paid/active tenant plan state removes the cap entirely (AC4 — a downgrade
// or cancellation must be able to restrict access again, which only makes
// sense if the paid state can lift the restriction in the first place).
//
// jlc-s1: checkJourneyCap/setPlanState/getPlanState/resetPlanState are now
// async (plan state is persisted via a D37 adapter, tenant_plan table,
// instead of an in-memory Map) — this file wires a small in-memory
// Postgres-shaped fake adapter so these existing assertions keep exercising
// the same behavior, just through the new async API.
//
// Run: node tests/check-bri-s3.5-usage-gate.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var tenantPlan = require('../src/web-ui/modules/tenant-plan');

// ── jlc-s1: in-memory Postgres-shaped fake adapter for tenant_plan ──────────
var _fakeRows = new Map();
tenantPlan.setPlanStateAdapter({
  query: async function(sql, params) {
    if (sql.indexOf('INSERT INTO tenant_plan') !== -1) {
      _fakeRows.set(params[0], { plan: params[1], status: params[2] });
      return { rows: [], rowCount: 1 };
    }
    if (sql.indexOf('SELECT plan, status FROM tenant_plan') !== -1) {
      var row = _fakeRows.get(params[0]);
      return { rows: row ? [{ plan: row.plan, status: row.status }] : [] };
    }
    if (sql.indexOf('DELETE FROM tenant_plan') !== -1) {
      _fakeRows.clear();
      return { rows: [], rowCount: 0 };
    }
    return { rows: [] };
  }
});

async function reset() {
  tenantPlan.setCapReader(null);
  delete process.env.MAX_JOURNEYS_PER_TENANT;
  await tenantPlan.resetPlanState();
}

(async function run() {

// ── AC2: exactly-at-limit is blocked with a human-readable message ──────────
console.log('\nAC2 — exactly-at-limit (cap=3, count=3) is blocked with a human-readable message');
await (async function() {
  await reset();
  tenantPlan.setCapReader(function() { return 3; });
  var result = await tenantPlan.checkJourneyCap('tenant-a', 3);
  ok('at-limit is blocked', result.allowed === false);
  ok('cap is reported', result.cap === 3);
})();

// ── AC2: one-under-limit is allowed ─────────────────────────────────────────
console.log('\nAC2 — one-under-limit (cap=3, count=2) is allowed');
await (async function() {
  await reset();
  tenantPlan.setCapReader(function() { return 3; });
  var result = await tenantPlan.checkJourneyCap('tenant-a', 2);
  ok('one-under-limit is allowed', result.allowed === true);
})();

// ── AC2: the caller-facing message is human-readable, not a raw code ───────
// (journey.js renders this — check-s2.1-preflight-gate.js already asserts
//  the rendered page text; here we assert the module-level contract that
//  callers depend on: cap + count are always present so a message can be
//  built, and the module itself never returns a bare numeric/error-code
//  shape with no explanatory fields.)
console.log('\nAC2 — blocked result always carries fields a human-readable message can be built from');
await (async function() {
  await reset();
  tenantPlan.setCapReader(function() { return 1; });
  var result = await tenantPlan.checkJourneyCap('tenant-a', 1);
  ok('blocked result has allowed:false', result.allowed === false);
  ok('blocked result has numeric cap field', typeof result.cap === 'number');
  ok('blocked result has numeric count field', typeof result.count === 'number');
})();

// ── AC1/AC4: paid + active plan state removes the cap entirely ─────────────
console.log('\nAC1/AC4 — paid+active plan state removes the cap regardless of MAX_JOURNEYS_PER_TENANT');
await (async function() {
  await reset();
  process.env.MAX_JOURNEYS_PER_TENANT = '1';
  var before = await tenantPlan.checkJourneyCap('tenant-paid', 5);
  ok('trial (default) plan state is still capped', before.allowed === false);

  await tenantPlan.setPlanState('tenant-paid', 'paid', 'active');
  var after = await tenantPlan.checkJourneyCap('tenant-paid', 5);
  ok('paid+active plan state lifts the cap (unlimited)', after.allowed === true && after.cap === null);
})();

// ── AC4: downgrading/cancelling a paid tenant restores the restriction ─────
console.log('\nAC4 — cancelling/downgrading a paid tenant restores the usage-gate restriction');
await (async function() {
  await reset();
  process.env.MAX_JOURNEYS_PER_TENANT = '2';
  await tenantPlan.setPlanState('tenant-b', 'paid', 'active');
  var whilePaid = await tenantPlan.checkJourneyCap('tenant-b', 10);
  ok('while paid+active — unlimited', whilePaid.allowed === true);

  await tenantPlan.setPlanState('tenant-b', 'trial', 'canceled');
  var afterCancel = await tenantPlan.checkJourneyCap('tenant-b', 10);
  ok('after cancellation — restricted per trial cap again', afterCancel.allowed === false && afterCancel.cap === 2);
})();

// ── AC3: past_due plan state does NOT get the paid unlimited treatment ─────
console.log('\nAC3 — past_due plan state is treated as restricted (not unlimited)');
await (async function() {
  await reset();
  process.env.MAX_JOURNEYS_PER_TENANT = '1';
  await tenantPlan.setPlanState('tenant-c', 'paid', 'past_due');
  var result = await tenantPlan.checkJourneyCap('tenant-c', 1);
  ok('past_due paid tenant is capped like trial (not unlimited)', result.allowed === false);
})();

// ── resetPlanState clears all tracked tenants back to default trial ────────
console.log('\nresetPlanState() — clears tracked plan state back to default trial behaviour');
await (async function() {
  await reset();
  process.env.MAX_JOURNEYS_PER_TENANT = '1';
  await tenantPlan.setPlanState('tenant-d', 'paid', 'active');
  await tenantPlan.resetPlanState();
  var result = await tenantPlan.checkJourneyCap('tenant-d', 1);
  ok('after resetPlanState, tenant is back to default trial (capped)', result.allowed === false);
})();

// ── Existing AC5-equivalent regression: unlimited when no cap configured ──
console.log('\nRegression — no cap configured and no plan state set → unlimited (existing behaviour preserved)');
await (async function() {
  await reset();
  var result = await tenantPlan.checkJourneyCap('tenant-e', 999);
  ok('unlimited when nothing configured', result.allowed === true && result.cap === null);
})();

await reset();
console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
process.exit(failed > 0 ? 1 : 0);

})().catch(function(err) {
  console.error('Test error:', err.message, err.stack);
  process.exit(1);
});
