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
  return test('captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips', async function() {
    var capVideo = require('../src/utils/capture-video');
    // Two distinct fake video paths, one per clip, assigned after newPage()
    // via a wrapper so each clip's own mock page resolves its own path.
    var pathsToReturn = ['artefacts/fx/playback/ppc-s1/video/clip1.webm', 'artefacts/fx/playback/ppc-s1/video/clip2.webm'];
    var callIndex = 0;
    var mockBrowser = {};
    mockBrowser.newContext = async function() {
      var myPath = pathsToReturn[callIndex++];
      var mockPage = {
        goto: async function() {},
        context: function() { return { addCookies: async function() {} }; },
        video: function() { return { path: async function() { return myPath; } }; }
      };
      return { newPage: async function() { return mockPage; }, close: async function() {} };
    };
    var results = await capVideo.captureVideoRecording({
      browser: mockBrowser,
      featureSlug: 'fx',
      storySlug: 'ppc-s1',
      clips: [{ name: 'AC1', run: async function(p) { await p.goto('http://x'); } }, { name: 'AC2', run: async function(p) { await p.goto('http://y'); } }]
    });
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].path, pathsToReturn[0]);
    assert.strictEqual(results[1].path, pathsToReturn[1]);
    assert.notStrictEqual(results[0].path, results[1].path, 'two different clips must produce two different, individually-correct paths');
  });
});

queue.push(function() {
  return test('captureVideoRecording_midCaptureFailure_deletesPartialFileAndRethrowsOriginalErrorEvenWhenContextCloseAlsoThrows', async function() {
    var capVideo = require('../src/utils/capture-video');
    // Mirrors tests/check-rpca-s3-video-capture-wired-for-real.js's own AC3
    // ("a mid-capture failure leaves no partial file on disk") mocking shape,
    // extended to also make context.close() throw a SECOND, unrelated error
    // during cleanup -- proving the ORIGINAL clip.run error still wins and
    // the partial file is still deleted, rather than the secondary close()
    // failure masking the original error or aborting cleanup.
    var fixtureDir = path.join(__dirname, '..', 'artefacts', 'ppc-s5-test-fixture-cleanup', 'playback', 'ppc-fixture-story', 'video');
    fs.mkdirSync(fixtureDir, { recursive: true });
    var partialVideoPath = path.join(fixtureDir, 'partial-fixture.webm');
    fs.writeFileSync(partialVideoPath, 'fake partial video bytes written by Playwright before the failure');
    var closeCallCount = 0;
    var mockPage = {
      video: function() { return { path: async function() { return partialVideoPath; } }; }
    };
    var mockContext = {
      newPage: async function() { return mockPage; },
      close: async function() {
        closeCallCount++;
        throw new Error('simulated secondary failure closing context');
      }
    };
    var mockBrowser = { newContext: async function() { return mockContext; } };
    var clip = { name: 'AC1', run: async function() { throw new Error('simulated mid-recording failure'); } };
    var threw = null;
    try {
      await capVideo.captureVideoRecording({ browser: mockBrowser, featureSlug: 'ppc-s5-test-fixture-cleanup', storySlug: 'ppc-fixture-story', clips: [clip] });
    } catch (e) { threw = e; }
    try {
      assert.ok(threw, 'expected the failure to be surfaced, not swallowed');
      assert.strictEqual(threw.message, 'simulated mid-recording failure', 'expected the ORIGINAL error to propagate unmasked, even though context.close() also threw during cleanup');
      assert.strictEqual(closeCallCount, 1, 'expected context.close() to still be attempted during cleanup');
      assert.strictEqual(fs.existsSync(partialVideoPath), false, 'expected the partial file to be deleted even though context.close() threw during cleanup');
    } finally {
      fs.rmSync(path.join(__dirname, '..', 'artefacts', 'ppc-s5-test-fixture-cleanup'), { recursive: true, force: true });
    }
  });
});

queue.push(function() {
  return test('videoCapture_midFailure_leavesNoPartialFileOnDisk', async function() {
    var capVideo = require('../src/utils/capture-video');
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-video-' + Date.now());
    var partialPath = path.join(tmpRoot, 'partial.webm');
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.writeFileSync(partialPath, 'fake partial video bytes written by Playwright before the failure');

    var mockPage = {
      goto: async function() { throw new Error('simulated mid-recording failure'); },
      context: function() { return { addCookies: async function() {} }; },
      video: function() { return { path: async function() { return partialPath; } }; }
    };
    var mockContext = { newPage: async function() { return mockPage; }, close: async function() {} };
    var mockBrowser = { newContext: async function() { return mockContext; } };

    var threw = null;
    try {
      await capVideo.captureVideoRecording({
        browser: mockBrowser,
        featureSlug: 'fx',
        storySlug: 'ppc-s1',
        clips: [{ name: 'AC1', run: async function(p) { await p.goto('http://x'); } }]
      });
    } catch (e) { threw = e; }

    assert.ok(threw, 'expected the failure to be surfaced, not swallowed');
    assert.strictEqual(threw.message, 'simulated mid-recording failure', 'expected the original error to propagate unmasked');
    assert.strictEqual(fs.existsSync(partialPath), false, 'expected the partial file to be deleted, not left behind');
  });
});

queue.push(function() {
  return test('journeyStorePg_sanitise_retainsCaptureVideosField', function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/journey-store-pg')];
    var pg = require('../src/web-ui/adapters/journey-store-pg');
    var sanitised = pg._sanitiseForTesting({ captureVideos: { AC1: 'artefacts/fx/playback/ppc-s1/video/x.webm' } });
    assert.deepStrictEqual(sanitised.captureVideos, { AC1: 'artefacts/fx/playback/ppc-s1/video/x.webm' }, 'captureVideos must survive _sanitise() or it silently vanishes after a Postgres-backed restart (fdn-s1)');
  });
});

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _json: null, _body: null, _headers: {}, json: function(b) { res._status = res._status || 200; res._json = b; }, writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); }, end: function(b) { res._body = b; } };
  res.status = function(c) { res._status = c; return res; };
  return res;
}
var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s5-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s5-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|------------|----------|', '| AC1 — Shows the dashboard | Yes | screenshot |'].join('\n');
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function makeMockPool(rows) { return { query: async function() { return { rows: rows }; } }; }

queue.push(function() {
  return test('handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-capture-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);

    var fakeVideoPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1.webm';
    var fakeVideoAbs = path.join(tmpRoot, fakeVideoPath);
    fs.mkdirSync(path.dirname(fakeVideoAbs), { recursive: true });
    fs.writeFileSync(fakeVideoAbs, Buffer.from('fake webm bytes'));

    var seenCookies = [];
    var fakePage = {
      goto: async function(url) { fakePage._gotoUrl = url; },
      screenshot: async function(opts) {
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    var fakeVideoPage = {
      goto: async function(url) { fakeVideoPage._gotoUrl = url; },
      context: function() { return { addCookies: async function(cookies) { seenCookies.push(cookies); } }; },
      video: function() { return { path: async function() { return fakeVideoPath; } }; }
    };
    var fakeContext = { newPage: async function() { return fakeVideoPage; }, close: async function() {} };
    var newContextCallCount = 0;
    var browserClosed = false;
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return {
        page: fakePage,
        browser: {
          close: async function() { browserClosed = true; },
          newContext: async function() { newContextCallCount++; return fakeContext; }
        }
      };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var mockPool = makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]);
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, mockPool);

    assert.strictEqual(res._json.ok, true);
    assert.strictEqual(newContextCallCount, 1, 'exactly one video recording context for a single-AC trigger');
    assert.ok(seenCookies.length > 0, 'the video-recording context must have its session cookie re-seeded');
    assert.strictEqual(seenCookies[0][0].value, req.sessionId, 'the re-seeded cookie must carry the SAME session id, no second/new auth path');
    var reloaded = store2.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC1, 'screenshot must still be persisted');
    assert.ok(reloaded.captureVideos && reloaded.captureVideos.AC1, 'video must also be persisted for the AC');
  });
});

queue.push(function() {
  return test('handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded', async function() {
    var store3 = getStore();
    var setup = setupDodCompleteJourney(store3, {});
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-serve-' + Date.now());
    repoRootAdapter.setRepoRoot(tmpRoot);
    var videoRelPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1.webm';
    var videoAbs = path.join(tmpRoot, videoRelPath);
    fs.mkdirSync(path.dirname(videoAbs), { recursive: true });
    fs.writeFileSync(videoAbs, Buffer.from('fake webm bytes'));
    store3.setJourneyFields(setup.journeyId, { captureVideos: { AC1: videoRelPath } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    await pe.handleGetCaptureVideo(req, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 200);
    assert.strictEqual(res._body.toString(), 'fake webm bytes');
    assert.strictEqual(res._headers['Content-Type'], 'video/webm');
  });
});

queue.push(function() {
  return test('handleGetCaptureVideo_crossTenantRequest_isDenied', async function() {
    var store4 = getStore();
    var setupA = setupDodCompleteJourney(store4, { tenantId: 'tenant-a', productId: 'product-a' });
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-cross-' + Date.now());
    repoRootAdapter.setRepoRoot(tmpRoot);
    var videoRelPath = 'artefacts/' + setupA.featureSlug + '/playback/ppc-s1/video/AC1.webm';
    store4.setJourneyFields(setupA.journeyId, { captureVideos: { AC1: videoRelPath } });

    var reqB = makeReq('tenant-b', 'product-b', setupA.featureSlug, { params: { productId: 'product-b', featureSlug: setupA.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    await pe.handleGetCaptureVideo(reqB, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 404, 'tenant B must never reach tenant A\'s video');
  });
});

queue.push(function() {
  return test('renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted', async function() {
    var store5 = getStore();
    var setup = setupDodCompleteJourney(store5, {});
    store5.setCaptureTarget(setup.journeyId, 'AC1', 'http://x', '#y');
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-render-' + Date.now());
    repoRootAdapter.setRepoRoot(tmpRoot);
    var shotRel = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png';
    store5.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: shotRel } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([]));

    assert.ok(res._body.indexOf('<img') !== -1, 'screenshot must still render');
    assert.strictEqual(res._body.indexOf('<video'), -1, 'no <video> tag when no video has been captured yet');
  });
});

queue.push(function() {
  return test('videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions', async function() {
    var store6 = getStore();
    var setup = setupDodCompleteJourney(store6, {});
    store6.setCaptureTarget(setup.journeyId, 'AC1', 'http://x', '#y');
    var videoRel = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1.webm';
    store6.setJourneyFields(setup.journeyId, { captureVideos: { AC1: videoRel } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([]));

    assert.ok(res._body.indexOf('<video') !== -1, 'video tag must render when a video exists');
    assert.ok(res._body.indexOf('preload="none"') !== -1, 'AC7: preload=none required');
    assert.ok(res._body.indexOf('poster="') !== -1, 'AC7: poster attribute required');
    assert.ok(/width="\d+"/.test(res._body) && /height="\d+"/.test(res._body), 'AC7: explicit width/height required');
  });
});

queue.push(function() {
  return test('renderEvidencePage_combinedVideo_showsAlsoCoversNoteNamingOtherAcs', async function() {
    // NOTE: does NOT use setupDodCompleteJourney() -- that helper's fixture
    // DoD content has only ONE AC row (AC1), so acs[] would only ever have
    // one entry and the "co-covered" computation (which filters acs[], not
    // journey.captureVideos' own keys) could never find a second AC to
    // name. This test needs its own 2-row DoD fixture set up inline.
    var store6b = getStore();
    var slug = 'ppc-s5-combined-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    var j = store6b.createJourney(slug);
    store6b.setJourneyFields(j.journeyId, { tenantId: 'tenant-a', productId: 'product-a' });
    var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|------------|----------|', '| AC1 — Shows the dashboard | Yes | screenshot |', '| AC2 — Saves a widget | Yes | screenshot |'].join('\n');
    store6b.setPgAdapterForTesting({
      saveJourney: async function() {},
      getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; }
    });
    store6b.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
    store6b.setCaptureTarget(j.journeyId, 'AC1', 'http://x', '#y');
    store6b.setCaptureTarget(j.journeyId, 'AC2', 'http://z', '#w');
    var videoRel = 'artefacts/' + slug + '/playback/ppc-s1/video/combined.webm';
    // Both ACs share the SAME video path -- this is what "combined" means
    // on disk: one path, multiple acId keys pointing at it.
    store6b.setJourneyFields(j.journeyId, { captureVideos: { AC1: videoRel, AC2: videoRel } });

    var req = makeReq('tenant-a', 'product-a', slug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([]));

    // Scoped per-AC check, not just a bare substring match: a substring
    // check for 'also covers' alone would still pass if the self-reference
    // guard in playback-evidence.js's coCoveredAcIds filter regressed and
    // AC1's own row named itself ("This video also covers: AC1, AC2") --
    // still contains "also covers", but wrong. Extract each AC's own <li>
    // fragment by its heading, then pull out only the also-covers
    // sentence's own text (not the rest of the fragment, which contains
    // the AC's own id again in its heading/labels) and assert the sibling
    // id is named while the AC's own id is not.
    var body = res._body;
    function fragmentFor(acId) {
      var headingIdx = body.indexOf('>' + acId + ' — ');
      assert.ok(headingIdx !== -1, 'expected a heading for ' + acId);
      var liStart = body.lastIndexOf('<li', headingIdx);
      var nextLiIdx = body.indexOf('<li', headingIdx + 1);
      var liEnd = nextLiIdx === -1 ? body.indexOf('</ul>', headingIdx) : nextLiIdx;
      return body.substring(liStart, liEnd);
    }
    function alsoCoversText(fragment) {
      var m = fragment.match(/This video also covers: ([^<]*)</);
      return m ? m[1] : null;
    }

    var ac1Fragment = fragmentFor('AC1');
    var ac2Fragment = fragmentFor('AC2');
    var ac1Also = alsoCoversText(ac1Fragment);
    var ac2Also = alsoCoversText(ac2Fragment);

    assert.ok(ac1Also !== null, 'AC1\'s fragment must contain an also-covers note');
    assert.ok(ac1Also.indexOf('AC2') !== -1, 'AC1\'s also-covers note must name its sibling AC2');
    assert.strictEqual(ac1Also.indexOf('AC1'), -1, 'AC1\'s also-covers note must not self-reference AC1');

    assert.ok(ac2Also !== null, 'AC2\'s fragment must contain an also-covers note');
    assert.ok(ac2Also.indexOf('AC1') !== -1, 'AC2\'s also-covers note must name its sibling AC1');
    assert.strictEqual(ac2Also.indexOf('AC2'), -1, 'AC2\'s also-covers note must not self-reference AC2');
  });
});

queue.push(function() {
  return test('renderEvidencePage_soloVideo_showsNoAlsoCoversNote', async function() {
    var store6c = getStore();
    var setup = setupDodCompleteJourney(store6c, {});
    store6c.setCaptureTarget(setup.journeyId, 'AC1', 'http://x', '#y');
    var videoRel = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1-only.webm';
    store6c.setJourneyFields(setup.journeyId, { captureVideos: { AC1: videoRel } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, makeMockPool([]));

    assert.strictEqual(res._body.indexOf('also covers'), -1, 'a video not shared with any other AC must show no "also covers" note');
  });
});

queue.push(function() {
  return test('handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc', async function() {
    var store7 = getStore();
    var setup = setupDodCompleteJourney(store7, {});
    store7.setCaptureTarget(setup.journeyId, 'AC1', 'http://x1', '#y1');
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-all-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    repoRootAdapter.setRepoRoot(tmpRoot);

    var fakeCombinedVideoPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/combined.webm';
    var fakeVideoAbs = path.join(tmpRoot, fakeCombinedVideoPath);
    fs.mkdirSync(path.dirname(fakeVideoAbs), { recursive: true });
    fs.writeFileSync(fakeVideoAbs, Buffer.from('fake webm bytes'));

    var fakePage = {
      goto: async function() {},
      screenshot: async function(opts) {
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    var gotoUrls = [];
    var fakeVideoPage = {
      goto: async function(url) { gotoUrls.push(url); },
      context: function() { return { addCookies: async function() {} }; },
      video: function() { return { path: async function() { return fakeCombinedVideoPath; } }; }
    };
    var newContextCallCount = 0;
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return {
        page: fakePage,
        browser: {
          close: async function() {},
          newContext: async function() { newContextCallCount++; return { newPage: async function() { return fakeVideoPage; }, close: async function() {} }; }
        }
      };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(newContextCallCount, 1, 'exactly one combined recording context for the whole run, not one per AC');
    assert.strictEqual(gotoUrls.length, 1, 'one AC in this fixture -- one navigation inside the combined recording');
    var reloaded = store7.getJourney(setup.journeyId);
    assert.ok(reloaded.captureVideos && reloaded.captureVideos.AC1, 'the combined video must be recorded against AC1');
  });
});

queue.push(function() {
  return test('handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected', async function() {
    var store7b = getStore();
    var setup = setupDodCompleteJourney(store7b, {});
    store7b.setCaptureTarget(setup.journeyId, 'AC1', 'http://x1', '#y1');
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s5-all-fail-' + Date.now());
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
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return {
        page: fakePage,
        browser: {
          close: async function() {},
          newContext: async function() { return { newPage: async function() { throw new Error('simulated combined video failure'); }, close: async function() {} }; }
        }
      };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res._json.captured.length, 1, 'the AC must still be reported captured (screenshot succeeded)');
    var reloaded = store7b.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC1, 'screenshot must survive the combined video failure');
    assert.ok(reloaded.captureAllFailed && reloaded.captureAllFailed.AC1, 'the video failure must be tracked via the existing captureAllFailed mechanism');
    assert.strictEqual((reloaded.captureVideos || {}).AC1, undefined, 'no video must be recorded for the AC when the combined recording fails');
  });
});

(async function() {
  console.log('\ncheck-ppc-s5-video-capture.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
