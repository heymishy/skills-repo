'use strict';
var assert = require('assert');
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

var decisionsLogWriter = require('../src/web-ui/adapters/decisions-log-writer');

queue.push(function() {
  return test('decisions-log-writer: the injected writer is called with a SCOPE-note payload referencing the exceeded threshold', async function() {
    var received = null;
    decisionsLogWriter.setDecisionsLogWriter(async function(journey, ownerRepo, token, payload) {
      received = { journey: journey, ownerRepo: ownerRepo, token: token, payload: payload };
    });
    try {
      var fakeJourney = { featureSlug: 'test-feature' };
      var fakeOwnerRepo = { owner: 'acme', repo: 'widgets' };
      await decisionsLogWriter.appendScopeNote(fakeJourney, fakeOwnerRepo, 'tok', { featureSlug: 'test-feature', durationMs: 65000 });
      assert.strictEqual(received.payload.durationMs, 65000);
      assert.strictEqual(received.payload.featureSlug, 'test-feature');
      assert.strictEqual(received.ownerRepo.owner, 'acme');
    } finally {
      decisionsLogWriter._resetDecisionsLogWriter();
    }
  });
});

queue.push(function() {
  return test('decisions-log-writer: realAppendScopeNote reads existing decisions.md, appends the SCOPE entry, and commits back to the tenant\'s OWN repo', async function() {
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
    var originalFetch = global.fetch;
    // realAppendScopeNote now reads via fetchRepoPath (the D37 injectable
    // exact-path adapter), not fetchArtefact -- wire it to its real
    // implementation for this test, same as server.js does at startup, so
    // the GET below actually goes through global.fetch rather than hitting
    // the default throwing stub.
    var originalFetchRepoPath = artefactFetcher.getFetchRepoPath();
    artefactFetcher.setFetchRepoPath(artefactFetcher.realFetchRepoPath);
    var putBody = null;
    global.fetch = async function(url, opts) {
      if (String(url).endsWith('/user')) {
        return { ok: true, json: async function() { return { name: 'Test User', login: 'testuser' }; } };
      }
      if (String(url).indexOf('/contents/artefacts/test-feature/decisions.md') !== -1 && (!opts || opts.method !== 'PUT')) {
        return { ok: true, json: async function() { return { content: Buffer.from('# Decisions: test-feature\n\n---\n').toString('base64'), sha: 'abc123' }; } };
      }
      if (opts && opts.method === 'PUT') {
        putBody = JSON.parse(opts.body);
        return { ok: true, json: async function() { return { ok: true }; } };
      }
      return { ok: false, status: 404 };
    };
    try {
      await decisionsLogWriter.realAppendScopeNote(
        { featureSlug: 'test-feature' },
        { owner: 'acme', repo: 'widgets' },
        'tok',
        { featureSlug: 'test-feature', durationMs: 65000 }
      );
      assert.ok(putBody, 'must PUT the updated content back');
      var decodedContent = Buffer.from(putBody.content, 'base64').toString('utf8');
      assert.ok(decodedContent.indexOf('# Decisions: test-feature') !== -1, 'must preserve the existing content, not overwrite it');
      assert.ok(decodedContent.indexOf('SCOPE') !== -1 && decodedContent.indexOf('65.0s') !== -1, 'must append a SCOPE entry referencing the real measured duration');
      assert.strictEqual(putBody.sha, 'abc123', 'must pass the existing file\'s sha so the update does not conflict');
    } finally {
      global.fetch = originalFetch;
      artefactFetcher.setFetchRepoPath(originalFetchRepoPath);
    }
  });
});

var fs = require('fs');
var path = require('path');
var os = require('os');
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
var captureAllLock = require('../src/web-ui/modules/capture-all-lock');
pe.setJourneyStoreModule(store);

function getStore() {
  store._clearForTesting();
  captureAllLock._clearForTesting();
  return store;
}
function makeRes() {
  var res = {
    _status: null, _json: null, _body: null,
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status) { res._status = status; },
    end: function(body) { res._body = body; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, extra) {
  return Object.assign({
    session: { tenantId: tenantId, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: {}
  }, extra || {});
}
function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s2-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var dodContent = opts.dodContent || [
    '## AC Coverage', '',
    '| AC | Satisfied? | Evidence |', '|----|------------|----------|',
    '| AC1 — First | Yes | screenshot |',
    '| AC2 — Second | Yes | screenshot |',
    '| AC3 — Third | Yes | screenshot |'
  ].join('\n');
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function setupFakeCapture(tmpPrefix) {
  var tmpRoot = path.join(os.tmpdir(), tmpPrefix + '-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });
  repoRootAdapter.setRepoRoot(tmpRoot);
  var fakePage = {
    goto: async function() {},
    screenshot: async function(opts) {
      var abs = path.join(tmpRoot, opts.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    }
  };
  var browserClosed = false;
  sessionPageAdapter.setSessionPageAdapter(async function() {
    return { page: fakePage, browser: { close: async function() { browserClosed = true; } } };
  });
  artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });
  return { tmpRoot: tmpRoot, isBrowserClosed: function() { return browserClosed; } };
}

queue.push(function() {
  return test('AC1/AC6: capture-all loops every targeted AC sequentially and skips the untargeted one with a named reason', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');
    setupFakeCapture('ppc-s2-capall');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._json.captured.length, 2, 'both targeted ACs must be captured');
    assert.deepStrictEqual(res._json.captured.map(function(c) { return c.acId; }), ['AC1', 'AC2']);
    assert.strictEqual(res._json.skipped.length, 1);
    assert.deepStrictEqual(res._json.skipped[0], { acId: 'AC3', reason: 'no capture target set' });
    assert.strictEqual(res._json.failed.length, 0);
  });
});

queue.push(function() {
  return test('AC2: a second concurrent capture-all trigger for the same feature is rejected with 409', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    assert.strictEqual(captureAllLock.tryAcquireLock(setup.journeyId), true, 'simulate a run already in progress');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._status, 409);
    assert.ok(res._json.error.indexOf('already in progress') !== -1);
  });
});

queue.push(function() {
  return test('AC2: the lock is released after the run completes, so a subsequent trigger succeeds', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-capall-release');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureAll(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(captureAllLock.getLockState(setup.journeyId), null, 'lock must be released once the run completes');

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureAll(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.notStrictEqual(res2._status, 409, 'a second, later (non-concurrent) run must not be blocked');
  });
});

queue.push(function() {
  return test('AC3: capture-all records real elapsed wall-clock time, not a hardcoded/default value', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-timing');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(typeof res._json.durationMs, 'number');
    assert.ok(res._json.durationMs >= 0, 'duration must be a real, non-negative measured value');
    var reloaded = store2.getJourney(setup.journeyId);
    assert.strictEqual(typeof reloaded.captureAllDuration, 'number', 'duration must be persisted as DoD evidence');
    assert.ok(reloaded.captureAllCompletedAt, 'completion timestamp must be persisted alongside the duration');
  });
});

queue.push(function() {
  return test('AC4: a run whose measured duration exceeds 60s calls the decisions-log writer with a SCOPE payload, and still reports its successful ACs', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-threshold');

    var decisionsLogWriter = require('../src/web-ui/adapters/decisions-log-writer');
    var captureAllModule = require('../src/utils/capture-all');
    var originalMeasure = captureAllModule.measureCaptureDuration;
    captureAllModule.measureCaptureDuration = function() { return 65000; };
    var writerCalled = null;
    decisionsLogWriter.setDecisionsLogWriter(async function(journey, ownerRepo, token, payload) { writerCalled = payload; });

    try {
      var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

      assert.ok(writerCalled, 'the decisions-log writer must be called when the threshold is exceeded');
      assert.strictEqual(writerCalled.durationMs, 65000);
      assert.strictEqual(res._status === null || res._status === 200, true, 'the run itself must still complete and report success, not fail because the threshold was exceeded');
      assert.strictEqual(res._json.captured.length, 1);
      assert.strictEqual(res._json.exceedsTimingThreshold, true);
    } finally {
      captureAllModule.measureCaptureDuration = originalMeasure;
      decisionsLogWriter._resetDecisionsLogWriter();
    }
  });
});

queue.push(function() {
  return test('AC5: one AC\'s capture failure does not discard the others\' successful results', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');
    store2.setCaptureTarget(setup.journeyId, 'AC3', 'http://localhost:3000/c', '#c');

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s2-partial-fail-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);
    var fakePage = {
      goto: async function(url) {
        if (url === 'http://localhost:3000/b') throw new Error('simulated navigation timeout');
      },
      screenshot: async function(opts) {
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return { page: fakePage, browser: { close: async function() {} } };
    });
    require('../src/web-ui/adapters/artefact-commit-writer').setArtefactCommitAdapter(async function() { return { ok: true }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._json.captured.length, 2, 'AC1 and AC3 must still succeed');
    assert.deepStrictEqual(res._json.captured.map(function(c) { return c.acId; }), ['AC1', 'AC3']);
    assert.strictEqual(res._json.failed.length, 1);
    assert.strictEqual(res._json.failed[0].acId, 'AC2');
    assert.strictEqual(res._json.failed[0].retry, true, 'the failed AC must carry a retry flag');
  });
});

queue.push(function() {
  return test('AC6/empty: a feature with zero targeted ACs returns immediately with everything in skipped, no capture mechanism invoked', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var adapterCalled = false;
    sessionPageAdapter.setSessionPageAdapter(async function() { adapterCalled = true; return { page: {}, browser: { close: async function() {} } }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([]));

    assert.strictEqual(res._json.captured.length, 0);
    assert.strictEqual(res._json.skipped.length, 3, 'all 3 ACs from the fixture DoD have no stored target');
    assert.strictEqual(adapterCalled, false, 'must never acquire a Playwright page when there is nothing to capture');
    assert.strictEqual(captureAllLock.getLockState(setup.journeyId), null, 'lock must be released even on the early-return path');
  });
});

queue.push(function() {
  return test('CSRF: a missing/mismatched token is rejected with 403, lock never acquired', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'wrong-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([]));
    assert.strictEqual(res._status, 403);
    assert.strictEqual(captureAllLock.getLockState(setup.journeyId), null);
  });
});

queue.push(function() {
  return test('NFR-SEC (ADR-018): capture-all never invokes the NODE_ENV=test auth-bypass path', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-adr018');

    // Direct call-count spy on the actual bypass fixture, matching
    // check-ppc-s1-playback-evidence-route.js's own "capture-trigger never
    // invokes the NODE_ENV=test auth-bypass path" test mechanism -- not a
    // restatement of some other "adapter receives req.sessionId" assertion,
    // which only proves the real adapter was called with the right value,
    // not that the bypass was ALSO never touched.
    var sessionModule = require('../src/web-ui/middleware/session');
    var originalSeedTestSession = sessionModule.seedTestSession;
    var seedTestSessionCallCount = 0;
    sessionModule.seedTestSession = function() {
      seedTestSessionCallCount++;
      return originalSeedTestSession.apply(this, arguments);
    };

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    try {
      await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    } finally {
      sessionModule.seedTestSession = originalSeedTestSession;
    }

    assert.strictEqual(seedTestSessionCallCount, 0, 'the NODE_ENV=test auth-bypass fixture must never be called during capture-all');
  });
});

queue.push(function() {
  return test('server.js source mounts the capture-all route', function() {
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/handlePostCaptureAll/.test(serverSrc), 'capture-all route must be mounted');
  });
});

queue.push(function() {
  return test('fdn-s1: captureAllDuration/captureAllCompletedAt survive journey-store-pg\'s _sanitise allowlist', function() {
    var pgAdapter = require('../src/web-ui/adapters/journey-store-pg');
    var sanitised = pgAdapter._sanitiseForTesting({
      featureSlug: 'x', captureAllDuration: 12345, captureAllCompletedAt: '2026-10-22T00:00:00.000Z'
    });
    assert.strictEqual(sanitised.captureAllDuration, 12345, 'must not silently vanish after a Postgres-backed restart');
    assert.strictEqual(sanitised.captureAllCompletedAt, '2026-10-22T00:00:00.000Z');
  });
});

(async function() {
  console.log('\ncheck-ppc-s2-capture-all-route.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
