'use strict';
// check-lab-s2.3-welcome.js — AC verification tests for lab-s2.3 (/welcome onboarding)
// Tests T1.1, T1.2, T2.1, T3.1, T4.1, T4.2, T5.1, T5.2, T6.1, T7.1 (unit)
// Integration tests IT1, IT2
// No real DB calls — user-flags adapter is monkeypatched per test.
// Auth tests (T1, T2) run SEQUENTIALLY to avoid session-mock interference.

// Set process.env BEFORE any require() of application code
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var path = require('path');
var fs   = require('fs');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock res that captures writeHead, setHeader, and end calls. */
function mockRes() {
  return {
    _statusCode: null,
    _headers:    {},
    _body:       null,
    setHeader: function(k, v) { this._headers[k] = v; },
    writeHead: function(status, headers) {
      this._statusCode = status;
      if (headers) {
        var self = this;
        Object.keys(headers).forEach(function(k) { self._headers[k] = headers[k]; });
      }
    },
    end: function(body) { this._body = body || null; }
  };
}

// ── Resolve module paths ─────────────────────────────────────────────────────
var userFlagsPath    = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'user-flags'));
var publicPath       = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'public'));
var authPath         = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var posthogPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));
var oauthAdapterPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));
var sessionPath      = require.resolve(path.join(ROOT, 'src', 'web-ui', 'middleware', 'session'));

// ── Auth callback test helper ─────────────────────────────────────────────────
// Runs a simulated auth callback with a controlled first-login flag value.
// All module patching/unpatching happens synchronously within this function
// and is fully awaited before returning. This avoids concurrent-test interference.
async function runAuthCallback(opts) {
  opts = opts || {};
  var isFirst = typeof opts.firstLogin === 'boolean' ? opts.firstLogin : true;

  // (1) Fresh userFlags instance
  delete require.cache[userFlagsPath];
  var userFlags = require(userFlagsPath);
  var clearCalls = [];
  userFlags.setUserFlagsAdapter({
    getFirstLoginFlag:   async function() { return isFirst; },
    clearFirstLoginFlag: async function(uid) { clearCalls.push(uid); }
  });

  // (2) Patch oauthAdapter methods in-place (module ref, so auth.js sees patches)
  var oauthAdapter = require(oauthAdapterPath);
  var saved = {
    validateOAuthState:      oauthAdapter.validateOAuthState,
    providerExchangeCode:    oauthAdapter.providerExchangeCode,
    providerGetUserIdentity: oauthAdapter.providerGetUserIdentity,
    storeTokenInSession:     oauthAdapter.storeTokenInSession
  };
  oauthAdapter.validateOAuthState      = function() { return true; };
  oauthAdapter.providerExchangeCode    = async function() { return 'test-token'; };
  oauthAdapter.providerGetUserIdentity = async function() { return { id: 42, login: 'testuser' }; };
  oauthAdapter.storeTokenInSession     = function(req, token) { req.session.accessToken = token; };

  // (3) Patch session module in-place (module ref, so the already-destructured locals in auth.js
  //     are NOT affected — we must reload auth.js AFTER patching so it destructures afresh)
  var sessionMod  = require(sessionPath);
  var newSession  = { accessToken: 'test-token', userId: 42, login: 'testuser' };
  var savedPersist  = sessionMod.persistSession;
  var savedRotate   = sessionMod.rotateSessionId;
  var savedGetSess  = sessionMod.getSession;
  sessionMod.persistSession   = function() {};
  sessionMod.rotateSessionId  = function() { return { newId: 'new-sess-001' }; };
  sessionMod.getSession       = function() { return newSession; };

  // (4) Reload auth.js so it re-destructures session funcs from the patched module
  delete require.cache[authPath];
  var auth = require(authPath);

  // (5) Build request and call handler
  var req = {
    session:   { oauthState: 'csrf-state', returnTo: undefined, accessToken: undefined },
    query:     { code: 'oauth-code', state: 'csrf-state' },
    sessionId: 'sess-test',
    headers:   {}
  };
  var res = mockRes();

  try {
    await auth.handleAuthCallback(req, res);
    // Wait a tick for any fire-and-forget promises to settle
    await new Promise(function(r) { setTimeout(r, 10); });
  } finally {
    // (6) Restore everything
    oauthAdapter.validateOAuthState      = saved.validateOAuthState;
    oauthAdapter.providerExchangeCode    = saved.providerExchangeCode;
    oauthAdapter.providerGetUserIdentity = saved.providerGetUserIdentity;
    oauthAdapter.storeTokenInSession     = saved.storeTokenInSession;
    sessionMod.persistSession   = savedPersist;
    sessionMod.rotateSessionId  = savedRotate;
    sessionMod.getSession       = savedGetSess;
    // Reload auth once more so subsequent tests start clean
    delete require.cache[authPath];
  }

  return { res: res, clearCalls: clearCalls, newSession: newSession };
}

// ── T1 — First-login auth callback → redirect to /welcome (AC1) ─────────────
// ── T2 — Returning user auth callback → /dashboard (AC2) ────────────────────
// Run sequentially inside one async function to avoid session-mock interference.
console.log('\n── T1 + T2: Auth callback firstLogin detection (AC1 / AC2) ──');

(async function runAuthTests() {
  // T1: first login
  var r1 = await runAuthCallback({ firstLogin: true });

  // T1.1 — redirect to /welcome
  check(
    'first-login-auth-callback-redirects-to-welcome',
    r1.res._statusCode === 302 && r1.res._headers['Location'] === '/welcome'
  );

  // T1.2 — firstLogin flag on new session + clearFirstLoginFlag called
  check(
    'first-login-flag-set-on-user-record',
    r1.newSession.firstLogin === true && r1.clearCalls.length === 1 && r1.clearCalls[0] === 42
  );

  // T2: returning user
  var r2 = await runAuthCallback({ firstLogin: false });

  // T2.1 — redirect to /dashboard
  check(
    'returning-user-auth-callback-redirects-to-dashboard',
    r2.res._statusCode === 302 && r2.res._headers['Location'] === '/dashboard'
  );
})().catch(function(err) {
  console.error('Auth tests error:', err.message, err.stack);
  failed += 3;
});

// ── Welcome handler tests: run via setImmediate so auth tests settle first ────
setImmediate(function() {

  // Wire env vars for welcome page tests
  process.env.STRIPE_PRICE_ID_STARTER = 'price_starter_test';
  process.env.STRIPE_PRICE_ID_PRO     = 'price_pro_test';
  process.env.PLAN_NAME_STARTER       = 'Starter';
  process.env.PLAN_NAME_PRO           = 'Pro';

  // Fresh public module with env vars set
  delete require.cache[publicPath];
  var pub = require(publicPath);

  // ── T3 — Unauthenticated /welcome → 302 / (AC3) ───────────────────────────
  console.log('\n── T3: Unauthenticated /welcome → 302 / (AC3) ──');

  (async function testT3() {
    var req = { session: {}, query: {}, headers: {}, sessionId: 'anon' };
    var res = mockRes();
    await pub.handleWelcome(req, res);
    check(
      'unauthenticated-welcome-redirects-to-landing',
      res._statusCode === 302 && res._headers['Location'] === '/'
    );
  })().catch(function(err) { console.error('T3 error:', err.message); failed++; });

  // ── T4 — /welcome renders plan options for first-time user (AC4) ──────────
  console.log('\n── T4: /welcome renders plan options (AC4) ──');

  (async function testT4() {
    // T4.1 — 200 response for authenticated first-login user
    var req41 = {
      session: { accessToken: 'tok', userId: 1, firstLogin: true },
      query: {}, headers: {}, sessionId: 'sess-fl'
    };
    var res41 = mockRes();
    await pub.handleWelcome(req41, res41);
    check(
      'welcome-page-200-for-first-time-user',
      res41._statusCode === 200
    );

    // T4.2 — HTML contains plan names from env vars; no placeholder text
    var body = res41._body || '';
    check(
      'welcome-page-contains-plan-options-from-env',
      body.includes('Starter') &&
      body.includes('Pro') &&
      !body.includes('PLAN_NAME_PLACEHOLDER') &&
      !body.includes('STRIPE_PLAN_PRICE_ID_PLACEHOLDER') &&
      body.includes('Get started')
    );
  })().catch(function(err) { console.error('T4 error:', err.message); failed += 2; });

  // ── T5 — Plan CTA form structure (AC5) ────────────────────────────────────
  console.log('\n── T5: Plan CTA form wired to /billing/checkout (AC5) ──');

  (async function testT5() {
    var req51 = {
      session: { accessToken: 'tok', userId: 1, firstLogin: true },
      query: {}, headers: {}, sessionId: 'sess-fl'
    };
    var res51 = mockRes();
    await pub.handleWelcome(req51, res51);
    var body = res51._body || '';

    // T5.1 — form action targets /billing/checkout
    check(
      'welcome-plan-cta-form-action-targets-billing-checkout',
      body.includes('action="/billing/checkout"')
    );

    // T5.2 — planId field present in form
    check(
      'welcome-plan-cta-includes-plan-id-field',
      body.includes('name="planId"')
    );
  })().catch(function(err) { console.error('T5 error:', err.message); failed += 2; });

  // ── T6 — plan_selected PostHog event (AC6) ────────────────────────────────
  console.log('\n── T6: plan_selected PostHog event fires (AC6) ──');

  (async function testT6() {
    // Monkeypatch PostHog module's capture function
    var posthogMod = require(posthogPath);
    var origCapture = posthogMod.capture;
    var posthogCalls = [];
    posthogMod.capture = function(id, event, props) {
      posthogCalls.push({ id: id, event: event, props: props });
    };

    // Reload public so it picks up the patched posthog via lazy getter
    delete require.cache[publicPath];
    var pub6 = require(publicPath);

    var req61 = {
      session: { accessToken: 'tok', userId: 5, firstLogin: true },
      query: {}, headers: {}, sessionId: 'sess-ph'
    };
    var res61 = mockRes();
    await pub6.handleWelcome(req61, res61);

    // Give a tick for any async fire-and-forget settlement
    await new Promise(function(r) { setTimeout(r, 10); });

    var phCall = posthogCalls.find(function(c) { return c.event === 'plan_selected'; });
    check(
      'plan-selected-posthog-event-fires-on-plan-submission',
      !!phCall && phCall.props !== undefined && 'planName' in phCall.props
    );

    // Restore
    posthogMod.capture = origCapture;
  })().catch(function(err) { console.error('T6 error:', err.message); failed++; });

  // ── T7 — Already-completed user → 302 /dashboard (AC7) ───────────────────
  console.log('\n── T7: Already-completed user → /dashboard (AC7) ──');

  (async function testT7() {
    var req71 = {
      session: { accessToken: 'tok', userId: 2, firstLogin: false },
      query: {}, headers: {}, sessionId: 'sess-done'
    };
    var res71 = mockRes();
    // Use the pub instance (no firstLogin flag)
    await pub.handleWelcome(req71, res71);
    check(
      'already-completed-welcome-redirects-to-dashboard',
      res71._statusCode === 302 && res71._headers['Location'] === '/dashboard'
    );
  })().catch(function(err) { console.error('T7 error:', err.message); failed++; });

  // ── Integration tests ──────────────────────────────────────────────────────
  console.log('\n── IT: Integration tests ──');

  var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');

  // IT1 — user-flags adapter wired in server.js and /welcome route registered
  check(
    'user-flags-adapter-wired-in-server',
    serverSrc.includes('setUserFlagsAdapter') &&
    serverSrc.includes('user-flags') &&
    serverSrc.includes('/welcome') &&
    serverSrc.includes('handleWelcome')
  );

  // IT2 — user-flags D37 default stub throws when adapter not wired
  (function testIT2() {
    delete require.cache[userFlagsPath];
    var userFlagsClean = require(userFlagsPath);
    // Do NOT call setUserFlagsAdapter — default stub should throw
    userFlagsClean.getFirstLoginFlag(1).catch(function(e) {
      check(
        'user-flags-default-stub-throws',
        e && e.message && e.message.includes('Adapter not wired: userFlagsAdapter')
      );
    });
  })();

  // Print results after all async checks settle
  setTimeout(function() {
    console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);
  }, 300);
});
