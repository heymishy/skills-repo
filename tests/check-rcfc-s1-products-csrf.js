'use strict';

// check-rcfc-s1-products-csrf.js — AC3 (story rcfc-s1, Task 3)
// Story: artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
// Test plan: artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
// (`tests/check-rcfc-s1-products-csrf.js — AC3 (2 routes)` section)
//
// Full server.js router dispatch (not the handler in isolation), same convention as
// check-rcfc-s1-journey-forms-csrf.js (Task 1) and check-rcfc-s1-skills-sessions-csrf.js
// (Task 2). Proves the pre-fix vulnerability (a POST with no/invalid _csrf currently
// succeeds) fails against the fixed handler, and that a legitimate round trip (GET page ->
// extract real embedded token -> POST with it) still works after the fix, for the 2
// products routes:
//   - POST /products/confirm         (handlePostProductConfirm)
//   - POST /products/:id/features    (handlePostProductFeature)
//
// req.body is pre-set directly on the dispatched request object rather than emitted via a
// fake EventEmitter stream -- csrf.js's own _readBody() and products.js's own _readBody()
// both explicitly short-circuit on `req.body !== undefined` ("mirrors the _readBody
// short-circuit already present in every route file in this codebase" -- csrf.js's own
// comment), so this is a sanctioned test-injection path, not a workaround. Same convention
// as Task 1/Task 2's own test files.
//
// The round-trip test on POST /products/:id/features seeds one pre-existing journey for
// the created product (via journey-store's own createJourney/setJourneyFields, the same
// pattern check-das-s2-require-connected-repo.js's own AC3 regression guard uses) so das-s2's
// "brand-new product must have a connected repo" gate does not fire -- that gate is orthogonal
// to this story's CSRF concern and already has its own dedicated coverage.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

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

// ── Test-mode bootstrap (mirrors check-rcfc-s1-journey-forms-csrf.js's own setup exactly) ──
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var router          = require('../src/web-ui/server').router;
var seedTestSession  = require('../src/web-ui/middleware/session').seedTestSession;
var getSession       = require('../src/web-ui/middleware/session').getSession;
var journeyStore     = require('../src/web-ui/modules/journey-store');
var repoRootAdapter  = require('../src/web-ui/adapters/repo-root');

// Isolated repo root -- handlePostProductFeature's success path writes a best-effort
// artefact-stage marker to disk (journey-disk.updateStage) under
// <repoRoot>/artefacts/<featureSlug>/... . Without this, the default repo root falls back
// to the process cwd (this repo checkout itself), which would pollute the real working
// tree. Mirrors check-rcfc-s1-journey-forms-csrf.js's own REPO_ROOT setup exactly --
// products.js and journey.js both share the SAME underlying adapters/repo-root.js
// singleton, so setting it once here is sufficient (no separate per-file setter needed).
var REPO_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rcfc-s1-products-'));
repoRootAdapter.setRepoRoot(REPO_ROOT);

// session_id cookie values are matched by sessionMiddleware's own regex,
// /session_id=([a-f0-9]+)/ (middleware/session.js) -- lowercase hex only, no
// hyphens or other characters, or the cookie silently fails to parse and a
// brand-new (unauthenticated) session is used instead.
var _sidCounter = 0;
function nextSid() {
  _sidCounter += 1;
  return require('crypto').createHash('sha1').update('rcfc-s1-products-' + _sidCounter).digest('hex');
}

function seedSession(label, extra) {
  var sid = nextSid();
  seedTestSession(sid, Object.assign({
    accessToken: 'e2e-test-access-token',
    userId: 9600 + _sidCounter,
    login: 'rcfc-s1-products-tester-' + _sidCounter,
    tenantId: 'rcfc-s1-tenant-' + _sidCounter
  }, extra || {}));
  return sid;
}

function makeRes() {
  var res = { _status: null, _headers: {}, _body: '' };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

function getReq(sid, url) {
  return { method: 'GET', url: url, headers: { cookie: 'session_id=' + sid } };
}

// body pre-set directly on req.body — see file header comment on why this is a
// sanctioned test-injection path, not a bypass of the real dispatch.
function postReq(sid, url, body) {
  return { method: 'POST', url: url, headers: { cookie: 'session_id=' + sid }, body: body || {} };
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
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
// Route 1 — POST /products/confirm (handlePostProductConfirm)
// =============================================================================

queue.push(function() {
  return test('products-confirm-rejected-without-csrf: POST /products/confirm with no _csrf field returns 403', async function() {
    var sid = seedSession('confirm-reject');
    var uniqueName = 'RCFC S1 Reject Product ' + Date.now();
    var res = await dispatch(postReq(sid, '/products/confirm', { name: uniqueName, description: 'should not be created' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');

    // Confirm no product was created — a follow-up GET /dashboard render must not
    // mention this test's distinctively-named product.
    var dashRes = await dispatch(getReq(sid, '/dashboard'));
    assert.ok(dashRes._body.indexOf(uniqueName) === -1, 'no product must be created without a valid CSRF token');
  });
});

queue.push(function() {
  return test('products-confirm-full-round-trip: GET /products/new embeds real token, POST /products/confirm with it succeeds', async function() {
    var sid = seedSession('confirm-roundtrip');
    var uniqueName = 'RCFC S1 Roundtrip Product ' + Date.now();

    var getRes = await dispatch(getReq(sid, '/products/new'));
    assert.ok(getRes._status < 400, 'GET /products/new must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered product-new page HTML');

    var postRes = await dispatch(postReq(sid, '/products/confirm', { name: uniqueName, description: 'roundtrip desc', _csrf: token }));
    assert.strictEqual(postRes._status, 302, 'expected 302 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.ok(/^\/products\//.test(postRes._headers.Location), 'expected redirect into the new product\'s view, got ' + postRes._headers.Location);

    var dashRes = await dispatch(getReq(sid, '/dashboard'));
    assert.ok(dashRes._body.indexOf(uniqueName) !== -1, 'the created product must appear on the dashboard on a legitimate submission');
  });
});

// =============================================================================
// Route 2 — POST /products/:id/features (handlePostProductFeature)
// =============================================================================

queue.push(function() {
  return test('products-features-rejected-without-csrf: POST /products/:id/features with no _csrf field returns 403', async function() {
    var sid = seedSession('features-reject');
    var beforeCount = journeyStore.listJourneys().length;
    var res = await dispatch(postReq(sid, '/products/rcfc-s1-nonexistent-product/features', { displayName: 'Reject Feature' }));
    assert.strictEqual(res._status, 403, 'expected 403, got ' + res._status);
    assert.strictEqual(res._body, 'Forbidden');
    var afterCount = journeyStore.listJourneys().length;
    assert.strictEqual(afterCount, beforeCount, 'no journey must be created without a valid CSRF token');
  });
});

queue.push(function() {
  return test('products-features-full-round-trip: GET /products/:id embeds real token, POST features with it succeeds', async function() {
    var sid = seedSession('features-roundtrip');

    // Create a real product first (via the now-fixed confirm route, valid token).
    var newGetRes = await dispatch(getReq(sid, '/products/new'));
    var newToken = extractCsrfValue(newGetRes._body);
    var confirmRes = await dispatch(postReq(sid, '/products/confirm', { name: 'RCFC S1 Features Roundtrip Product', description: 'd', _csrf: newToken }));
    assert.strictEqual(confirmRes._status, 302, 'fixture product creation must succeed, got ' + confirmRes._status);
    var productId = confirmRes._headers.Location.replace('/products/', '');
    assert.ok(productId, 'expected a real product id from the fixture creation redirect');

    // Seed one pre-existing journey for this product so das-s2's "brand-new product
    // needs a connected repo" gate (an orthogonal, already-covered concern) does not
    // fire and mask this test's actual CSRF assertion -- same technique
    // check-das-s2-require-connected-repo.js's own AC3 regression guard uses.
    var seedJourney = journeyStore.createJourney('rcfc-s1-features-fixture', 'default');
    journeyStore.setJourneyFields(seedJourney.journeyId, { productId: productId, tenantId: getSession(sid).tenantId });

    var getRes = await dispatch(getReq(sid, '/products/' + productId));
    assert.ok(getRes._status < 400, 'GET /products/:id must succeed; got ' + getRes._status);
    var token = extractCsrfValue(getRes._body);
    assert.ok(token, 'a _csrf token must be embedded in the rendered product-view page HTML');

    var beforeCount = journeyStore.listJourneys().length;
    var postRes = await dispatch(postReq(sid, '/products/' + productId + '/features', { displayName: 'Roundtrip Feature', _csrf: token }));
    assert.strictEqual(postRes._status, 303, 'expected 303 redirect on legitimate round-trip submission, got ' + postRes._status);
    assert.ok(/^\/skills\/discovery\/sessions\//.test(postRes._headers.Location), 'expected redirect into a new discovery skill session, got ' + postRes._headers.Location);
    var afterCount = journeyStore.listJourneys().length;
    assert.strictEqual(afterCount, beforeCount + 1, 'a new journey must be created on a legitimate round-trip submission');
  });
});

// =============================================================================
// Run
// =============================================================================

async function main() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  try { fs.rmSync(REPO_ROOT, { recursive: true, force: true }); } catch (_) {}
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
