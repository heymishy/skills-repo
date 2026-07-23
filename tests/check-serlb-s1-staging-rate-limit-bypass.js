#!/usr/bin/env node
// check-serlb-s1-staging-rate-limit-bypass.js — AC verification tests for story
// serlb-s1 (artefacts/2026-07-23-staging-e2e-rate-limit-bypass).
//
// Fixes the real, CI-verified defect in PR https://github.com/heymishy/skills-repo/pull/563:
// the "Scenario A E2E (staging)" job signs up a fresh e2e-test--tagged tenant in nearly
// every spec (a1-a4), tripping routes/auth-email.js's real 10-attempt/5-minute per-IP
// rate limiter (RATE_MAX) on real wuce-staging, which has no NODE_ENV=test guard.
//
// This is NOT a fix that raises RATE_MAX or blanket-disables the limiter for staging
// (that would be a real abuse-surface regression on a live app). It adds a narrow,
// TRIPLE-gated carve-out, only exercised once the normal 10-attempt threshold is
// already exceeded:
//   1. process.env.E2E_STAGING_AUTH_STUB_SECRET is configured on this server (reused
//      from a1-staging-safe-auth-stub's existing staging-only secret -- never set on
//      the production wuce.fly.dev app; production isolation is therefore covered by
//      the SAME existing guardrail, tests/check-a1-fly-config-isolation.js, that
//      already asserts this env var's name is absent from fly.toml).
//   2. The request carries a matching `x-e2e-rate-limit-bypass` header (constant-time
//      compared against the configured secret) -- a bare env var leak alone is not
//      enough.
//   3. The specific signup/login attempt's own email is itself `e2e-test-`-tagged
//      (tests/e2e/fixtures/staging-auth.js's uniqueEmail() convention) -- a request
//      that only supplies gates 1+2 but signs up/logs in a REAL (non-e2e-test-) email
//      is still rate-limited normally. This third gate is what distinguishes this fix
//      from the naive "raise RATE_MAX globally" approach.
//
// Run: node tests/check-serlb-s1-staging-rate-limit-bypass.js

'use strict';

const path = require('path');
const bcrypt = require('bcrypt');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  PASS: ' + label); passed++; }
  else { console.error('  FAIL: ' + label); failed++; }
}

// ── Set env vars before requiring modules ────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
// Ensure a clean starting point regardless of what the shell environment has set --
// each test below sets/deletes this itself to exercise both configured and
// unconfigured (production-like) states.
delete process.env.E2E_STAGING_AUTH_STUB_SECRET;

// ── Load modules ─────────────────────────────────────────────────────────────
const { setPasswordAdapter } = require(path.join(ROOT, 'src/web-ui/modules/password'));
const {
  handleEmailSignup,
  handleEmailLogin,
  setUserDb,
  _clearRateLimits
} = require(path.join(ROOT, 'src/web-ui/routes/auth-email'));

setPasswordAdapter(bcrypt);

const BYPASS_HEADER = 'x-e2e-rate-limit-bypass';
const BYPASS_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';
const TEST_SECRET = 'unit-test-only-fake-secret-value';

// ── Test helpers (mirrors tests/check-lab-s2.2-email-password.js's shape) ────
function mockReq(overrides) {
  const req = Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    body: undefined
  }, overrides || {});
  if (!req.session.csrfToken) {
    req.session.csrfToken = 'test-csrf-token-' + Math.random().toString(36).slice(2);
  }
  if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) {
    req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
  }
  return req;
}

function mockRes() {
  const _headers = {};
  const r = {
    statusCode: null,
    body: '',
    headers: _headers,
    writeHead: function(code, hdrs) {
      r.statusCode = code;
      if (hdrs) Object.assign(_headers, hdrs);
    },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { r.body = (body != null ? String(body) : ''); r._ended = true; }
  };
  return r;
}

function mockUserDb(opts) {
  opts = opts || {};
  const rows = opts.rows || [];
  return {
    query: async function(sql) {
      if (/INSERT INTO users/i.test(sql)) {
        return { rows: [{ id: 'uuid-' + Math.random().toString(36).slice(2, 8) }] };
      }
      if (/SELECT.*FROM users WHERE email/i.test(sql)) {
        return { rows: rows };
      }
      return { rows: [] };
    }
  };
}

/** Drive N signup attempts from the same IP to push the shared per-IP counter past RATE_MAX. */
async function driveSignupsToLimit(ip, count, label) {
  setUserDb(mockUserDb({ rows: [] }));
  for (let i = 0; i < count; i++) {
    const req = mockReq({
      body: { email: (label || 'filler') + '-' + i + '@example.test', password: 'FillerPass1!' },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
  }
}

(async function run() {
  // ── T1 (AC1 regression baseline): no bypass configured at all -- 11th signup
  //    attempt from the same IP is still rate-limited exactly as before this story. ──
  console.log('\nT1 — no-bypass-configured-11th-signup-still-429 (AC1 regression baseline)');
  {
    delete process.env[BYPASS_SECRET_ENV_VAR];
    _clearRateLimits();
    const ip = '10.10.10.1';
    await driveSignupsToLimit(ip, 10, 't1-filler');
    const req = mockReq({
      body: { email: 'e2e-test-t1-should-still-block@example.test', password: 'FillerPass1!' },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 429, '11th signup attempt returns 429 when the bypass secret is not configured at all');
  }

  // ── T2 (AC2, the RED->GREEN case): bypass secret configured + matching header +
  //    e2e-test--tagged email on the 11th attempt -- request is allowed through. ──
  console.log('\nT2 — secret-configured-header-matches-e2e-test-email-11th-attempt-allowed (AC2)');
  {
    process.env[BYPASS_SECRET_ENV_VAR] = TEST_SECRET;
    _clearRateLimits();
    const ip = '10.10.10.2';
    await driveSignupsToLimit(ip, 10, 't2-filler');
    const req = mockReq({
      body: { email: 'e2e-test-t2-should-pass-' + Date.now() + '@example.test', password: 'FillerPass1!' },
      headers: { [BYPASS_HEADER]: TEST_SECRET },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    setUserDb(mockUserDb({ rows: [] }));
    await handleEmailSignup(req, res);
    assert(res.statusCode === 302, '11th signup attempt is allowed through (302, not 429) when all three gates are satisfied');
  }

  // ── T3 (AC2 defense-in-depth, real-user regression): secret configured + header
  //    matches, but the email is NOT e2e-test--tagged -- still rate-limited. ──
  console.log('\nT3 — secret-configured-header-matches-non-e2e-test-email-still-429 (AC2 defense-in-depth)');
  {
    process.env[BYPASS_SECRET_ENV_VAR] = TEST_SECRET;
    _clearRateLimits();
    const ip = '10.10.10.3';
    await driveSignupsToLimit(ip, 10, 't3-filler');
    const req = mockReq({
      body: { email: 'real-user-not-e2e-tagged@example.test', password: 'FillerPass1!' },
      headers: { [BYPASS_HEADER]: TEST_SECRET },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 429, 'a REAL (non-e2e-test-) user signup is still rate-limited even when the staging bypass secret/header are both present');
  }

  // ── T4 (production-isolation proof, mirrors a1 AC3): secret NOT configured
  //    (the real state on production, since it is never set outside wuce-staging's
  //    Fly secrets) -- header + e2e-test- email are both present but irrelevant;
  //    the bypass never fires without gate 1. ──
  console.log('\nT4 — secret-not-configured-header-and-e2e-test-email-present-still-429 (production-isolation proof)');
  {
    delete process.env[BYPASS_SECRET_ENV_VAR];
    _clearRateLimits();
    const ip = '10.10.10.4';
    await driveSignupsToLimit(ip, 10, 't4-filler');
    const req = mockReq({
      body: { email: 'e2e-test-t4-should-still-block@example.test', password: 'FillerPass1!' },
      headers: { [BYPASS_HEADER]: TEST_SECRET },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(
      res.statusCode === 429,
      'bypass never fires when E2E_STAGING_AUTH_STUB_SECRET is unset -- the same guarantee ' +
      'production relies on, since this env var is only ever a wuce-staging Fly secret'
    );
  }

  // ── T5 (header-mismatch proof): secret configured, but the request's header value
  //    does not match it -- still rate-limited, proving a bare env var leak alone
  //    (without knowing the exact secret value) is not enough. ──
  console.log('\nT5 — secret-configured-header-value-wrong-still-429');
  {
    process.env[BYPASS_SECRET_ENV_VAR] = TEST_SECRET;
    _clearRateLimits();
    const ip = '10.10.10.5';
    await driveSignupsToLimit(ip, 10, 't5-filler');
    const req = mockReq({
      body: { email: 'e2e-test-t5-should-still-block@example.test', password: 'FillerPass1!' },
      headers: { [BYPASS_HEADER]: 'wrong-secret-value' },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 429, 'a mismatched bypass header value is rejected even when the secret is configured');
  }

  // ── T6 (login shares the same counter, per AC1): handleEmailLogin honours the
  //    same triple gate, since it shares the same _rateLimits map/RATE_MAX as signup. ──
  console.log('\nT6 — login-shares-counter-and-honours-same-bypass (AC1, shared limiter)');
  {
    process.env[BYPASS_SECRET_ENV_VAR] = TEST_SECRET;
    _clearRateLimits();
    const ip = '10.10.10.6';
    await driveSignupsToLimit(ip, 10, 't6-filler');
    setUserDb(mockUserDb({ rows: [{ id: 'uuid-1', email: 'e2e-test-t6-login@example.test', password_hash: await bcrypt.hash('Whatever1!', 10) }] }));
    const req = mockReq({
      body: { email: 'e2e-test-t6-login@example.test', password: 'Whatever1!' },
      headers: { [BYPASS_HEADER]: TEST_SECRET },
      connection: { remoteAddress: ip }
    });
    const res = mockRes();
    await handleEmailLogin(req, res);
    assert(res.statusCode === 302, 'an 11th login attempt for an e2e-test- tagged email is allowed through the shared counter when all three gates are satisfied');
  }

  // ── T7 (sanity, unaffected IP): a different IP with no prior attempts is
  //    unaffected by any of the above -- the fix is per-IP-counter-scoped as before. ──
  console.log('\nT7 — different-ip-unaffected (sanity)');
  {
    delete process.env[BYPASS_SECRET_ENV_VAR];
    setUserDb(mockUserDb({ rows: [] }));
    const req = mockReq({
      body: { email: 'fresh-user-on-fresh-ip@example.test', password: 'FillerPass1!' },
      connection: { remoteAddress: '10.10.10.99' }
    });
    const res = mockRes();
    await handleEmailSignup(req, res);
    assert(res.statusCode === 302, 'a fresh IP with no prior attempts signs up normally (302), unaffected by other IPs\' counters');
  }

  console.log('\n[serlb-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
