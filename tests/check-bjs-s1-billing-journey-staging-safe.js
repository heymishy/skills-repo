#!/usr/bin/env node
// check-bjs-s1-billing-journey-staging-safe.js — TDD tests for bjs-s1
// Tests: AC1-AC7 — server.js's /test/session staging-safe widening (with the
// e2e- tenantId guard) and routes/billing.js's staging-safe webhook-signature
// stub (with the e2e- tenantId guard on every candidate field).
//
// Run: node tests/check-bjs-s1-billing-journey-staging-safe.js
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) { console.log('  PASS: ' + label); passed++; }
  else           { console.error('  FAIL: ' + label); failed++; failures.push(label); }
}

process.env.SESSION_SECRET        = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const STRIPE_CLIENT_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'stripe-client'));
const BILLING_PATH       = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'billing'));
const CREDITS_PATH       = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
const TENANT_PLAN_PATH   = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-plan'));

const WEBHOOK_STUB_HEADER = 'x-e2e-webhook-stub';
const STUB_SECRET = 'bjs-s1-test-secret-value';

function mockReq(opts) {
  opts = opts || {};
  return {
    session: opts.session !== undefined ? opts.session : {},
    body:    opts.body !== undefined ? opts.body : Buffer.from('{}'),
    headers: opts.headers || {},
    query:   opts.query || {},
  };
}

function mockRes() {
  return {
    _statusCode: null,
    _headers:    {},
    _body:       null,
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) Object.assign(this._headers, headers);
    },
    end: function(body) { this._body = body || null; }
  };
}

function mockWebhookDb() {
  return { query: async function(sql) {
    if (sql.indexOf('INSERT INTO stripe_events') !== -1) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  } };
}

/** Wires credits/stripe-client/tenant-plan/billing fresh, with a real-signature-verification spy. */
function freshBilling() {
  delete require.cache[CREDITS_PATH];
  const credits = require(CREDITS_PATH);
  credits.setCreditsAdapter({ query: async function() { return { rows: [] }; } });

  delete require.cache[STRIPE_CLIENT_PATH];
  const sc = require(STRIPE_CLIENT_PATH);
  let realVerifyCalls = 0;
  sc.setStripeAdapter({
    webhooks: { constructEvent: function() { realVerifyCalls++; throw new Error('signature verification failed (mock)'); } },
    checkout: { sessions: { create: async function() { throw new Error('must not be called'); } } },
    billingPortal: { sessions: { create: async function() { throw new Error('must not be called'); } } }
  });

  delete require.cache[TENANT_PLAN_PATH];
  const tenantPlan = require(TENANT_PLAN_PATH);
  const setPlanStateCalls = [];
  tenantPlan.setPlanState = async function(tenantId, plan, status) {
    setPlanStateCalls.push({ tenantId: tenantId, plan: plan, status: status });
  };

  delete require.cache[BILLING_PATH];
  const billing = require(BILLING_PATH);
  billing.setWebhookDbAdapter(mockWebhookDb());

  return { billing: billing, getRealVerifyCalls: function() { return realVerifyCalls; }, setPlanStateCalls: setPlanStateCalls };
}

async function postWebhook(billing, event, headers) {
  const req = mockReq({ body: Buffer.from(JSON.stringify(event)), headers: headers || {} });
  const res = mockRes();
  await billing.handlePostStripeWebhook(req, res);
  return res;
}

// ── /test/session tests (AC1-AC4) ──────────────────────────────────────────
// Follows check-dss-s1-staging-safe-test-endpoint-gate.js's own established
// convention for this exact class of change: a live behavioural gate-function
// test (server.js is required ONCE, not repeatedly — re-requiring it in one
// process hangs, since it opens real DB/Redis-adapter resources at require
// time) plus a source-text assertion confirming the actual /test/session
// route condition line was widened as intended.
const SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');
const serverModule = require(SERVER_PATH);
const serverSrc = fs.readFileSync(SERVER_PATH, 'utf8');

function testSessionGateAC1SecretUnset() {
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
  const req = { headers: { 'x-e2e-test-endpoint-bypass': 'anything' } };
  assert(serverModule._isTestEndpointAllowed(req) === false, 'AC1: secret unset -> _isTestEndpointAllowed false (route stays NODE_ENV=test-only)');
}

function testSessionGateAC2SecretSetHeaderMatches() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const req = { headers: { 'x-e2e-test-endpoint-bypass': STUB_SECRET } };
  assert(serverModule._isTestEndpointAllowed(req) === true, 'AC2: secret set + header matches -> _isTestEndpointAllowed true');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

function testSessionRouteWidenedInSource() {
  const lineMatch = /if \(pathname === '\/test\/session'[^\n]*\)\s*\{/;
  const m = lineMatch.exec(serverSrc);
  assert(!!m, 'expected to find the /test/session route condition line');
  assert(m && m[0].indexOf('_isTestEndpointAllowed(req)') !== -1,
    'AC2: /test/session route condition now uses _isTestEndpointAllowed(req)');
}

function testSessionTenantIdPrefixGuardInSource() {
  // AC3/AC4: confirm the e2e- prefix guard exists in the /test/session
  // handler body, immediately after the tenantId default assignment.
  const blockMatch = /pathname === '\/test\/session'[\s\S]{0,1200}/;
  const m = blockMatch.exec(serverSrc);
  assert(!!m, 'expected to find the /test/session handler body');
  assert(m && /\^e2e-/i.test(m[0]), 'AC3/AC4: /test/session handler validates tenantId against an e2e- prefix pattern');
}

// ── Webhook stub tests (AC5-AC7) ───────────────────────────────────────────────

async function testAC5SecretUnsetStubNeverActivates() {
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
  const { billing, getRealVerifyCalls } = freshBilling();
  await postWebhook(billing, { id: 'evt_1', type: 'checkout.session.completed', data: { object: { client_reference_id: 'e2e-alice' } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(getRealVerifyCalls() === 1, 'AC5: real verifyWebhookSignature invoked when secret unset, even with header present');
}

async function testAC6StubActivatesForAllE2ETenantIds() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { billing, getRealVerifyCalls, setPlanStateCalls } = freshBilling();
  const res = await postWebhook(billing,
    { id: 'evt_2', type: 'checkout.session.completed', data: { object: { client_reference_id: 'e2e-alice', metadata: { planName: 'STARTER' } } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(getRealVerifyCalls() === 0, 'AC6: real verifyWebhookSignature NOT invoked when the stub is active');
  assert(res._statusCode === 200, 'AC6: stub-activated request still completes 200');
  assert(setPlanStateCalls.length === 1 && setPlanStateCalls[0].tenantId === 'e2e-alice',
    'AC6: existing dispatch logic runs unmodified (tenantPlan.setPlanState called with the event\'s tenantId)');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

async function testAC6StubActivatesForMetadataTenantId() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { billing, setPlanStateCalls } = freshBilling();
  await postWebhook(billing,
    { id: 'evt_3', type: 'invoice.payment_failed', data: { object: { metadata: { tenant_id: 'e2e-bob' } } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(setPlanStateCalls.length === 1 && setPlanStateCalls[0].tenantId === 'e2e-bob' && setPlanStateCalls[0].status === 'past_due',
    'AC6: metadata.tenant_id-shaped event also activates the stub and dispatches correctly');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

async function testAC7RejectsNonE2EClientReferenceId() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { billing, setPlanStateCalls } = freshBilling();
  const res = await postWebhook(billing,
    { id: 'evt_4', type: 'checkout.session.completed', data: { object: { client_reference_id: 'real-customer-org' } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(res._statusCode === 400, 'AC7: non-e2e- client_reference_id -> 400');
  assert(setPlanStateCalls.length === 0, 'AC7: no plan-state mutation happens on rejection');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

async function testAC7RejectsNonE2EMetadataTenantId() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { billing, setPlanStateCalls } = freshBilling();
  const res = await postWebhook(billing,
    { id: 'evt_5', type: 'invoice.payment_failed', data: { object: { metadata: { tenant_id: 'real-customer-org' } } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(res._statusCode === 400, 'AC7: non-e2e- metadata.tenant_id -> 400');
  assert(setPlanStateCalls.length === 0, 'AC7: no plan-state mutation happens on rejection');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

async function testAC7RejectsNonE2ESubscriptionMetadataTenantId() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { billing, setPlanStateCalls } = freshBilling();
  const res = await postWebhook(billing,
    { id: 'evt_6', type: 'invoice.paid', data: { object: { subscription_details: { metadata: { tenant_id: 'real-customer-org' } } } } },
    { [WEBHOOK_STUB_HEADER]: STUB_SECRET });
  assert(res._statusCode === 400, 'AC7: non-e2e- subscription_details.metadata.tenant_id -> 400');
  assert(setPlanStateCalls.length === 0, 'AC7: no plan-state mutation happens on rejection');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[bjs-s1] Running AC verification tests...\n');

  console.log('AC1/AC2 — /test/session gate (secret unset vs set+header)');
  testSessionGateAC1SecretUnset();
  testSessionGateAC2SecretSetHeaderMatches();
  testSessionRouteWidenedInSource();

  console.log('\nAC3/AC4 — /test/session tenantId e2e- prefix guard');
  testSessionTenantIdPrefixGuardInSource();

  console.log('\nAC5 — webhook stub: secret unset -> never activates');
  await testAC5SecretUnsetStubNeverActivates();

  console.log('\nAC6 — webhook stub: activates for all-e2e- tenantIds, dispatch unmodified');
  await testAC6StubActivatesForAllE2ETenantIds();
  await testAC6StubActivatesForMetadataTenantId();

  console.log('\nAC7 — webhook stub: rejects any non-e2e- tenantId field');
  await testAC7RejectsNonE2EClientReferenceId();
  await testAC7RejectsNonE2EMetadataTenantId();
  await testAC7RejectsNonE2ESubscriptionMetadataTenantId();

  console.log('\n[bjs-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bjs-s1] Unexpected error:', err);
  process.exit(1);
});
