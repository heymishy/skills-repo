#!/usr/bin/env node
// check-nis-s1-named-identity-stub.js — TDD tests for nis-s1
// Tests: AC1-AC7 — routes/auth.js's handleAuthCallback staging-safe
// named-identity stub, and server.js's /test/seed-multi-user-roles e2e-
// prefix hardening.
//
// Run: node tests/check-nis-s1-named-identity-stub.js
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

process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';

const AUTH_PATH          = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
const OAUTH_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');
const USER_ROLES_PATH    = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');
const USER_FLAGS_PATH    = path.resolve(ROOT, 'src/web-ui/modules/user-flags.js');
const CREDITS_PATH       = path.resolve(ROOT, 'src/web-ui/modules/credits.js');
const SERVER_PATH        = path.resolve(ROOT, 'src/web-ui/server.js');

const STUB_HEADER = 'x-e2e-named-identity-stub';
const STUB_SECRET = 'nis-s1-test-secret-value';

function freshRequire(modPath) {
  delete require.cache[require.resolve(modPath)];
  return require(modPath);
}

function mockReq(overrides) {
  return Object.assign({
    session:    {},
    sessionId:  'test-sid-' + Math.random().toString(36).slice(2),
    query:      {},
    headers:    {},
    connection: { remoteAddress: '127.0.0.1' }
  }, overrides || {});
}

function mockRes() {
  const _headers = {};
  const r = {
    statusCode: null,
    body:       '',
    headers:    _headers,
    writeHead:  function(code, hdrs) { r.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader:  function(name, value) { _headers[name] = value; },
    end:        function(body) { r.body = (body != null ? String(body) : ''); r._ended = true; }
  };
  return r;
}

/** Wires oauthAdapter/userRoles/userFlags/credits with tracking spies and returns them + auth module. */
function setup(opts) {
  opts = opts || {};
  const oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  const userRoles     = freshRequire(USER_ROLES_PATH);
  const userFlags     = freshRequire(USER_FLAGS_PATH);
  const credits       = freshRequire(CREDITS_PATH);
  const auth          = freshRequire(AUTH_PATH);

  const calls = { exchangeCode: 0, getUserIdentity: 0, getRoleForTenant: null, getFirstLoginFlag: null, grantFreeTier: null };

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.providerExchangeCode = async function(code) {
    calls.exchangeCode++;
    return 'real-token-' + code;
  };
  oauthAdapter.providerGetUserIdentity = async function(token) {
    calls.getUserIdentity++;
    return { id: 1, login: String(token).replace(/^real-token-/, '') };
  };
  oauthAdapter.storeTokenInSession = function(req, token) { req.session.accessToken = token; };

  userRoles.setGetRoleForTenant(async function(tenantId, identityKey) {
    calls.getRoleForTenant = { tenantId: tenantId, identityKey: identityKey };
    return opts.role || 'user';
  });
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag: async function(userId) {
      calls.getFirstLoginFlag = userId;
      return false; // returning user — simplest path, not the focus of these tests
    },
    clearFirstLoginFlag: async function() {}
  });
  // credits.js's setCreditsAdapter expects a raw db.query()-shaped adapter —
  // grantFreeTierIfNew (a real module-level function, not an adapter method)
  // calls db.query(INSERT ... ON CONFLICT DO NOTHING RETURNING balance) internally.
  credits.setCreditsAdapter({
    query: async function(sql, params) {
      calls.grantFreeTier = params && params[0];
      return { rows: [{ balance: params && params[1] }] };
    }
  });
  auth.setFetchOrgs(async function() { return []; });

  return { auth: auth, oauthAdapter: oauthAdapter, calls: calls };
}

async function runCallback(auth, queryOverrides, headerOverrides) {
  const req = mockReq({
    session: { oauthState: 'state-x' },
    query:   Object.assign({ code: 'c', state: 'state-x' }, queryOverrides || {}),
    headers: headerOverrides || {}
  });
  const res = mockRes();
  await auth.handleAuthCallback(req, res);
  await new Promise(function(r) { setTimeout(r, 5); });
  return { req: req, res: res };
}

// ── AC1: secret unset → stub never activates ──────────────────────────────────
async function testAC1SecretUnsetStubNeverActivates() {
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
  const { auth, calls } = setup();
  await runCallback(auth, { code: 'e2e-alice' }, { [STUB_HEADER]: STUB_SECRET });
  assert(calls.exchangeCode === 1, 'AC1: real providerExchangeCode invoked when secret unset, even with header+e2e- code present');
}

// ── AC2: secret+header+e2e- code → stub activates ──────────────────────────────
async function testAC2StubActivatesForE2ECode() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth, calls } = setup();
  const { req } = await runCallback(auth, { code: 'e2e-alice' }, { [STUB_HEADER]: STUB_SECRET });
  assert(calls.exchangeCode === 0, 'AC2: real providerExchangeCode NOT invoked when stub is active');
  assert(req.session.login === 'e2e-alice', 'AC2: session login set from code via stub path');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

async function testAC2NonPrefixedCodeFallsThroughToRealPath() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth, calls } = setup();
  await runCallback(auth, { code: 'alice' }, { [STUB_HEADER]: STUB_SECRET });
  assert(calls.exchangeCode === 1, 'AC2 (negative): a non-"e2e-"-prefixed code falls through to the real provider path');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ── AC3: no stubTenant → tenantId defaults to login ────────────────────────────
async function testAC3NoStubTenantDefaultsToLogin() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth } = setup();
  const { req } = await runCallback(auth, { code: 'e2e-solo' }, { [STUB_HEADER]: STUB_SECRET });
  assert(req.session.tenantId === 'e2e-solo', 'AC3: tenantId defaults to the login itself when stubTenant is absent');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ── AC4: stubTenant without e2e- prefix → 400, no session ──────────────────────
async function testAC4NonPrefixedStubTenantRejected() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth, calls } = setup();
  const { req, res } = await runCallback(auth, { code: 'e2e-alice', stubTenant: 'real-customer-org' }, { [STUB_HEADER]: STUB_SECRET });
  assert(res.statusCode === 400, 'AC4: non-"e2e-"-prefixed stubTenant is rejected with 400');
  assert(req.session.tenantId === undefined, 'AC4: no tenantId is set on rejection');
  assert(calls.exchangeCode === 0, 'AC4: rejection happens before any provider-exchange attempt');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ── AC5: stubTenant with e2e- prefix → tenantId = stubTenant ───────────────────
async function testAC5PrefixedStubTenantSetsTenantDirectly() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth } = setup();
  const { req } = await runCallback(auth, { code: 'e2e-alice', stubTenant: 'e2e-shared-org' }, { [STUB_HEADER]: STUB_SECRET });
  assert(req.session.tenantId === 'e2e-shared-org', 'AC5: tenantId is set directly from stubTenant, bypassing org-allowlist resolution');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ── AC6: role/first-login/credit-grant call the real, unmodified functions ─────
// Role deliberately non-admin here — arl-s4 makes admins bypass the
// first-login check entirely, which would mask the getFirstLoginFlag assertion.
async function testAC6RealRoleFirstLoginCreditGrantWired() {
  process.env.E2E_STAGING_AUTH_STUB_SECRET = STUB_SECRET;
  const { auth, calls } = setup({ role: 'engineer' });
  const { req } = await runCallback(auth, { code: 'e2e-alice', stubTenant: 'e2e-shared-org' }, { [STUB_HEADER]: STUB_SECRET });

  assert(calls.getRoleForTenant !== null &&
    calls.getRoleForTenant.tenantId === 'e2e-shared-org' &&
    calls.getRoleForTenant.identityKey === 'e2e-alice',
    'AC6: getRoleForTenant called with (tenantId, login) exactly as the real path does');
  assert(req.session.role === 'engineer', 'AC6: role comes from getRoleForTenant\'s return value, never caller-supplied');
  assert(calls.getFirstLoginFlag != null, 'AC6: getFirstLoginFlag called with the stub-derived userId');
  assert(calls.grantFreeTier === 'e2e-shared-org', 'AC6: grantFreeTierIfNew called with the resolved tenantId');
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
}

// ── AC7: seed-multi-user-roles e2e- prefix hardening ───────────────────────────
function testAC7SeedEndpointSourceHardening() {
  const src = fs.readFileSync(SERVER_PATH, 'utf8');
  const seedBlockMatch = src.match(/\/test\/seed-multi-user-roles[\s\S]{0,2500}/);
  const seedBlock = seedBlockMatch ? seedBlockMatch[0] : '';
  assert(seedBlock.indexOf("'e2e-shared-org'") !== -1, 'AC7: sharedOrg default is e2e-shared-org');
  assert(/\^e2e-/i.test(seedBlock), 'AC7: sharedOrg is validated against an e2e- prefix pattern');
  assert(seedBlock.indexOf("'e2e-alice'") !== -1 &&
    seedBlock.indexOf("'e2e-bob'") !== -1 &&
    seedBlock.indexOf("'e2e-viewer'") !== -1,
    'AC7: seeded identity_key values use the e2e- prefix');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[nis-s1] Running AC verification tests...\n');

  console.log('AC1 — secret unset → stub never activates');
  await testAC1SecretUnsetStubNeverActivates();

  console.log('\nAC2 — secret+header+e2e- code → stub activates');
  await testAC2StubActivatesForE2ECode();
  await testAC2NonPrefixedCodeFallsThroughToRealPath();

  console.log('\nAC3 — no stubTenant → tenantId defaults to login');
  await testAC3NoStubTenantDefaultsToLogin();

  console.log('\nAC4 — stubTenant without e2e- prefix → 400, no session');
  await testAC4NonPrefixedStubTenantRejected();

  console.log('\nAC5 — stubTenant with e2e- prefix → tenantId set directly');
  await testAC5PrefixedStubTenantSetsTenantDirectly();

  console.log('\nAC6 — role/first-login/credit-grant use real unmodified functions');
  await testAC6RealRoleFirstLoginCreditGrantWired();

  console.log('\nAC7 — seed-multi-user-roles e2e- prefix hardening');
  testAC7SeedEndpointSourceHardening();

  console.log('\n[nis-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[nis-s1] Unexpected error:', err);
  process.exit(1);
});
