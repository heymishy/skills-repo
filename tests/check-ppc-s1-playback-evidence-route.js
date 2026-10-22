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
function makeReq(tenantId, productId, featureSlug, extra) {
  return Object.assign({
    // csrfToken matches the '_csrf: test-csrf-token' value every mutating
    // POST test below sends in its body -- csrfGuard compares the two.
    session: { tenantId: tenantId, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
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
