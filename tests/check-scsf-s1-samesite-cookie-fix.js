'use strict';

// check-scsf-s1-samesite-cookie-fix.js — regression tests for scsf-s1
//
// Story:     artefacts/2026-07-23-session-cookie-samesite-fix/stories/scsf-s1.md
// Test plan: artefacts/2026-07-23-session-cookie-samesite-fix/test-plans/scsf-s1-test-plan.md
//
// Covers UT1-UT3 and IT1-IT2 from the test plan directly.
// UT4 (the existing NFR1 test in tests/check-wuce1-oauth-flow.js asserting
// SESSION_COOKIE_CONFIG.sameSite === 'lax') is verified by that file itself,
// updated as part of this same story -- not duplicated here.
// IT3 (full regression pass) is verified by running `npm test` in full, not
// by nesting a recursive test-suite invocation inside this file (see
// tests/known-baseline-failures.json's documented note on why a nested
// full-suite invocation inside a single check-*.js file causes timeout
// contention for unrelated files -- this file deliberately avoids that
// pattern).
//
// Root cause background: the session cookie was set with SameSite=Strict,
// which browsers never attach to a cross-site-initiated top-level
// navigation -- even a legitimate one like Stripe's hosted-Checkout redirect
// or a GitHub/Google OAuth callback. SameSite=Lax fixes this while still
// blocking the cookie on cross-site subrequests/AJAX/iframes/POSTs (the
// actual CSRF-relevant surface).

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function fakeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  return r;
}

var sessionModule = require('../src/web-ui/middleware/session');
var SESSION_COOKIE_CONFIG = sessionModule.SESSION_COOKIE_CONFIG;

(async function main() {

  // ── UT1: SESSION_COOKIE_CONFIG.sameSite is 'lax' ──────────────────────────
  console.log('\nUT1 — SESSION_COOKIE_CONFIG.sameSite is lax (AC1)');
  ok('sameSite is lax', SESSION_COOKIE_CONFIG.sameSite === 'lax');
  ok('sameSite is not strict', SESSION_COOKIE_CONFIG.sameSite !== 'strict');
  ok('sameSite is not none', SESSION_COOKIE_CONFIG.sameSite !== 'none');
  ok('httpOnly unchanged (true)', SESSION_COOKIE_CONFIG.httpOnly === true);
  ok('secure unchanged (true)', SESSION_COOKIE_CONFIG.secure === true);

  // ── UT2: Set-Cookie header string says SameSite=Lax ───────────────────────
  console.log('\nUT2 — Set-Cookie header string says SameSite=Lax (AC1)');
  (function() {
    sessionModule._clearForTesting();
    var req = { headers: {} }; // no cookie -- triggers new-session Set-Cookie write
    var res = fakeRes();
    return sessionModule.sessionMiddleware(req, res).then(function() {
      var cookie = res._headers['Set-Cookie'] || '';
      ok('Set-Cookie header was written', cookie.length > 0);
      ok('cookie contains SameSite=Lax', cookie.includes('SameSite=Lax'));
      ok('cookie does not contain SameSite=Strict', !cookie.includes('SameSite=Strict'));
      ok('cookie does not contain SameSite=None', !cookie.includes('SameSite=None'));
      ok('cookie is still HttpOnly', cookie.includes('HttpOnly'));
    });
  })();

  // ── UT3: no cookie header -> fresh session (unchanged boundary behaviour) ─
  console.log('\nUT3 — no cookie presented still creates a fresh session (AC3 boundary doc)');
  await (function() {
    sessionModule._clearForTesting();
    var req = { headers: {} };
    var res = fakeRes();
    return sessionModule.sessionMiddleware(req, res).then(function() {
      ok('a session was created', typeof req.session === 'object' && req.session !== null);
      ok('the created session is empty (fresh, not reused)', Object.keys(req.session).length === 0);
      ok('req.sessionId was assigned', typeof req.sessionId === 'string' && req.sessionId.length > 0);
    });
  })();

  // ── IT1: cookie presented on a request resolves the pre-existing session ──
  console.log('\nIT1 — presented cookie resolves the pre-existing session, not a new one (AC2)');
  await (function() {
    sessionModule._clearForTesting();
    var created = sessionModule.createSession();
    created.session.accessToken = 'preexisting-token';
    created.session.tenantId    = 'e2e-tester';

    var req = { headers: { cookie: 'session_id=' + created.id } };
    var res = fakeRes();
    return sessionModule.sessionMiddleware(req, res).then(function() {
      ok('req.sessionId matches the presented cookie ID', req.sessionId === created.id);
      ok('req.session is the pre-existing session (accessToken present)', req.session.accessToken === 'preexisting-token');
      ok('req.session is the pre-existing session (tenantId present)', req.session.tenantId === 'e2e-tester');
      ok('no new Set-Cookie header written (existing session reused, not replaced)', !res._headers['Set-Cookie']);
    });
  })();

  // ── IT2: a redirect-target-shaped route sees the authenticated session ────
  console.log('\nIT2 — redirect-target route (e.g. /billing/success, /auth/*/callback) sees the authenticated session (AC2)');
  await (function() {
    sessionModule._clearForTesting();
    var created = sessionModule.createSession();
    created.session.accessToken = 'gho_valid_token';
    created.session.userId      = 42;

    // Simulate what server.js's router does: run sessionMiddleware first,
    // then hand off to a guarded route handler.
    var req = { headers: { cookie: 'session_id=' + created.id } };
    var res = fakeRes();
    return sessionModule.sessionMiddleware(req, res).then(function() {
      // The guarded handler's own logic: read req.session.accessToken.
      var isAuthenticated = !!(req.session && req.session.accessToken);
      ok('redirect-target handler sees an authenticated session', isAuthenticated === true);
      ok('redirect-target handler sees the correct userId', req.session.userId === 42);
    });
  })();

})().then(function() {
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}).catch(function(err) {
  console.error('Unexpected error:', err);
  process.exit(1);
});
