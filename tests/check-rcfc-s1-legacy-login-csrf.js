'use strict';

// check-rcfc-s1-legacy-login-csrf.js — AC4 (story rcfc-s1, Task 4)
// Story: artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
// Test plan: artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
// (`tests/check-rcfc-s1-legacy-login-csrf.js — AC4 (1 route, 2 forms)` section)
//
// Full server.js router dispatch (not the handler in isolation), same convention as
// check-rcfc-s1-journey-forms-csrf.js (Task 1), check-rcfc-s1-skills-sessions-csrf.js
// (Task 2), and check-rcfc-s1-products-csrf.js (Task 3).
//
// Unlike Tasks 1-3, auth-email.js's handleEmailLogin/handleEmailSignup ALREADY call
// csrfGuard before this story -- the fix here is purely on the GET-rendering side
// (renderLoginPage() in html-shell.js now embeds the CSRF field into both forms). Today
// (pre-fix), every real submission through this fallback shell 403s regardless of
// credentials, because the form has no _csrf field at all -- the round-trip test below is
// the regression guard for that pre-existing bug, not just a theoretical gap-closer.
//
// req.body is pre-set directly on the dispatched request object rather than emitted via a
// fake EventEmitter stream -- csrf.js's own _readBody() and auth-email.js's own _readBody()
// both explicitly short-circuit on `req.body !== undefined`. Same sanctioned test-injection
// convention as Task 1/2/3's own test files.

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

// ── Test-mode bootstrap (mirrors check-rcfc-s1-products-csrf.js's own setup exactly) ──
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var router = require('../src/web-ui/server').router;
// auth-email.js/password.js are wired to a fake in-memory users DB + real bcrypt at
// server.js require-time whenever NODE_ENV=test and DATABASE_URL is unset (confirmed by
// direct probe against this checkout -- "[bri-s3.2] fake in-memory users/products DB
// wired (NODE_ENV=test, no DATABASE_URL)" logs on require) -- no explicit setUserDb/
// setPasswordAdapter call needed here.

function makeRes() {
  var res = { _status: null, _headers: {}, _body: '' };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.setHeader = function(name, value) { res._headers[name] = value; };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

// Unauthenticated -- no cookie, sessionMiddleware mints a brand-new anonymous session
// on the fly and returns its id via Set-Cookie, exactly as a real first-time visitor's
// browser would receive it.
function getReqNoCookie(url) {
  return { method: 'GET', url: url, headers: {} };
}

function getReqWithCookie(sid, url) {
  return { method: 'GET', url: url, headers: { cookie: 'session_id=' + sid } };
}

// body pre-set directly on req.body — see file header comment on why this is a
// sanctioned test-injection path, not a bypass of the real dispatch.
function postReqNoCookie(url, body) {
  return { method: 'POST', url: url, headers: {}, body: body || {} };
}

function postReqWithCookie(sid, url, body) {
  return { method: 'POST', url: url, headers: { cookie: 'session_id=' + sid }, body: body || {} };
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

function extractSessionId(setCookieHeader) {
  var m = setCookieHeader && setCookieHeader.match(/session_id=([a-f0-9]+)/);
  return m ? m[1] : null;
}

// Some GET routes are registered in server.js as `authGuard(req, res, async () => { ... })`
// -- NOT awaited by router() itself -- so router()'s own returned promise can resolve
// before the wrapped handler has actually finished writing the response. Waiting on
// res.end() being called (rather than on router()'s promise) works for both that case and
// the directly-awaited case, so it's used universally here. Mirrors
// check-rcfc-s1-journey-forms-csrf.js's own dispatch helper exactly.
function dispatch(req) {
  return new Promise(function(resolve, reject) {
    var res = makeRes();
    var settled = false;
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

var queue = [];

// =============================================================================
// Route — POST /auth/email/login and POST /auth/email/signup, rendered via the
// legacy renderLoginPage() fallback shell (server.js catch-all, unmatched route)
// =============================================================================

queue.push(function() {
  return test('legacy-shell-signin-rejected-without-csrf: POST /auth/email/login with no _csrf field returns 403', async function() {
    var res = await dispatch(postReqNoCookie('/auth/email/login', { email: 'rcfc-s1-legacy-signin-reject@example.com', password: 'RcfcS1Pwd123' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
  });
});

queue.push(function() {
  return test('legacy-shell-signup-rejected-without-csrf: POST /auth/email/signup with no _csrf field returns 403', async function() {
    var res = await dispatch(postReqNoCookie('/auth/email/signup', { email: 'rcfc-s1-legacy-signup-reject@example.com', password: 'RcfcS1Pwd123' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
  });
});

queue.push(function() {
  return test('legacy-shell-signin-full-round-trip: GET the fallback shell embeds real token, POST /auth/email/login with it succeeds', async function() {
    var email = 'rcfc-s1-legacy-roundtrip-' + Date.now() + '@example.com';
    var password = 'RcfcS1Pwd123';

    // 1. Unauthenticated GET to an unmatched route reaches the catch-all fallback shell
    //    (renderLoginPage) and mints a fresh anonymous session.
    var shellRes1 = await dispatch(getReqNoCookie('/this-route-does-not-exist-rcfc-s1-legacy'));
    assert.strictEqual(shellRes1._status, 200, 'expected 200 from the fallback shell, got ' + shellRes1._status);
    assert.ok(shellRes1._body.indexOf('id="email-signin-form"') !== -1, 'expected the sign-in form to be present in the fallback shell');
    var sid = extractSessionId(shellRes1._headers['Set-Cookie']);
    assert.ok(sid, 'expected a Set-Cookie session_id to be minted for the anonymous fallback-shell request');
    var signupToken = extractCsrfValue(shellRes1._body);
    assert.ok(signupToken, 'a _csrf token must be embedded in the rendered fallback-shell HTML');

    // 2. Fixture setup (not the assertion under test): create the real user this
    //    round-trip will log in as, via the now-fixed signup form on the SAME session
    //    so the extracted token remains valid.
    var signupRes = await dispatch(postReqWithCookie(sid, '/auth/email/signup', { email: email, password: password, _csrf: signupToken }));
    assert.strictEqual(signupRes._status, 302, 'fixture signup must succeed, got ' + signupRes._status);
    assert.strictEqual(signupRes._headers.Location, '/welcome', 'fixture signup must redirect to /welcome');

    // Signup rotates the session id (session-fixation prevention, AC6 of lab-s2.2) and
    // deletes the pre-signup session -- the fixture's own Set-Cookie carries the new,
    // now-authenticated session id forward. Subsequent requests must use it, not the
    // original anonymous `sid` (which no longer exists server-side).
    var rotatedSid = extractSessionId(signupRes._headers['Set-Cookie']) || sid;

    // 3. Re-fetch the fallback shell on the rotated (now-authenticated) session (proves
    //    the embedded token is still the real, currently-valid session token --
    //    generateCsrfToken caches/reuses it for the session's lifetime, per csrf.js's own
    //    contract) and extract the sign-in form's token for the actual round-trip
    //    assertion. The fallback shell itself does not check authentication state, so it
    //    renders normally even on this now-authenticated session.
    var shellRes2 = await dispatch(getReqWithCookie(rotatedSid, '/this-route-does-not-exist-rcfc-s1-legacy'));
    assert.strictEqual(shellRes2._status, 200, 'expected 200 from the fallback shell on the second fetch, got ' + shellRes2._status);
    var loginToken = extractCsrfValue(shellRes2._body);
    assert.ok(loginToken, 'a _csrf token must be embedded in the rendered fallback-shell HTML on the second fetch');

    // 4. The actual round-trip assertion: POST /auth/email/login with the extracted
    //    token and the real credentials created in step 2 must now succeed -- this is
    //    also the regression guard for the pre-existing bug (pre-fix, this always 403s
    //    regardless of credentials because the form carried no _csrf field at all).
    var loginRes = await dispatch(postReqWithCookie(rotatedSid, '/auth/email/login', { email: email, password: password, _csrf: loginToken }));
    assert.strictEqual(loginRes._status, 302, 'expected 302 redirect on legitimate round-trip login, got ' + loginRes._status);
    assert.strictEqual(loginRes._headers.Location, '/dashboard', 'expected redirect to /dashboard on legitimate login');
  });
});

// =============================================================================
// Run
// =============================================================================

async function main() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && (f.err.stack || f.err.message) || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

main();
