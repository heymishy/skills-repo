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

// ppc-s9 Task 5: wires handlePostCaptureTrigger/handlePostCaptureAll to
// dispatchCaptureWorkflow (capture-dispatch-adapter.js, Task 3) + issueNonce
// (capture-nonce-store.js, Task 1) instead of launching Chromium in-process
// via session-page-adapter.js. This file covers ONLY the new dispatch-
// specific behaviour this task introduces (AC1, AC6) -- the existing CSRF/
// rate-limit/target/DoD/repo rejection-path tests already living in
// check-ppc-s1-playback-evidence-route.js and check-ppc-s2-capture-all-route.js
// are migrated (not duplicated here) by Task 8, which is a later task, not
// this one.

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');
var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');
var captureAllLock = require('../src/web-ui/modules/capture-all-lock');
// ppc-s9 Task 6: commitArtefact (artefact-commit-writer.js) is already a
// proper D37 injectable adapter (setArtefactCommitAdapter/
// getArtefactCommitAdapter, throw-on-unwired default) -- same mocking
// convention check-das-s1-commit-artefact-git-fallback.js and
// check-acdg-s1-commit-guard.js already use. No change needed to that
// adapter file itself; this is just the test-side mock installation.
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
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

var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s9-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}

function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s9-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
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

// A fake, in-memory nonce store -- not the real Upstash-backed adapter --
// mirroring capture-nonce-store.js's own {set, get, del} adapter contract
// (see check-ppc-s9-capture-nonce-store.js for the equivalent pattern).
function installFakeNonceStore() {
  var records = {};
  nonceStore.setNonceStoreAdapter({
    set: async function(key, value) { records[key] = value; },
    get: async function(key) { return records[key] === undefined ? null : records[key]; },
    del: async function(key) { delete records[key]; }
  });
  return records;
}

queue.push(function() {
  return test('AC1: handlePostCaptureTrigger dispatches with a nonce, and the real req.sessionId value never appears anywhere in the dispatch adapter\'s own captured call args', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    installFakeNonceStore();

    var capturedDispatchArgs = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { capturedDispatchArgs = args; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.ok(capturedDispatchArgs, 'dispatchCaptureWorkflow must have been called');
    assert.ok(capturedDispatchArgs.nonce, 'the dispatch args must carry a nonce');
    assert.strictEqual(typeof capturedDispatchArgs.nonce, 'string');
    assert.notStrictEqual(capturedDispatchArgs.nonce, req.sessionId, 'the nonce must never be the raw session id itself');

    var serializedArgs = JSON.stringify(capturedDispatchArgs);
    assert.ok(serializedArgs.indexOf(req.sessionId) === -1, 'the real session id must NEVER appear anywhere in the dispatch adapter\'s own captured call args');

    assert.deepStrictEqual(capturedDispatchArgs.acIds, ['AC1']);
    assert.deepStrictEqual(capturedDispatchArgs.targets, [{ acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' }]);
    assert.strictEqual(capturedDispatchArgs.featureSlug, setup.featureSlug);
    assert.ok(capturedDispatchArgs.correlationId, 'a correlationId must be generated');

    assert.strictEqual(res._json.ok, true);
    assert.strictEqual(res._json.correlationId, capturedDispatchArgs.correlationId);

    var reloaded = store.getJourney(setup.journeyId);
    assert.ok(reloaded.captureInProgress, 'captureInProgress must be persisted on the journey');
    assert.strictEqual(reloaded.captureInProgress.AC1.correlationId, capturedDispatchArgs.correlationId);
    assert.ok(reloaded.captureInProgress.AC1.dispatchedAt, 'dispatchedAt must be recorded');
  });
});

queue.push(function() {
  return test('AC1: handlePostCaptureTrigger returns immediately (never waits for the dispatched workflow to finish)', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');
    installFakeNonceStore();

    var dispatchResolved = false;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() {
        // The dispatch call itself resolving does NOT mean the workflow run
        // finished -- it only means GitHub accepted the workflow_dispatch
        // request. Nothing in handlePostCaptureTrigger should block on the
        // ACTUAL capture run completing (that is Task 6's own polling job).
        dispatchResolved = true;
      },
      checkCaptureArtifact: async function() { throw new Error('must not be called by the trigger handler'); },
      downloadCaptureArtifact: async function() { throw new Error('must not be called by the trigger handler'); }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(dispatchResolved, true);
    assert.strictEqual(res._json.ok, true);
    assert.strictEqual(res._status === null || res._status === 200, true);
  });
});

queue.push(function() {
  return test('AC6: handlePostCaptureAll dispatches exactly ONE dispatchCaptureWorkflow call covering every AC in the group', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#w1');
    store.setCaptureTarget(setup.journeyId, 'AC2', 'http://localhost:3000/b', '#w2');
    installFakeNonceStore();

    var dispatchCallCount = 0;
    var capturedDispatchArgs = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatchCallCount++; capturedDispatchArgs = args; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(dispatchCallCount, 1, 'exactly one dispatchCaptureWorkflow call must cover the whole group -- never one dispatch per AC');
    assert.deepStrictEqual(capturedDispatchArgs.acIds.slice().sort(), ['AC1', 'AC2']);
    assert.strictEqual(capturedDispatchArgs.targets.length, 2);

    assert.strictEqual(res._json.dispatched, true);
    assert.strictEqual(res._json.correlationId, capturedDispatchArgs.correlationId);

    var reloaded = store.getJourney(setup.journeyId);
    assert.ok(reloaded.captureInProgress.AC1, 'AC1 must have a captureInProgress entry');
    assert.ok(reloaded.captureInProgress.AC2, 'AC2 must have a captureInProgress entry');
    assert.strictEqual(reloaded.captureInProgress.AC1.correlationId, reloaded.captureInProgress.AC2.correlationId, 'every AC in the group must share the SAME correlationId -- mirrors ppc-s5\'s own "same video path for every AC in the group" convention');
    assert.strictEqual(reloaded.captureInProgress.AC1.correlationId, capturedDispatchArgs.correlationId);
  });
});

queue.push(function() {
  return test('AC6: handlePostCaptureAll releases the capture-all lock even on a dispatch failure', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#w1');
    installFakeNonceStore();

    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('simulated GitHub API failure'); },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._status, 502);
    assert.strictEqual(res._json.error, 'capture-dispatch-failed');

    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual(reloaded.captureInProgress, undefined, 'nothing must be marked in-progress when the dispatch itself failed');
    assert.strictEqual(captureAllLock.getLockState(setup.journeyId), null, 'the capture-all lock must be released even after a dispatch failure, so a retry is not permanently blocked');
  });
});

queue.push(function() {
  return test('AC1: handlePostCaptureTrigger returns 502 (never a bare 500) when dispatch itself fails, and nothing is marked in-progress', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');
    installFakeNonceStore();

    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('simulated GitHub API failure'); },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._status, 502);
    assert.strictEqual(res._json.error, 'capture-dispatch-failed');
    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual(reloaded.captureInProgress, undefined);
  });
});

// ppc-s9 Task 6: handleGetPlaybackEvidence's own artifact-check + finalise
// logic (AC4, AC5) -- found/not-found-recent/not-found-timed-out/grouping.

queue.push(function() {
  return test('AC4/AC5: handleGetPlaybackEvidence, artifact found -- commits screenshot+video via the exact real tenant token/owner/repo/base64 shape, updates journey fields, clears captureInProgress, renders the normal completed state', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');
    store.setJourneyFields(setup.journeyId, {
      captureInProgress: { AC1: { correlationId: 'corr-found-1', dispatchedAt: new Date().toISOString() } }
    });

    var screenshotBuffer = Buffer.from('fake-png-bytes');
    var videoBuffer = Buffer.from('fake-webm-bytes');
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function(correlationId) {
        assert.strictEqual(correlationId, 'corr-found-1');
        return { found: true, archiveDownloadUrl: 'https://example.invalid/archive.zip' };
      },
      downloadCaptureArtifact: async function(url) {
        assert.strictEqual(url, 'https://example.invalid/archive.zip');
        return { screenshotBuffer: screenshotBuffer, videoBuffer: videoBuffer };
      }
    });

    var commitCalls = [];
    artefactCommitWriter.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      commitCalls.push({ artefactPath: artefactPath, content: content, token: token, owner: owner, repo: repo, encoding: encoding });
      return { ok: true };
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(commitCalls.length, 2, 'one commitArtefact call for the screenshot, one for the video');
    var screenshotCall = commitCalls.find(function(c) { return c.artefactPath.indexOf('screenshots/') !== -1; });
    var videoCall = commitCalls.find(function(c) { return c.artefactPath.indexOf('/video/') !== -1; });
    assert.ok(screenshotCall, 'a screenshot commitArtefact call must have happened');
    assert.ok(videoCall, 'a video commitArtefact call must have happened');

    assert.strictEqual(screenshotCall.artefactPath, 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png');
    assert.strictEqual(screenshotCall.content, screenshotBuffer.toString('base64'));
    assert.strictEqual(screenshotCall.token, 'test-token', 'must use req.session.accessToken, the real tenant token');
    assert.strictEqual(screenshotCall.owner, 'acme');
    assert.strictEqual(screenshotCall.repo, 'widgets');
    assert.strictEqual(screenshotCall.encoding, 'base64');

    assert.strictEqual(videoCall.artefactPath, 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1.webm');
    assert.strictEqual(videoCall.content, videoBuffer.toString('base64'));
    assert.strictEqual(videoCall.token, 'test-token');
    assert.strictEqual(videoCall.owner, 'acme');
    assert.strictEqual(videoCall.repo, 'widgets');
    assert.strictEqual(videoCall.encoding, 'base64');

    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual(reloaded.captureScreenshots.AC1, screenshotCall.artefactPath);
    assert.strictEqual(reloaded.captureVideos.AC1, videoCall.artefactPath);
    assert.strictEqual(reloaded.captureInProgress.AC1, undefined, 'captureInProgress must be cleared for AC1 once finalised');

    assert.ok(res._body.indexOf('Capture in progress') === -1, 'must NOT still render the in-progress fragment once the capture has completed');
    assert.ok(res._body.indexOf('<img') !== -1, 'the normal completed screenshot render must appear');
    assert.ok(res._body.indexOf('<video') !== -1, 'the normal completed video render must appear');
  });
});

queue.push(function() {
  return test('AC4: handleGetPlaybackEvidence, artifact not found but still within the wait window -- renders the in-progress fragment, makes no commitArtefact call, leaves captureInProgress untouched', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');
    var dispatchedAt = new Date().toISOString();
    store.setJourneyFields(setup.journeyId, {
      captureInProgress: { AC1: { correlationId: 'corr-recent-1', dispatchedAt: dispatchedAt } }
    });

    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { throw new Error('must not be called when not found'); }
    });

    var commitCalled = false;
    artefactCommitWriter.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(commitCalled, false, 'no commitArtefact call must happen while the artifact has not been found yet');
    assert.ok(res._body.indexOf('Capture in progress') !== -1, 'the in-progress fragment must render');

    var reloaded = store.getJourney(setup.journeyId);
    assert.deepStrictEqual(reloaded.captureInProgress, { AC1: { correlationId: 'corr-recent-1', dispatchedAt: dispatchedAt } }, 'captureInProgress must be left completely untouched while still within the wait window');
    assert.strictEqual(reloaded.captureAllFailed && reloaded.captureAllFailed.AC1, undefined, 'no failure entry must be written while still within the wait window');
  });
});

queue.push(function() {
  return test('AC4: handleGetPlaybackEvidence, artifact not found past the wait window -- writes the EXACT captureAllFailed timeout shape, clears captureInProgress, renders the existing failure fragment', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');
    // 6 minutes ago -- past the 5-minute CAPTURE_WAIT_WINDOW_MS.
    var dispatchedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    store.setJourneyFields(setup.journeyId, {
      captureInProgress: { AC1: { correlationId: 'corr-timeout-1', dispatchedAt: dispatchedAt } }
    });

    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { throw new Error('must not be called when not found'); }
    });

    var commitCalled = false;
    artefactCommitWriter.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(commitCalled, false);

    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual(reloaded.captureInProgress.AC1, undefined, 'captureInProgress must be cleared once timed out');
    assert.deepStrictEqual(reloaded.captureAllFailed.AC1, { error: 'capture workflow did not complete within the expected window', retry: true }, 'must reuse the EXISTING captureAllFailed field with exactly this shape -- not a new failure field');

    assert.ok(res._body.indexOf('Capture failed') !== -1, 'the EXISTING failure-render fragment must appear, reading from journey.captureAllFailed');
    assert.ok(res._body.indexOf('Capture in progress') === -1, 'must NOT still render the in-progress fragment once timed out');
  });
});

queue.push(function() {
  return test('AC6 grouping: a capture-all-shaped captureInProgress with 2 acIds sharing ONE correlationId calls checkCaptureArtifact exactly once for that correlationId, not once per acId', async function() {
    var store = getStore();
    var slug = 'ppc-s9-finalise-group-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    var j = store.createJourney(slug);
    store.setJourneyFields(j.journeyId, { tenantId: 'tenant-a', productId: 'product-a' });
    var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|------------|----------|', '| AC1 — Shows the dashboard | Yes | screenshot |', '| AC2 — Saves a widget | Yes | screenshot |'].join('\n');
    store.setPgAdapterForTesting({
      saveJourney: async function() {},
      getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; }
    });
    store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
    store.setCaptureTarget(j.journeyId, 'AC1', 'http://x', '#a');
    store.setCaptureTarget(j.journeyId, 'AC2', 'http://y', '#b');

    var dispatchedAt = new Date().toISOString();
    store.setJourneyFields(j.journeyId, {
      captureInProgress: {
        AC1: { correlationId: 'corr-group-1', dispatchedAt: dispatchedAt },
        AC2: { correlationId: 'corr-group-1', dispatchedAt: dispatchedAt }
      }
    });

    var checkCallCount = 0;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { throw new Error('must not be called by the GET handler'); },
      checkCaptureArtifact: async function(correlationId) {
        checkCallCount++;
        assert.strictEqual(correlationId, 'corr-group-1');
        return { found: false };
      },
      downloadCaptureArtifact: async function() { throw new Error('must not be called when not found'); }
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { throw new Error('must not be called while not found'); });

    var req = makeReq('tenant-a', 'product-a', slug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(checkCallCount, 1, 'checkCaptureArtifact must be called exactly ONCE for the shared correlationId, not once per acId');

    var reloaded = store.getJourney(j.journeyId);
    assert.deepStrictEqual(reloaded.captureInProgress, {
      AC1: { correlationId: 'corr-group-1', dispatchedAt: dispatchedAt },
      AC2: { correlationId: 'corr-group-1', dispatchedAt: dispatchedAt }
    }, 'both ACs in the group must still be in progress -- still within the wait window');
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-dispatch-wiring.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
