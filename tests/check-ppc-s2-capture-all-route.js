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
// ppc-s9 Task 8: session-page-adapter.js is retired as of Task 7 --
// handlePostCaptureAll now dispatches via captureDispatchAdapter + a nonce
// (Task 5) instead of looping Playwright captures in-process. See each
// migrated test's own comment below for exactly which OLD assertion moved
// to check-ppc-s9-capture-dispatch-wiring.js / check-ppc-s9-capture-worker-script.js,
// which was rewritten in place, and which (AC3 real-duration-measurement,
// AC4 decisions-log-threshold) describes a synchronous-measurement
// capability Task 5's own scope note already removed from this handler
// entirely -- flagged explicitly in those tests' own comments and in this
// task's final report, not silently dropped.
var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');
var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
var captureAllLock = require('../src/web-ui/modules/capture-all-lock');
pe.setJourneyStoreModule(store);

function installFakeNonceStore() {
  var records = {};
  nonceStore.setNonceStoreAdapter({
    set: async function(key, value) { records[key] = value; },
    get: async function(key) { return records[key] === undefined ? null : records[key]; },
    del: async function(key) { delete records[key]; }
  });
  return records;
}

function getStore() {
  store._clearForTesting();
  captureAllLock._clearForTesting();
  return store;
}
function makeRes() {
  // _headers/writeHead(status, headers) extended to match
  // check-ppc-s1-ui-layer.js's own makeRes shape (Finding 2, code-quality
  // review of 689ac9f5) -- this file's makeRes previously dropped the
  // headers argument entirely, so a 302 redirect's Location header was
  // unobservable from a test. Existing tests only ever use res.json()/
  // res.status()/res._json, never _headers, so this is additive.
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = body; },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  // userId is unique per call (ppc-s3): this file's own capture-all tests
  // never intend to exercise rate-limiting themselves -- that is
  // ppc-s3's own test file's job -- so every call must get its own
  // independent rate-limit bucket, not share one via a fixed/derived value
  // (mirrors check-ppc-s1-playback-evidence-route.js's own makeReq fix for
  // the same root cause).
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s2-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
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
// ppc-s9 Task 8 migration: used to seed a fake Playwright page/browser via
// session-page-adapter.js so handlePostCaptureAll's old in-process capture
// loop had something to drive. That loop is gone (Task 5) -- this now just
// wires the dispatch-adapter + nonce-store mocks so the handler's dispatch
// call succeeds without throwing. The real capture mechanics it used to
// drive (navigate/screenshot/video) are covered by
// check-ppc-s9-capture-worker-script.js now; the eventual
// commit/persist-on-the-journey mechanics are covered by
// check-ppc-s9-capture-dispatch-wiring.js's own finalise tests.
function setupFakeCapture(tmpPrefix) {
  var tmpRoot = path.join(os.tmpdir(), tmpPrefix + '-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });
  repoRootAdapter.setRepoRoot(tmpRoot);
  installFakeNonceStore();
  captureDispatchAdapter.setCaptureDispatchAdapter({
    dispatchCaptureWorkflow: async function() {},
    checkCaptureArtifact: async function() { return { found: false }; },
    downloadCaptureArtifact: async function() { return {}; }
  });
  artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });
  return { tmpRoot: tmpRoot };
}

queue.push(function() {
  // ppc-s9 Task 8 migration note: "loops every targeted AC sequentially" no
  // longer describes THIS handler -- it dispatches ONE workflow call
  // covering the whole group and returns immediately (Task 5). The
  // sequential-per-AC navigation this test used to prove now happens inside
  // the GitHub Actions worker, covered by
  // check-ppc-s9-capture-worker-script.js's own
  // captureWorkerScript_multipleAcIds_navigatesEachInSequenceInOneContext
  // test. What's unchanged and still this handler's own responsibility:
  // buildCaptureAllList's skip-detection (AC6) runs before any dispatch, so
  // that assertion is kept as-is; the old captured/failed response fields
  // (which this handler no longer returns on the dispatch path) are
  // replaced with the new dispatched/acIds response shape.
  return test('AC1/AC6 (migrated): capture-all dispatches ONE workflow call covering every targeted AC, and skips the untargeted one with a named reason', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');
    setupFakeCapture('ppc-s2-capall');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._json.dispatched, true, 'both targeted ACs must be dispatched together');
    assert.deepStrictEqual(res._json.acIds.slice().sort(), ['AC1', 'AC2']);
    assert.strictEqual(res._json.skipped.length, 1);
    assert.deepStrictEqual(res._json.skipped[0], { acId: 'AC3', reason: 'no capture target set' });

    var reloaded = store2.getJourney(setup.journeyId);
    assert.ok(reloaded.captureInProgress.AC1 && reloaded.captureInProgress.AC2, 'both targeted ACs must be marked in-progress');
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
  // ppc-s9 Task 8 flag for the orchestrator (NOT a mechanical mock-swap --
  // a genuine capability removal from an EARLIER task, Task 5, being made
  // visible here for the first time): handlePostCaptureAll used to measure
  // real synchronous wall-clock duration because it was the ONE process
  // actually running the capture loop. Task 5's own source comment
  // (src/web-ui/routes/playback-evidence.js, directly above this handler's
  // response) states explicitly that durationMs/exceedsTimingThreshold are
  // "now always 0/false rather than computed from a real synchronous
  // measurement" and that a real async-duration metric is "out of this
  // task's scope". There is no equivalent real-duration measurement
  // anywhere in the new dispatch-based flow (not in this handler, not in
  // the worker script, not in the finalise step) -- the capability is
  // simply gone, not relocated. This test is rewritten to assert the NEW
  // documented contract (always 0, nothing persisted) so a future
  // regression of THAT contract is still caught, but the original AC3
  // ("records real elapsed wall-clock time") is no longer true and could
  // not be mechanically preserved. Flagged explicitly in this task's final
  // report.
  return test('AC3 (capability removed by ppc-s9 Task 5, not Task 8 -- see comment above): capture-all no longer measures real duration; durationMs is always 0 and nothing is persisted', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-timing');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._json.durationMs, 0, 'durationMs is now always 0 -- no real synchronous measurement exists any more (Task 5\'s own documented scope cut)');
    var reloaded = store2.getJourney(setup.journeyId);
    assert.strictEqual(reloaded.captureAllDuration, undefined, 'nothing is persisted for captureAllDuration any more -- this handler no longer measures it');
    assert.strictEqual(reloaded.captureAllCompletedAt, undefined);
  });
});

queue.push(function() {
  // ppc-s9 Task 8 flag for the orchestrator (same capability removal as the
  // AC3 test immediately above, not a Task 8 mock-migration issue):
  // measureCaptureDuration/checkTimingThreshold/decisionsLogWriter.appendScopeNote
  // were all removed from handlePostCaptureAll by Task 5 -- there is no
  // synchronous duration for this handler to check against a 60s threshold
  // any more, so the decisions-log writer is never called from this path.
  // Rewritten to assert the NEW contract (writer never called, threshold
  // flag always false) rather than silently deleting this test.
  return test('AC4 (capability removed by ppc-s9 Task 5, not Task 8 -- see comment above): capture-all never calls the decisions-log writer or reports exceedsTimingThreshold any more', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-threshold');

    var decisionsLogWriter = require('../src/web-ui/adapters/decisions-log-writer');
    var writerCalled = null;
    decisionsLogWriter.setDecisionsLogWriter(async function(journey, ownerRepo, token, payload) { writerCalled = payload; });

    try {
      var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
      var res = makeRes();
      await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

      assert.strictEqual(writerCalled, null, 'the decisions-log writer must never be called -- there is no synchronous duration left to check against a threshold');
      assert.strictEqual(res._status === null || res._status === 200, true, 'the run itself must still complete and report success');
      assert.strictEqual(res._json.dispatched, true);
      assert.strictEqual(res._json.exceedsTimingThreshold, false, 'always false now -- no real measurement exists to compare against the threshold');
    } finally {
      decisionsLogWriter._resetDecisionsLogWriter();
    }
  });
});

queue.push(function() {
  // ppc-s9 Task 8 migration note: this handler no longer navigates/captures
  // per-AC at all -- there is no longer a point in THIS handler where one
  // AC's own navigation can throw while its siblings succeed (Task 5: one
  // dispatch call covers the whole group, and it either succeeds or fails
  // as a whole -- the whole-group dispatch-failure case is already covered
  // by this file's own "AC2: handlePostCaptureAll releases the capture-all
  // lock even on a dispatch failure" equivalent in
  // check-ppc-s9-capture-dispatch-wiring.js). The REAL per-AC partial-failure
  // concept this test used to prove ("one AC's failure doesn't discard the
  // others' results") now lives entirely in handleGetPlaybackEvidence's own
  // finalise step, once the dispatched workflow's artifact comes back with
  // one AC's screenshot missing -- already covered by
  // check-ppc-s9-capture-dispatch-wiring.js's own "a found group with ONE AC
  // permanently missing from result.screenshots stays in-progress" and
  // "...is bounded by CAPTURE_WAIT_WINDOW_MS" tests (AC1 finalises normally,
  // AC2 does not, in the SAME group). What's left as this handler's own
  // responsibility: proving the dispatch itself is a SINGLE call covering
  // every targeted AC, never split per-AC (so a per-AC failure couldn't even
  // be introduced at this layer).
  return test('AC5 (migrated -- partial-failure coverage moved to check-ppc-s9-capture-dispatch-wiring.js\'s own finalise tests): capture-all dispatches all 3 targeted ACs in ONE call, never split per-AC', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');
    store2.setCaptureTarget(setup.journeyId, 'AC3', 'http://localhost:3000/c', '#c');

    installFakeNonceStore();
    var dispatchCallCount = 0;
    var capturedAcIds = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatchCallCount++; capturedAcIds = args.acIds; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(dispatchCallCount, 1, 'exactly one dispatch call for all 3 ACs -- there is no per-AC loop left in this handler for one AC to fail independently of the others');
    assert.deepStrictEqual(capturedAcIds.slice().sort(), ['AC1', 'AC2', 'AC3']);
    var reloaded = store2.getJourney(setup.journeyId);
    assert.ok(reloaded.captureInProgress.AC1 && reloaded.captureInProgress.AC2 && reloaded.captureInProgress.AC3, 'all 3 ACs must be marked in-progress together');
  });
});

queue.push(function() {
  return test('AC6/empty: a feature with zero targeted ACs returns immediately with everything in skipped, no capture mechanism invoked', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var adapterCalled = false;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { adapterCalled = true; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

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

queue.push(function() {
  return test('Finding 2 (code-quality review of 689ac9f5): a form-encoded POST to capture-all redirects (302) back to the GET page, matching check-ppc-s1-ui-layer.js\'s own redirect-on-form-submission precedent', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s2-redirect');

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._status, 302, 'a form submission must redirect back to the page, not return raw JSON');
    assert.ok(res._headers.Location && res._headers.Location.indexOf(setup.featureSlug) !== -1, 'must redirect back to this feature\'s own playback-evidence page');
  });
});

queue.push(function() {
  return test('Finding 1 (code-quality review of 689ac9f5): a form-encoded POST with zero targeted ACs also redirects (302), not raw JSON -- the reachable "Capture all evidence" button bug the fix addresses', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    // Deliberately no setCaptureTarget calls -- all 3 fixture ACs are untargeted,
    // so buildCaptureAllList's toCapture list is empty and the early-return
    // branch is the one under test.

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 302, 'the empty-list branch must also redirect for a form submission, not dump raw JSON into the browser');
    assert.ok(res._headers.Location && res._headers.Location.indexOf(setup.featureSlug) !== -1);
  });
});

queue.push(function() {
  // ppc-s9 Task 8 migration note: the OLD per-AC navigation failure (one
  // AC's page.goto throws while its sibling succeeds, both inside this
  // handler's own synchronous loop) no longer exists -- Task 5 removed that
  // loop entirely. The equivalent failure mode under the dispatch-based flow
  // is a downloaded capture-worker archive missing one AC's own screenshot
  // once CAPTURE_WAIT_WINDOW_MS elapses (handleGetPlaybackEvidence's own
  // finalise step, Task 6) -- already exercised at the JSON/state level by
  // check-ppc-s9-capture-dispatch-wiring.js's own "bounded by
  // CAPTURE_WAIT_WINDOW_MS, not retried forever" test. This test is rewritten
  // to drive that SAME finalise path directly (rather than via
  // handlePostCaptureAll, which no longer has anything to do with per-AC
  // failure) and keeps its own distinguishing value: the HTML-rendering
  // assertions (role="alert" markup, "Capture failed" text, exactly one
  // notice for the one failed AC) that the wiring file's own test does not
  // check. The error message is now always the fixed "capture workflow did
  // not complete within the expected window" string (never
  // attacker-controlled dynamic content, unlike the old thrown-Error
  // message), so the original crafted-HTML-escaping scenario no longer
  // applies as a distinct case -- _escapeHtml is still applied in the render
  // function regardless (see src/web-ui/routes/playback-evidence.js).
  return test('captureAllFailed (migrated): a per-AC screenshot that never arrives persists a failure record that handleGetPlaybackEvidence renders as a role="alert" notice, the finalised sibling AC unaffected', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');

    // 6 minutes ago -- past CAPTURE_WAIT_WINDOW_MS, same convention
    // check-ppc-s9-capture-dispatch-wiring.js's own timeout tests use.
    var dispatchedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    store2.setJourneyFields(setup.journeyId, {
      captureInProgress: {
        AC1: { correlationId: 'corr-ppc-s2-render-1', dispatchedAt: dispatchedAt },
        AC2: { correlationId: 'corr-ppc-s2-render-1', dispatchedAt: dispatchedAt }
      }
    });

    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function() { return { found: true, archiveDownloadUrl: 'https://example.invalid/archive.zip' }; },
      // AC2's own screenshot never made it into the archive.
      downloadCaptureArtifact: async function() { return { screenshots: { AC1: Buffer.from('fake-png-bytes-AC1-render') }, videoBuffer: null }; }
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var htmlReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var htmlRes = makeRes();
    await pe.handleGetPlaybackEvidence(htmlReq, htmlRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    var html = htmlRes._body;

    assert.ok(html.indexOf('role="alert"') !== -1, 'the failed AC must render a role="alert" notice');
    assert.ok(html.indexOf('Capture failed') !== -1, 'the failure notice must contain the exact "Capture failed" text');
    assert.ok(html.indexOf('capture workflow did not complete within the expected window') !== -1, 'the exact EXISTING captureAllFailed message must render');
    // Only AC2 failed -- exactly one notice must render, proving AC1's
    // (successfully finalised) row does not also carry a failure notice.
    var alertCount = (html.match(/role="alert"/g) || []).length;
    assert.strictEqual(alertCount, 1, 'only the one failed AC (AC2) must show a failure notice -- the finalised AC (AC1) must show none');

    var reloaded = store2.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC1, 'AC1 must still be finalised normally');
    assert.deepStrictEqual(reloaded.captureAllFailed.AC2, { error: 'capture workflow did not complete within the expected window', retry: true });
  });
});

queue.push(function() {
  // ppc-s9 Task 8 migration note: "a successful retry" used to mean
  // handlePostCaptureAll's own in-process loop running a second time and
  // succeeding. Under the dispatch-based flow, a retry is a fresh dispatch
  // (new captureInProgress entry, new correlationId) whose LATER finalise
  // check finds the screenshot that was missing the first time -- driven
  // directly here via the same finalise path as the test immediately above,
  // for the same reason (handlePostCaptureAll itself has nothing left to do
  // with per-AC success/failure).
  return test('captureAllFailed (migrated): a retry whose finalise check later finds the screenshot clears the stale failure entry, so the notice disappears on the next render', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    store2.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#b');

    var dispatchedAt1 = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    store2.setJourneyFields(setup.journeyId, {
      captureInProgress: {
        AC1: { correlationId: 'corr-ppc-s2-retry-1', dispatchedAt: dispatchedAt1 },
        AC2: { correlationId: 'corr-ppc-s2-retry-1', dispatchedAt: dispatchedAt1 }
      }
    });
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function() { return { found: true, archiveDownloadUrl: 'https://example.invalid/archive-1.zip' }; },
      downloadCaptureArtifact: async function() { return { screenshots: { AC1: Buffer.from('ac1-bytes') }, videoBuffer: null }; }
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var htmlReqBefore = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var htmlResBefore = makeRes();
    await pe.handleGetPlaybackEvidence(htmlReqBefore, htmlResBefore, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.ok(htmlResBefore._body.indexOf('role="alert"') !== -1, 'AC2 must show a failure notice after the first (timed-out) run');

    // Retry: AC2 is re-dispatched (a fresh captureInProgress entry, as the
    // real handlePostCaptureTrigger/handlePostCaptureAll would write), and
    // this time the finalise check finds its screenshot.
    var dispatchedAt2 = new Date().toISOString();
    store2.setJourneyFields(setup.journeyId, {
      captureInProgress: { AC2: { correlationId: 'corr-ppc-s2-retry-2', dispatchedAt: dispatchedAt2 } }
    });
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function(correlationId) {
        assert.strictEqual(correlationId, 'corr-ppc-s2-retry-2');
        return { found: true, archiveDownloadUrl: 'https://example.invalid/archive-2.zip' };
      },
      downloadCaptureArtifact: async function() { return { screenshots: { AC2: Buffer.from('ac2-bytes-retry') }, videoBuffer: null }; }
    });

    var htmlReqAfter = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var htmlResAfter = makeRes();
    await pe.handleGetPlaybackEvidence(htmlReqAfter, htmlResAfter, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.ok(htmlResAfter._body.indexOf('role="alert"') === -1, 'the stale failure notice must be cleared once the retry succeeds');
    var reloaded = store2.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC2, 'AC2 must now be finalised');
    assert.strictEqual(reloaded.captureAllFailed.AC2, undefined, 'the stale captureAllFailed entry for AC2 must be cleared');
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
