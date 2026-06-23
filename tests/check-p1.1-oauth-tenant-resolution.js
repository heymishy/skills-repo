'use strict';
const assert = require('assert');
const { execSync } = require('child_process');

// ── Module load ────────────────────────────────────────────────────────────
let buildOAuthRedirectURL;
try {
  const oauthAdapter = require('../src/web-ui/auth/oauth-adapter');
  buildOAuthRedirectURL = oauthAdapter.buildOAuthRedirectURL;
} catch (e) {
  console.error('FAIL: Cannot load oauth-adapter:', e.message);
  process.exit(1);
}

let setFetchOrgs, resolveTenant, setLogger;
try {
  const authMod = require('../src/web-ui/routes/auth');
  setFetchOrgs  = authMod.setFetchOrgs;
  resolveTenant = authMod.resolveTenant;
  setLogger     = authMod.setLogger;
  if (typeof setFetchOrgs !== 'function')  throw new Error('setFetchOrgs not exported from routes/auth');
  if (typeof resolveTenant !== 'function') throw new Error('resolveTenant not exported from routes/auth');
} catch (e) {
  console.error('FAIL: Cannot load auth module:', e.message);
  process.exit(1);
}

// Run all tests sequentially to avoid shared _fetchOrgs state being clobbered
// between concurrent async IIFEs (NFR3 slow-fetch test must not race with NFR2).
(async function runTests() {
  let passed = 0;
  let failed = 0;

  function pass(n, msg) { console.log('PASS ' + n + ': ' + msg); passed++; }
  function fail(n, msg) { console.error('FAIL ' + n + ': ' + msg); failed++; }

  // ── Test 1 — AC7: default _fetchOrgs stub throws before setFetchOrgs is wired ──
  try {
    let threw = false;
    try {
      await resolveTenant('fake-token', 'org-a');
    } catch (e) {
      threw = true;
      assert.strictEqual(
        e.message,
        'Adapter not wired: fetchOrgs. Call setFetchOrgs() with a real implementation before use.',
        'AC7: stub must throw the exact D37 error message, got: ' + e.message
      );
    }
    assert.ok(threw, 'AC7: expected default _fetchOrgs to throw');
    pass(1, 'AC7 — default _fetchOrgs stub throws before wiring');
  } catch (e) { fail(1, e.message); }

  // ── Test 2 — AC1: read:org included in scope when TENANT_ORG_ALLOWLIST is set ──
  try {
    const savedClientId  = process.env.GITHUB_CLIENT_ID;
    const savedAllowlist = process.env.TENANT_ORG_ALLOWLIST;
    process.env.GITHUB_CLIENT_ID     = 'test-client-id';
    process.env.TENANT_ORG_ALLOWLIST = 'org-a';
    const url         = buildOAuthRedirectURL('test-state');
    const decodedUrl  = decodeURIComponent(url);
    assert.ok(decodedUrl.includes('read:org'), 'AC1: expected read:org in scope, got: ' + url);
    process.env.GITHUB_CLIENT_ID = savedClientId;
    delete process.env.TENANT_ORG_ALLOWLIST;
    if (savedAllowlist !== undefined) process.env.TENANT_ORG_ALLOWLIST = savedAllowlist;
    pass(2, 'AC1 — read:org in scope when TENANT_ORG_ALLOWLIST set');
  } catch (e) { fail(2, e.message); }

  // ── Test 3 — AC1 variant: no read:org when TENANT_ORG_ALLOWLIST absent ──
  try {
    const savedClientId  = process.env.GITHUB_CLIENT_ID;
    const savedAllowlist = process.env.TENANT_ORG_ALLOWLIST;
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    delete process.env.TENANT_ORG_ALLOWLIST;
    const url        = buildOAuthRedirectURL('test-state');
    const decodedUrl = decodeURIComponent(url);
    assert.ok(!decodedUrl.includes('read:org'), 'AC1 variant: expected no read:org, got: ' + url);
    process.env.GITHUB_CLIENT_ID = savedClientId;
    if (savedAllowlist !== undefined) process.env.TENANT_ORG_ALLOWLIST = savedAllowlist;
    pass(3, 'AC1 variant — no read:org when TENANT_ORG_ALLOWLIST absent');
  } catch (e) { fail(3, e.message); }

  // ── Test 4 — AC2: single-page resolution — first allowlist match wins by allowlist order ──
  try {
    setFetchOrgs(async function() {
      return [{ login: 'org-b' }, { login: 'org-a' }];
    });
    const result = await resolveTenant('fake-token', 'org-a,org-b');
    assert.strictEqual(result, 'org-a', 'AC2: expected org-a (first in allowlist), got: ' + result);
    pass(4, 'AC2 — single-page, first allowlist match wins');
  } catch (e) { fail(4, e.message); }

  // ── Test 5 — AC3: multi-page pagination — match found on page 2 ──
  try {
    setFetchOrgs(async function(token, page) {
      if (page === 1) return { orgs: [{ login: 'org-b' }], nextPage: 2 };
      return { orgs: [{ login: 'org-a' }], nextPage: null };
    });
    const result = await resolveTenant('fake-token', 'org-a');
    assert.strictEqual(result, 'org-a', 'AC3: expected org-a found on page 2, got: ' + result);
    pass(5, 'AC3 — multi-page pagination, match on page 2');
  } catch (e) { fail(5, e.message); }

  // ── Test 6 — AC4: zero-match returns undefined ──
  try {
    setFetchOrgs(async function() {
      return [{ login: 'org-x' }];
    });
    const result = await resolveTenant('fake-token', 'org-a');
    assert.strictEqual(result, undefined, 'AC4: expected undefined for zero-match, got: ' + result);
    pass(6, 'AC4 — zero-match returns undefined');
  } catch (e) { fail(6, e.message); }

  // ── Test 7 — AC4 NFR: zero-match undefined + error message does not expose allowlist ──
  try {
    setFetchOrgs(async function() {
      return [{ login: 'org-x' }];
    });
    const result = await resolveTenant('fake-token', 'org-a,org-b');
    assert.strictEqual(result, undefined, 'AC4 NFR: resolveTenant must return undefined for zero-match');
    // Verify the generic error message used in auth.js does not expose allowlist names
    const errorMessage = 'You are not a member of an authorised organisation.';
    assert.ok(!errorMessage.includes('org-a'), 'AC4 NFR: error message must not expose org-a');
    assert.ok(!errorMessage.includes('org-b'), 'AC4 NFR: error message must not expose org-b');
    pass(7, 'AC4 NFR — zero-match undefined + error message does not expose allowlist');
  } catch (e) { fail(7, e.message); }

  // ── Test 8 — AC5: multi-match — first in allowlist order wins over response order ──
  try {
    // org-b appears FIRST in API response, but org-a is FIRST in allowlist
    setFetchOrgs(async function() {
      return [{ login: 'org-b' }, { login: 'org-a' }];
    });
    const result = await resolveTenant('fake-token', 'org-a,org-b');
    assert.strictEqual(result, 'org-a', 'AC5: expected org-a (first in allowlist), got: ' + result);
    pass(8, 'AC5 — multi-match, first allowlist entry wins');
  } catch (e) { fail(8, e.message); }

  // ── Test 9 — AC6: empty allowlist — resolveTenant returns undefined without calling fetchOrgs ──
  try {
    let orgFetchCalled = false;
    setFetchOrgs(async function() { orgFetchCalled = true; return []; });
    const result = await resolveTenant('fake-token', '');
    assert.strictEqual(result, undefined, 'AC6: expected undefined when allowlist is empty');
    assert.strictEqual(orgFetchCalled, false, 'AC6: _fetchOrgs must NOT be called when allowlist is empty');
    pass(9, 'AC6 — empty allowlist, fetchOrgs not called, undefined returned');
  } catch (e) { fail(9, e.message); }

  // ── Test 10 — AC6 variant: whitespace-only allowlist treated as absent ──
  try {
    let orgFetchCalled = false;
    setFetchOrgs(async function() { orgFetchCalled = true; return []; });
    const result = await resolveTenant('fake-token', '   ');
    assert.strictEqual(result, undefined, 'AC6 variant: expected undefined for whitespace-only allowlist');
    assert.strictEqual(orgFetchCalled, false, 'AC6 variant: fetchOrgs must not be called for whitespace-only allowlist');
    pass(10, 'AC6 variant — whitespace-only allowlist treated as absent');
  } catch (e) { fail(10, e.message); }

  // ── Test 11 — NFR1: resolveTenant is async (returns a Promise) ──
  try {
    setFetchOrgs(async function() { return []; });
    const ret = resolveTenant('fake-token', 'org-a');
    assert.ok(ret && typeof ret.then === 'function', 'NFR1: resolveTenant must return a Promise');
    await ret.catch(function() {}); // consume to avoid unhandled rejection
    pass(11, 'NFR1 — resolveTenant returns a Promise');
  } catch (e) { fail(11, e.message); }

  // ── Test 12 — NFR2: resolves within 5 seconds for 3-page synthetic response ──
  try {
    let callCount = 0;
    setFetchOrgs(async function(token, page) {
      callCount++;
      if (page === 1) return { orgs: [{ login: 'org-x' }], nextPage: 2 };
      if (page === 2) return { orgs: [{ login: 'org-y' }], nextPage: 3 };
      return { orgs: [{ login: 'org-a' }], nextPage: null };
    });
    const timeout5s = new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('NFR2: resolveTenant exceeded 5000ms')); }, 5000);
    });
    const result = await Promise.race([resolveTenant('fake-token', 'org-a'), timeout5s]);
    assert.strictEqual(result, 'org-a', 'NFR2: expected org-a after 3 pages');
    assert.strictEqual(callCount, 3, 'NFR2: expected 3 fetchOrgs calls (one per page), got: ' + callCount);
    pass(12, 'NFR2 — 3-page resolution completes within 5s, 3 fetchOrgs calls');
  } catch (e) { fail(12, e.message); }

  // ── Test 13 — NFR3: warning logged when fetch exceeds 3 seconds ──
  try {
    let warnCalled = false;
    if (typeof setLogger === 'function') {
      setLogger({
        info: function() {},
        warn: function(event) { if (event === 'org_fetch_slow') warnCalled = true; }
      });
    }
    setFetchOrgs(async function() {
      await new Promise(function(r) { setTimeout(r, 3100); });
      return [{ login: 'org-a' }];
    });
    await resolveTenant('fake-token', 'org-a');
    assert.ok(warnCalled, 'NFR3: expected org_fetch_slow warning when fetch exceeds 3s');
    pass(13, 'NFR3 — org_fetch_slow warning emitted after 3s');
    // Restore silent logger
    if (typeof setLogger === 'function') {
      setLogger({ info: function() {}, warn: function() {} });
    }
  } catch (e) { fail(13, e.message); }

  // ── Tests 14–15: Regression — pre-existing suites must pass ──────────────
  try {
    execSync('node tests/check-p0.1-journey-access.js', { stdio: 'inherit' });
    pass(14, 'regression — check-p0.1-journey-access.js exit 0');
  } catch (e) { fail(14, 'check-p0.1-journey-access.js failed: ' + e.message); }

  try {
    execSync('node tests/check-p0.2-journey-guard-wiring.js', { stdio: 'inherit' });
    pass(15, 'regression — check-p0.2-journey-guard-wiring.js exit 0');
  } catch (e) { fail(15, 'check-p0.2-journey-guard-wiring.js failed: ' + e.message); }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (failed > 0) {
    console.error('\n' + failed + ' test(s) FAILED — see above.');
    process.exitCode = 1;
  } else {
    console.log('\nAll ' + passed + ' tests passed.');
  }
})();
