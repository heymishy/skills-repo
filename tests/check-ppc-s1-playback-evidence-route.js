'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

queue.push(function() {
  return test('commitArtefact: base64 encoding passes binary content through unchanged (no re-encoding)', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { artefactPath: artefactPath, content: content, encoding: encoding };
      return { ok: true };
    });
    var fakePngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
    await acw.commitArtefact('artefacts/x/shot.png', fakePngBase64, 'tok', 'acme', 'widgets', 'base64');
    assert.strictEqual(received.encoding, 'base64');
    assert.strictEqual(received.content, fakePngBase64, 'content must pass through unchanged when already base64');
  });
});

queue.push(function() {
  return test('commitArtefact: default (no encoding arg) behaves exactly as before -- markdown text, utf8', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { content: content, encoding: encoding };
      return { ok: true };
    });
    await acw.commitArtefact('artefacts/x/notes.md', '# hello', 'tok', 'acme', 'widgets');
    assert.strictEqual(received.content, '# hello');
    assert.strictEqual(received.encoding, undefined, 'existing callers never pass a 6th arg -- must stay undefined, not default to a new value that changes their behaviour');
  });
});

queue.push(function() {
  return test('realCommitArtefact: encoding=base64 passes content straight through to the PUT body unchanged', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var originalFetch = global.fetch;
    var putBody = null;
    global.fetch = async function(url, opts) {
      if (String(url).endsWith('/user')) {
        return { ok: true, json: async function() { return { name: 'Test User', login: 'testuser' }; } };
      }
      if (opts && opts.method === 'PUT') {
        putBody = JSON.parse(opts.body);
        return { ok: true, json: async function() { return { ok: true }; } };
      }
      // GET existing file check -- simulate "not found" (brand new file)
      return { ok: false, status: 404 };
    };
    try {
      var fakeBase64 = Buffer.from([1, 2, 3, 4]).toString('base64');
      await acw.realCommitArtefact('artefacts/x/shot.png', fakeBase64, 'tok', 'acme', 'widgets', 'base64');
      assert.strictEqual(putBody.content, fakeBase64, 'base64 content must pass straight through, not be re-encoded via Buffer.from(content, utf8)');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

// Matches journey.js's/features.js's own DI convention: one stable required
// store instance, reset between tests via its own _clearForTesting() --
// never require.cache-busting, since playback-evidence.js now takes the
// store via setJourneyStoreModule() (journey-store.js code review fix).
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
pe.setJourneyStoreModule(store);
function getStore() {
  store._clearForTesting();
  return store;
}
function makeRes() {
  var res = {
    _status: null, _json: null, _body: null,
    json: function(body) { res._status = res._status || 200; res._json = body; },
    // csrfGuard (src/web-ui/middleware/csrf.js) writes a raw 403 via
    // writeHead/end on failure, not res.status().json() -- support both so
    // a CSRF rejection is observable the same way a handler-level 4xx is.
    writeHead: function(status) { res._status = status; },
    end: function(body) { res._body = body; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    // csrfToken matches the '_csrf: test-csrf-token' value every mutating
    // POST test below sends in its body -- csrfGuard compares the two.
    // userId is unique per call (ppc-s3): this file's own capture-trigger
    // tests never intend to exercise rate-limiting themselves -- that is
    // ppc-s3's own test file's job -- so every call must get its own
    // independent rate-limit bucket, not share one via a fixed/derived value.
    session: { tenantId: tenantId, userId: 'ppc-s1-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s1-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence |',
    '|----|------------|----------|',
    '| AC1 — Shows the dashboard | Yes | screenshot |',
    '| AC2 — Saves a widget | Yes | screenshot |'
  ].join('\n');
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}

queue.push(function() {
  return test('AC1: GET surface lists ACs scoped to the requesting tenant+product only', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.strictEqual(res._json.acs.length, 2);
    assert.strictEqual(res._json.acs[0].acId, 'AC1');
  });
});

queue.push(function() {
  return test('AC4: an AC with no stored capture target shows NOT_SET, not a broken/erroring action', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].targetSet, false);
    assert.strictEqual(res._json.acs[0].target, null);
  });
});

queue.push(function() {
  return test('AC5: a captured screenshot path displays inline, no separate download step', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].screenshotPath, 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png');
  });
});

queue.push(function() {
  return test('AC7-precursor: unknown/unmatched tenant+product+slug combination returns 404, not a crash', async function() {
    var store = getStore();
    var req = makeReq('tenant-nobody', 'product-nobody', 'slug-that-does-not-exist');
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);
    assert.strictEqual(res._status, 404);
    assert.deepStrictEqual(res._json, { error: 'not found' });
  });
});

queue.push(function() {
  return test('AC2: POST stores a capture target, available for every subsequent read without re-entry', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: 'http://localhost:3000/dashboard', selector: '#widget-1', _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTarget(req, res, null, null);

    assert.strictEqual(res._json.ok, true);

    var reloaded = store.getJourney(setup.journeyId);
    assert.deepStrictEqual(reloaded.captureTargets[0], { acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' });

    // A subsequent GET reflects the stored target with no re-entry.
    var getReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var getRes = makeRes();
    await pe.handleGetPlaybackEvidence(getReq, getRes, null, null);
    assert.strictEqual(getRes._json.acs[0].targetSet, true);
    assert.deepStrictEqual(getRes._json.acs[0].target, { acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' });
  });
});

queue.push(function() {
  return test('AC2: missing url or selector is rejected with 400, nothing stored', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: '', selector: '', _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTarget(req, res, null, null);

    assert.strictEqual(res._status, 400);
    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.captureTargets || []).length, 0);
  });
});

queue.push(function() {
  return test('AC2: a missing/mismatched CSRF token is rejected with 403, nothing stored', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: 'http://localhost:3000/dashboard', selector: '#widget-1', _csrf: 'wrong-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTarget(req, res, null, null);

    assert.strictEqual(res._status, 403);
    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.captureTargets || []).length, 0, 'nothing must be stored when the CSRF check fails');
  });
});

function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}

queue.push(function() {
  return test('AC3: capture-trigger seeds the Playwright cookie from req.sessionId, navigates to the stored target, persists the screenshot', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-capture-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);
    var seenCookieSessionId = null;
    var browserClosed = false;
    var fakePage = {
      goto: async function(url) { fakePage._gotoUrl = url; },
      screenshot: async function(opts) {
        fakePage._selector = opts.selector;
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    sessionPageAdapter.setSessionPageAdapter(async function(sessionId, baseUrl) {
      seenCookieSessionId = sessionId;
      return { page: fakePage, browser: { close: async function() { browserClosed = true; } } };
    });

    var capturedCommit = null;
    artefactCommitWriter.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      capturedCommit = { artefactPath: artefactPath, token: token, owner: owner, repo: repo, encoding: encoding };
      return { ok: true };
    });

    var mockPool = makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]);

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, mockPool);

    assert.strictEqual(seenCookieSessionId, req.sessionId, 'the Playwright context cookie must be seeded with req.sessionId, never a service credential');
    assert.strictEqual(fakePage._gotoUrl, 'http://localhost:3000/dashboard');
    assert.strictEqual(fakePage._selector, '#widget-1');
    assert.strictEqual(capturedCommit.encoding, 'base64');
    assert.strictEqual(capturedCommit.token, req.session.accessToken, 'commitArtefact must use the user\'s own accessToken, never a service account');
    assert.strictEqual(res._json.ok, true);
    assert.strictEqual(browserClosed, true, 'the Playwright browser must be closed after a successful capture');

    var reloaded = store.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC1, 'the screenshot path must be persisted on the journey for AC5 inline display');
  });
});

queue.push(function() {
  return test('AC3: triggering capture for an AC with no stored target is rejected with 400, no adapter calls made', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var adapterCalled = false;
    sessionPageAdapter.setSessionPageAdapter(async function() { adapterCalled = true; return { page: {}, browser: { close: async function() {} } }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 400);
    assert.strictEqual(adapterCalled, false, 'must never reach the capture mechanism when no target is stored');
  });
});

queue.push(function() {
  return test('AC3: a product with no connected repo is rejected with 400, no adapter calls made', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    var adapterCalled = false;
    sessionPageAdapter.setSessionPageAdapter(async function() { adapterCalled = true; return { page: {}, browser: { close: async function() {} } }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    // Empty rows -- the tenant+product-scoped product lookup finds nothing.
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 400);
    assert.deepStrictEqual(res._json, { error: 'product has no connected repo' });
    assert.strictEqual(adapterCalled, false, 'must never reach the capture mechanism when the product has no connected repo');
  });
});

queue.push(function() {
  return test('AC3: a commit failure returns a structured 502, not an uncaught exception, and still closes the browser', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-capture-fail-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);
    var browserClosed = false;
    var fakePage = {
      goto: async function() {},
      screenshot: async function(opts) {
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return { page: fakePage, browser: { close: async function() { browserClosed = true; } } };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() {
      throw new Error('simulated GitHub API failure');
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._status, 502);
    assert.strictEqual(res._json.error, 'capture-failed');
    assert.ok(res._json.detail && res._json.detail.includes('simulated GitHub API failure'));
    assert.strictEqual(browserClosed, true, 'the browser must still be closed when the commit fails');

    var reloaded = store.getJourney(setup.journeyId);
    assert.ok(!reloaded.captureScreenshots || !reloaded.captureScreenshots.AC1, 'nothing must be marked captured when the commit fails');
  });
});

queue.push(function() {
  return test('server.js source mounts all 3 playback-evidence routes', function() {
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/handleGetPlaybackEvidence/.test(serverSrc), 'GET route must be mounted');
    assert.ok(/handlePostCaptureTarget/.test(serverSrc), 'POST capture-target route must be mounted');
    assert.ok(/handlePostCaptureTrigger/.test(serverSrc), 'POST capture-trigger route must be mounted');
  });
});

queue.push(function() {
  return test('integration: real server.js router dispatches GET /products/:id/playback-evidence/:slug to the real handler', async function() {
    // Matches check-vrne-s1-server-wiring.js's/check-jsvr-s1-wire-stage-view-route.js's
    // established real-dispatch pattern: this is the only way to prove the
    // route REGEX+PARAMS+DISPATCH actually work, not just that the handler
    // names appear as text in server.js (the source-text test above cannot
    // tell a real mount apart from a dead, unreferenced require()).
    process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
    process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
    process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
    process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
    var router = require('../src/web-ui/server').router;
    var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

    // session.js's own cookie parser only matches lowercase hex session ids
    // (_parseSessionId: /session_id=([a-f0-9]+)/) -- a human-readable id
    // would silently fail to parse and fall through to an unauthenticated
    // 302, not a 404, masking what this test is actually trying to prove.
    var sid = require('crypto').randomBytes(16).toString('hex');
    seedTestSession(sid, { accessToken: 'test-token', tenantId: 'tenant-dispatch-test', login: 'dispatch-tester' });

    var req = {
      method: 'GET',
      url: '/products/product-dispatch-test/playback-evidence/slug-that-does-not-exist',
      headers: { cookie: 'session_id=' + sid }
    };
    var resStatus = null, resBody = null;
    // ppc-s4: _resolveJourney now has an extra async fallback hop
    // (_resolveViaPipelineState) before reaching its 404 branch for a
    // not-found feature. authGuard (routes/auth.js) is fire-and-forget --
    // it invokes next() and only .catch()es it, never awaiting/returning
    // that promise up to router()'s own caller (same class of race
    // check-vrne-s1-server-wiring.js's dispatchAndAwaitResponse already
    // documents and fixes for /products/confirm). `await router(req, res)`
    // alone is no longer guaranteed to run after the real write -- wait for
    // res.end() itself to fire instead.
    var responded = new Promise(function(resolve) {
      var res2 = {
        writeHead: function(status) { resStatus = status; },
        end: function(body) { resBody = body; resolve(); },
        setHeader: function() {}
      };
      router(req, res2).catch(resolve);
    });
    await responded;

    // No journey exists for this product+slug -- the real handler must
    // reach its own 404 branch (via the real getJourneyByTenantProductSlug,
    // not a mock), proving the regex matched, req.params.productId and
    // req.params.featureSlug were extracted correctly, authGuard passed the
    // seeded session through, and dispatch truly reached
    // handleGetPlaybackEvidence -- not just that its name exists in the file.
    assert.strictEqual(resStatus, 404);
    assert.deepStrictEqual(JSON.parse(resBody), { error: 'not found' });
  });
});

queue.push(function() {
  return test('AC6: two tenants sharing a colliding feature_slug each see only their own content', async function() {
    var store = getStore();
    var collidingSlug = 'duplicate-slug-' + Date.now();
    var setupA = setupDodCompleteJourney(store, { tenantId: 'tenant-A', productId: 'product-A', featureSlug: collidingSlug });
    var setupB = setupDodCompleteJourney(store, { tenantId: 'tenant-B', productId: 'product-B', featureSlug: collidingSlug });
    store.setCaptureTarget(setupB.journeyId, 'AC1', 'http://evil.example.com/tenant-b-secret', '#tenant-b-selector');
    store.setJourneyFields(setupB.journeyId, { captureScreenshots: { AC1: 'artefacts/' + collidingSlug + '/playback/ppc-s1/screenshots/tenant-B-secret.png' } });

    var reqA = makeReq('tenant-A', 'product-A', collidingSlug);
    var resA = makeRes();
    await pe.handleGetPlaybackEvidence(reqA, resA, null, null);
    var bodyString = JSON.stringify(resA._json);

    assert.strictEqual(resA._json.featureSlug, collidingSlug);
    assert.strictEqual(resA._json.acs[0].targetSet, false, 'tenant A must see its OWN unset target, not tenant B\'s stored one');
    assert.ok(!bodyString.includes('tenant-b-secret'), 'tenant B\'s capture target URL must never appear in tenant A\'s response');
    assert.ok(!bodyString.includes('tenant-B-secret.png'), 'tenant B\'s screenshot path must never appear in tenant A\'s response');

    var reqB = makeReq('tenant-B', 'product-B', collidingSlug);
    var resB = makeRes();
    await pe.handleGetPlaybackEvidence(reqB, resB, null, null);
    assert.strictEqual(resB._json.acs[0].targetSet, true, 'tenant B must still see its own stored target');
    assert.strictEqual(resB._json.acs[0].target.url, 'http://evil.example.com/tenant-b-secret');
  });
});

queue.push(function() {
  return test('AC7: a guessed URL to another REAL tenant\'s feature returns 404 with no metadata leak', async function() {
    var store = getStore();
    var setupB = setupDodCompleteJourney(store, { tenantId: 'tenant-B', productId: 'product-B' });
    store.setCaptureTarget(setupB.journeyId, 'AC1', 'http://evil.example.com/tenant-b-secret', '#tenant-b-selector');

    // Tenant A (a different tenant entirely, owns a different product)
    // guesses tenant B's real feature slug via tenant A's own productId.
    var req = makeReq('tenant-A', 'product-A', setupB.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status, 404);
    var bodyString = JSON.stringify(res._json);
    assert.ok(!bodyString.includes(setupB.featureSlug), 'response must not echo back the guessed slug or any other metadata about tenant B\'s feature');
    assert.ok(!bodyString.includes('tenant-b-secret'), 'tenant B\'s capture target must never leak even in a 404');
    assert.deepStrictEqual(res._json, { error: 'not found' });

    // Also try tenant A guessing with tenant B's OWN productId but tenant
    // A's own session tenantId -- the mismatched (tenantId, productId) pair
    // must still 404, not partially succeed.
    var req2 = makeReq('tenant-A', setupB.productId, setupB.featureSlug);
    var res2 = makeRes();
    await pe.handleGetPlaybackEvidence(req2, res2, null, null);
    assert.strictEqual(res2._status, 404);
    var bodyString2 = JSON.stringify(res2._json);
    assert.ok(!bodyString2.includes(setupB.featureSlug), 'mismatched-pair response must not echo back the slug either');
    assert.ok(!bodyString2.includes('tenant-b-secret'), 'mismatched-pair response must not leak tenant B\'s secret either');
    assert.deepStrictEqual(res2._json, { error: 'not found' });
  });
});

queue.push(function() {
  return test('NFR-SEC: session_id value never appears in any response body produced by these routes', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var getReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var getRes = makeRes();
    await pe.handleGetPlaybackEvidence(getReq, getRes, null, null);
    assert.ok(!JSON.stringify(getRes._json).includes(getReq.sessionId));

    var targetReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: 'http://localhost:3000/x', selector: '#y', _csrf: 'test-csrf-token' }
    });
    var targetRes = makeRes();
    await pe.handlePostCaptureTarget(targetReq, targetRes, null, null);
    assert.ok(!JSON.stringify(targetRes._json).includes(targetReq.sessionId), 'handlePostCaptureTarget\'s response must not leak session_id either -- this test\'s own name claims coverage of all 3 routes, not just 2');

    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/x', '#y');
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-nfr-sec-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return {
        page: {
          goto: async function() {},
          screenshot: async function(opts) {
            var abs = path.join(tmpRoot, opts.path);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
          }
        },
        browser: { close: async function() {} }
      };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var triggerReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var triggerRes = makeRes();
    await pe.handlePostCaptureTrigger(triggerReq, triggerRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.ok(!JSON.stringify(triggerRes._json || {}).includes(triggerReq.sessionId));
  });
});

queue.push(function() {
  return test('NFR-SEC (ADR-018): capture-trigger never invokes the NODE_ENV=test auth-bypass path', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/x', '#y');

    var triggerReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-nfr-adr018-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return {
        page: {
          goto: async function() {},
          screenshot: async function(opts) {
            var abs = path.join(tmpRoot, opts.path);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
          }
        },
        browser: { close: async function() {} }
      };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    // Direct call-count spy on the actual bypass fixture (matching the test
    // plan's own measurement method), not a restatement of the AC3 test's
    // "adapter receives req.sessionId" assertion (which only proves the
    // real adapter was called with the right value, not that the bypass
    // was ALSO never touched -- a defensive/dead call to seedTestSession
    // alongside the real adapter would still pass that check).
    var sessionModule = require('../src/web-ui/middleware/session');
    var originalSeedTestSession = sessionModule.seedTestSession;
    var seedTestSessionCallCount = 0;
    sessionModule.seedTestSession = function() {
      seedTestSessionCallCount++;
      return originalSeedTestSession.apply(this, arguments);
    };

    var triggerRes = makeRes();
    try {
      await pe.handlePostCaptureTrigger(triggerReq, triggerRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    } finally {
      sessionModule.seedTestSession = originalSeedTestSession;
    }

    assert.strictEqual(seedTestSessionCallCount, 0, 'the NODE_ENV=test auth-bypass fixture must never be called during capture-trigger');
  });
});

queue.push(function() {
  return test('NFR-SEC (path traversal): a crafted acId is rejected with 400, nothing stored, no adapter calls made', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var adapterCalled = false;
    sessionPageAdapter.setSessionPageAdapter(async function() { adapterCalled = true; return { page: {}, browser: { close: async function() {} } }; });

    var maliciousAcIds = ['../../../etc/passwd', 'AC1/../../../x', '..', 'AC1;rm -rf', ''];
    for (var i = 0; i < maliciousAcIds.length; i++) {
      var crafted = maliciousAcIds[i];

      var targetReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
        params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: crafted },
        body: { url: 'http://localhost:3000/x', selector: '#y', _csrf: 'test-csrf-token' }
      });
      var targetRes = makeRes();
      await pe.handlePostCaptureTarget(targetReq, targetRes, null, null);
      assert.strictEqual(targetRes._status, 400, 'crafted acId "' + crafted + '" must be rejected by handlePostCaptureTarget');

      var triggerReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
        params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: crafted },
        body: { _csrf: 'test-csrf-token' }
      });
      var triggerRes = makeRes();
      await pe.handlePostCaptureTrigger(triggerReq, triggerRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
      assert.strictEqual(triggerRes._status, 400, 'crafted acId "' + crafted + '" must be rejected by handlePostCaptureTrigger');
    }

    assert.strictEqual(adapterCalled, false, 'no crafted acId may ever reach the capture mechanism');
    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.captureTargets || []).length, 0, 'nothing must be stored for any crafted acId');
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-playback-evidence-route.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
