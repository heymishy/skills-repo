# Self-service video capture, combined across ACs where possible — Implementation Plan

> **Revised 2026-10-26, before Task 1 was executed:** combined-video redesign per the operator's own request — see `decisions.md` 2026-10-26 DESIGN entry and the story's own Background correction. Tasks 1–3, 5, 8 are unchanged. Tasks 4, 6, 7 are reworked below: video capture moves out of `_captureOneAc` into a new shared `_captureVideoForAcIds` helper, called ONCE per capture-trigger request (not once per AC), after the screenshot work completes.

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md` pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/ppc-s5`
**Worktree:** `.worktrees/ppc-s5`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-ppc-s5-video-capture.js` (this story's own file)

---

## File map

```
Create:
  src/utils/capture-video.js             — extracted, failure-hardened captureVideoRecording
  tests/check-ppc-s5-video-capture.js    — 22 unit/integration tests (test plan AC1, AC1-combined, AC2-AC7)
  tests/e2e/ppc-s5-video-lazy-load.spec.js — 2 Playwright E2E tests (AC6 console-error, AC7 eager-download/layout-shift)

Modify:
  src/web-ui/routes/playback-evidence.js — NEW shared _captureVideoForAcIds helper (combined video,
                                            not embedded in _captureOneAc, which stays unchanged);
                                            new handleGetCaptureVideo; <video> render fragment +
                                            also-covers note; handlePostCaptureAll combined-video
                                            step + all-or-nothing captureAllFailed tracking
  src/web-ui/adapters/journey-store-pg.js — add captureVideos to _sanitise()'s allowlist (fdn-s1 rule)
  src/web-ui/server.js                    — register the new video-serving route
```

---

## Task 1: Extract and harden `captureVideoRecording` into `src/`

> **✅ Complete.** Implementer commit `2e9be45f`; code-quality fix-round commit `30c2f022` (dedup `scripts/playback-capture.js`'s delegation, defensive cleanup against secondary failures, added failure-path test, removed dead mock code). Spec compliance ✅, code quality ✅ (Approved on re-review). Both tests in `tests/check-ppc-s5-video-capture.js` pass (2/2).

**Why hardened, not byte-for-byte (unlike `capture-screenshots.js`'s own extraction):** AC5 requires that a mid-capture failure leave no partial/corrupt video file behind. The original `scripts/playback-capture.js`'s `captureVideoRecording` has no try/catch at all — if `clip.run()` throws, `context.close()` never runs, so Playwright never flushes the video to disk and nothing is left to clean up anyway in THAT version; but once this story adds a `clip.run` callback that calls real navigation (`page.goto`), a throw there is a real, expected failure mode this story must handle. This version closes the context in a `finally` block (flushing whatever Playwright already wrote), then deletes the partial file if `clip.run` threw — mirroring `captureVideoForClip`'s own established cleanup half (`rpca-video-hotfix1`) without adopting its caption-generation half (`decisions.md` 2026-10-25 DESIGN entry).

**Files:**
- Create: `src/utils/capture-video.js`
- Test: `tests/check-ppc-s5-video-capture.js`

- [x] **Step 1: Write the failing test**

```js
// tests/check-ppc-s5-video-capture.js — top of file, first test block
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
    var mockBrowser = {
      newContext: async function() {
        return {
          newPage: async function() {
            return {
              _calls: [],
              goto: async function(url) { this._calls.push(url); },
              context: function() { return { addCookies: async function() {} }; },
              video: function() { return { path: async function() { return this._fakePath; }.bind(this) }; }
            };
          },
          close: async function() {}
        };
      }
    };
    // Two distinct fake video paths, one per clip, assigned after newPage()
    // via a wrapper so each clip's own mock page resolves its own path.
    var pathsToReturn = ['artefacts/fx/playback/ppc-s1/video/clip1.webm', 'artefacts/fx/playback/ppc-s1/video/clip2.webm'];
    var callIndex = 0;
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL — captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips` (`Cannot find module '../src/utils/capture-video'`)

- [x] **Step 3: Write minimal implementation**

```js
'use strict';
// capture-video.js -- extracted from scripts/playback-capture.js's own
// captureVideoRecording (ppc-s5 Task 1), because src/web-ui/routes/
// playback-evidence.js (a production route) also needs it, and scripts/ is
// never copied into the deployed Docker image (Dockerfile's own explicit
// COPY allowlist -- src/, skills/, product/, artefacts/, .github/ only).
// Mirrors the identical, already-proven fix for capture-screenshots.js
// (ppc-s1 Task 0) -- but NOT byte-for-byte unchanged, unlike that
// extraction. See AC5 and this file's own commit message for why.

const fs = require('fs');

async function captureVideoRecording({ browser, featureSlug, storySlug, clips }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const results = [];
  for (const clip of clips) {
    const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    let runErr = null;
    try {
      if (clip.run) await clip.run(page);
    } catch (err) {
      runErr = err;
    } finally {
      await context.close();
    }
    const video = page.video ? page.video() : null;
    const resultPath = video ? await video.path() : null;
    if (runErr) {
      if (resultPath && fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
      throw runErr;
    }
    results.push({ name: clip.name, path: resultPath });
  }
  return results;
}

module.exports = { captureVideoRecording };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (no existing file requires `src/utils/capture-video.js` yet, so this is additive only)

- [x] **Step 6: Commit**

```bash
git add src/utils/capture-video.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): extract captureVideoRecording into src/, add partial-file cleanup on mid-capture failure"
```

---

## Task 2: Add a second unit test for AC5's cleanup behaviour

> **✅ Complete.** Commit `31d61482`. Spec compliance ✅, code quality ✅ Approved (3 Minor, non-blocking: test naming doesn't follow the `captureVideoRecording_` prefix convention; an unused `page.context()` mock field was reintroduced; the fixture temp directory isn't cleaned up in a `finally` like the sibling test does — none fixed, accepted as Minor). Confirmed NOT redundant with Task 1's compound-failure test — this covers the baseline single-failure path, the other covers `close()` also throwing. All 3 tests in `tests/check-ppc-s5-video-capture.js` pass.

**Files:**
- Test: `tests/check-ppc-s5-video-capture.js` (append)

- [x] **Step 1: Write the failing test**

```js
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: this test should actually already PASS given Task 1's implementation — if it fails, Task 1's try/catch/finally logic has a bug. Treat a failure here as a signal to re-check Task 1's implementation, not as an expected red step.

- [x] **Step 3: Write minimal implementation**

No implementation change needed — Task 1 already added this behaviour. This step is a no-op; proceed to Step 4.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: videoCapture_midFailure_leavesNoPartialFileOnDisk`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [x] **Step 6: Commit**

```bash
git add tests/check-ppc-s5-video-capture.js
git commit -m "test(ppc-s5): add AC5 cleanup-on-failure regression test for captureVideoRecording"
```

---

## Task 3: Add `captureVideos` to `journey-store-pg.js`'s allowlist

> **✅ Complete.** Commit `27bbeb3c`. Spec compliance ✅, code quality ✅ Approved, zero findings. Comment/default-value style confirmed consistent with sibling allowlist entries (`captureScreenshots`'s map/`{}` pattern, not `captureTargets`'s array/`[]` pattern). 4/4 tests pass.

**Files:**
- Modify: `src/web-ui/adapters/journey-store-pg.js`

- [x] **Step 1: Write the failing test**

```js
// tests/check-ppc-s5-video-capture.js (append)
queue.push(function() {
  return test('journeyStorePg_sanitise_retainsCaptureVideosField', function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/journey-store-pg')];
    var pg = require('../src/web-ui/adapters/journey-store-pg');
    var sanitised = pg._sanitiseForTesting({ captureVideos: { AC1: 'artefacts/fx/playback/ppc-s1/video/x.webm' } });
    assert.deepStrictEqual(sanitised.captureVideos, { AC1: 'artefacts/fx/playback/ppc-s1/video/x.webm' }, 'captureVideos must survive _sanitise() or it silently vanishes after a Postgres-backed restart (fdn-s1)');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL — journeyStorePg_sanitise_retainsCaptureVideosField` (`sanitised.captureVideos` is `undefined`, not the expected object)

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/journey-store-pg.js`, inside `_sanitise()`, immediately after the existing `pipelineStateStorySlugs` line:

```js
    // ppc-s4: added to the allowlist per this file's own fdn-s1 rule --
    // must be listed explicitly or it silently vanishes after a
    // Postgres-backed restart. Populated only for a journey auto-provisioned
    // from pipeline-state.json's own DoD signal (no Postgres artefact rows
    // exist for it) -- lets _getDodAcList know which of the feature's
    // stories to fetch real DoD content for from GitHub.
    pipelineStateStorySlugs: journey.pipelineStateStorySlugs || null,
    // ppc-s5: added to the allowlist per this file's own fdn-s1 rule --
    // must be listed explicitly or it silently vanishes after a
    // Postgres-backed restart. Mirrors captureScreenshots exactly -- keyed
    // by acId, value is the committed video's repo-relative path.
    captureVideos: journey.captureVideos || {}
  };
```

(This replaces the existing closing `};` of the `data` object literal — the new `captureVideos` line becomes the new last property.)

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: journeyStorePg_sanitise_retainsCaptureVideosField`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/journey-store-pg.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): add captureVideos to journey-store-pg.js's fdn-s1 allowlist"
```

---

## Task 4: New shared `_captureVideoForAcIds` helper; wire it into `handlePostCaptureTrigger` (AC1, AC3)

> **✅ Complete.** Implementer commit `f9d80019`; code-quality fix-round commit `28f8426e` (removed a dead `journey.lastVideoCaptureFailure` write that was never persisted/read; fixed a cookie `secure` flag drift from `session-page-adapter.js`'s own sibling computation, without touching that file). Spec compliance ✅, code quality ✅ Approved on re-review. `_captureOneAc` confirmed byte-for-byte unchanged throughout. 5/22 tests pass; `check-ppc-s1`/`check-ppc-s2`'s own existing tests re-confirmed unaffected.

**Design note:** `_captureOneAc` stays screenshot-only, exactly as `ppc-s1`/`ppc-s2` shipped it — no signature change, no return-type change. Video capture is a SEPARATE step, run once per capture-trigger request (a group of one AC for the single-AC trigger path; multiple ACs for capture-all, see Task 7), not embedded per-AC inside `_captureOneAc`.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s5-video-capture.js` (append)

- [x] **Step 1: Write the failing test**

```js
// tests/check-ppc-s5-video-capture.js (append) -- mirrors check-ppc-s1's
// own AC3 capture test harness exactly (setupDodCompleteJourney, fakePage,
// sessionPageAdapter.setSessionPageAdapter, artefactCommitWriter).
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _json: null, _body: null, json: function(b) { res._status = res._status || 200; res._json = b; }, writeHead: function(s) { res._status = s; }, end: function(b) { res._body = b; } };
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL — handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc` (`reloaded.captureVideos` is `undefined` — no video-capture step exists yet)

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`:

1. Add the require near the other extracted-utility requires (after the `captureAcScreenshots` line):
```js
const { captureVideoRecording } = require('../../utils/capture-video');
```

2. `_captureOneAc` itself is UNCHANGED — do not modify its signature or body. Add this NEW function immediately after it:
```js
/**
 * ppc-s5 (AC1, AC1-combined, AC3): records ONE video spanning every AC in
 * acIds, in a single Playwright recording context -- a group of one for a
 * single-AC trigger, several ACs for capture-all (Task 7). Reuses the SAME
 * authenticated browser the screenshot work already obtained (AC3) -- a new
 * context created from that browser does NOT inherit the cookie seeded on
 * the original context, so the clip's own run() callback re-seeds it via
 * page.context().addCookies() before navigating to each AC's own target URL
 * in sequence. Returns the resulting video path (or null if nothing could
 * be recorded), or throws on failure -- callers decide how to track a
 * failure against each acId in the group (AC4, Task 7).
 * @param {object} journey
 * @param {string[]} acIds
 * @param {{owner:string, repo:string}} ownerRepo
 * @param {object} req
 * @param {object} browser
 * @param {string} baseUrl
 * @returns {Promise<string|null>}
 */
async function _captureVideoForAcIds(journey, acIds, ownerRepo, req, browser, baseUrl) {
  if (!browser || acIds.length === 0) return null;
  var sessionId = req.sessionId;
  var cookieDomain = new URL(baseUrl || 'https://localhost').hostname;
  var captureTargets = journey.captureTargets || [];
  var videoResults = await captureVideoRecording({
    browser: browser,
    featureSlug: journey.featureSlug,
    storySlug: 'ppc-s1',
    clips: [{
      name: acIds.join('+'),
      run: async function(videoPage) {
        await videoPage.context().addCookies([{
          name: 'session_id',
          value: sessionId,
          domain: cookieDomain,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax'
        }]);
        for (var i = 0; i < acIds.length; i++) {
          var targetState = _journeyStore.getCaptureTargetState(captureTargets, acIds[i]);
          if (targetState && targetState !== _journeyStore.CAPTURE_TARGET_NOT_SET) {
            await videoPage.goto(targetState.url);
          }
        }
      }
    }]
  });
  var videoResult = videoResults[0];
  if (!videoResult || !videoResult.path) return null;

  var repoRoot = getRepoRoot(req);
  var resolvedVideoPath = _resolveSafeShotPath(repoRoot, videoResult.path);
  if (!resolvedVideoPath) return null;
  var videoContent = fs.readFileSync(resolvedVideoPath);
  await commitArtefact(videoResult.path, videoContent.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');
  return videoResult.path;
}
```

3. Update `handlePostCaptureTrigger`'s call site -- AFTER the existing `_captureOneAc` call succeeds (do not change `_captureOneAc`'s own call signature at all):
```js
    var shotPath = await _captureOneAc(journey, acId, target, ownerRepo, req, authed.page);
    try {
      var videoPath = await _captureVideoForAcIds(journey, [acId], ownerRepo, req, authed.browser, baseUrl);
      if (videoPath) {
        var videos = journey.captureVideos || {};
        videos[acId] = videoPath;
        _journeyStore.setJourneyFields(journey.journeyId, { captureVideos: videos });
      }
    } catch (videoErr) {
      // AC4 (single-AC case, a group of one): a video failure never aborts
      // the request and never undoes the screenshot success above.
      journey.lastVideoCaptureFailure = { acIds: [acId], error: videoErr && videoErr.message };
    }
    if (_isFormSubmission(req)) {
      _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
      return;
    }
    _sendJson(res, 200, { ok: true, screenshotPath: shotPath });
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing. `_captureOneAc` itself is unchanged, so `tests/check-ppc-s1-playback-evidence-route.js`'s and `tests/check-ppc-s2-capture-all-route.js`'s existing assertions on its own return value need no changes. Their `setSessionPageAdapter` mocks return `{ page: fakePage, browser: { close: ... } }` with no `newContext` — since `_captureVideoForAcIds` is a NEW, separate call these existing tests never exercise it, so no `newContext` mock is needed there either.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): add shared _captureVideoForAcIds helper, wire into single-AC trigger (AC1, AC3)"
```

---

## Task 5: New tenant-scoped video-serving route (AC2) + `server.js` registration

> **✅ Complete.** Implementer commit `86dd3d21`; code-quality fix-round commit `c4553327` (test mock's `makeRes()` now captures response headers, so the route's one real differentiator — `Content-Type: video/webm` — is actually asserted, not just bytes/status). Spec compliance ✅, code quality ✅ Approved on re-review. Confirmed no collision between the new `/video/` route and the existing `/screenshots/` route (mutually exclusive literal path segments). 7/22 tests pass. One Minor finding (no crafted-acId test for the new route, mirroring the screenshot sibling's own such case) accepted as non-blocking — exercises already-tested shared guard logic, not new logic.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ppc-s5-video-capture.js` (append)

- [x] **Step 1: Write the failing test**

```js
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
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL` — both tests error with `pe.handleGetCaptureVideo is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, immediately after `handleGetCaptureScreenshot`'s closing `}` (line 371):

```js
/**
 * AC2 -- tenant-scoped video serving, mirroring handleGetCaptureScreenshot's
 * own existing tenant+product+ACID_RE-guarded pattern exactly. Deliberately
 * NOT a reuse of the existing untenanted /playback-media/ route.
 */
async function handleGetCaptureVideo(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) { _notFound(res); return; }

  var videos = journey.captureVideos || {};
  var videoPath = videos[acId];
  if (!videoPath) { _notFound(res); return; }

  var repoRoot = getRepoRoot(req);
  var resolvedVideoPath = _resolveSafeShotPath(repoRoot, videoPath);
  if (!resolvedVideoPath) { _notFound(res); return; }
  if (!fs.existsSync(resolvedVideoPath)) { _notFound(res); return; }

  var videoBuffer = fs.readFileSync(resolvedVideoPath);
  res.writeHead(200, { 'Content-Type': 'video/webm' });
  res.end(videoBuffer);
}
```

Add `handleGetCaptureVideo` to the `module.exports` block at the bottom of the file (alongside `handleGetCaptureScreenshot`).

In `src/web-ui/server.js`:
1. Add `handleGetCaptureVideo` to the existing destructured import at line 27:
```js
const { handleGetPlaybackEvidence, handlePostCaptureTarget, handlePostCaptureTrigger, handleGetCaptureScreenshot, handlePostCaptureAll, handleGetCaptureVideo } = require('./routes/playback-evidence'); // ppc-s1, ppc-s2, ppc-s5
```
2. Register the route immediately after the existing screenshots block (after line 3355's closing of that `else if`):
```js
  } else if (pathname.match(/^\/products\/[^/]+\/playback-evidence\/[^/]+\/video\/[^/]+$/) && req.method === 'GET') {
    // ppc-s5 (AC2) -- tenant-scoped video serving, mirroring the
    // screenshots route immediately above.
    var _peVideoParts = pathname.split('/');
    req.params = { productId: _peVideoParts[2], featureSlug: decodeURIComponent(_peVideoParts[4]), acId: decodeURIComponent(_peVideoParts[6]) };
    authGuard(req, res, async () => { await handleGetCaptureVideo(req, res, null, _pshPool); });

```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded`, `PASS: handleGetCaptureVideo_crossTenantRequest_isDenied`

- [x] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js src/web-ui/server.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): add tenant-scoped GET route for serving captured video (AC2)"
```

---

## Task 6: Render `<video>` inline with AC7 attributes; AC6 empty/no-video state; AC2 "also covers" note for shared videos

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s5-video-capture.js` (append)

- [ ] **Step 1: Write the failing test**

```js
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

    assert.ok(res._body.indexOf('also covers') !== -1, 'a shared video must show a note naming the other ACs it also covers');
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL` on the second test (`res._body.indexOf('<video')` is `-1`) — `videoPath` is never threaded into `acs` and `_renderPlaybackEvidenceHtml` never renders a `<video>` tag

- [ ] **Step 3: Write minimal implementation**

In `handleGetPlaybackEvidence`, in the `acs = acRows.map(...)` block, add `videos` lookup and a `videoPath` field:

```js
  var screenshots = journey.captureScreenshots || {};
  var videos = journey.captureVideos || {};

  var captureAllFailed = journey.captureAllFailed || {};
  var acs = acRows.map(function(ac) {
    var targetState = _journeyStore.getCaptureTargetState(captureTargets, ac.acId);
    var targetSet = targetState !== _journeyStore.CAPTURE_TARGET_NOT_SET;
    return {
      acId: ac.acId,
      description: ac.description,
      targetSet: targetSet,
      target: targetSet ? targetState : null,
      screenshotPath: screenshots[ac.acId] || null,
      videoPath: videos[ac.acId] || null,
      lastCaptureFailure: captureAllFailed[ac.acId] || null
    };
  });
  // ppc-s5 (AC2): a video shared across multiple ACs needs each AC's own
  // section to name the others -- computed here (not in the render
  // function) since it needs the full acs list, which the render function
  // only sees one row of at a time.
  acs.forEach(function(ac) {
    if (!ac.videoPath) { ac.coCoveredAcIds = []; return; }
    ac.coCoveredAcIds = acs.filter(function(other) { return other.acId !== ac.acId && other.videoPath === ac.videoPath; }).map(function(other) { return other.acId; });
  });
```

In `_renderPlaybackEvidenceHtml`'s `rows = acs.map(...)` block, add a `videoHtml` fragment (with the "also covers" note when `coCoveredAcIds` is non-empty) and include it in the `<li>` output, using a placeholder poster image path (reusing the existing screenshot as its own poster when both exist, falling back to no `poster` attribute only if no screenshot exists — but AC1 already guarantees a screenshot is always captured alongside video, so a screenshot path is always available when a video exists):

```js
    var screenshotHtml = ac.screenshotPath
      ? '<img src="' + baseUrl + '/screenshots/' + encodeURIComponent(ac.acId) + '" alt="Captured evidence for ' + _escapeHtml(ac.acId) + '" style="max-width:480px;display:block;margin-top:8px">'
      : '';
    var alsoCoversHtml = (ac.coCoveredAcIds && ac.coCoveredAcIds.length > 0)
      ? '<p>This video also covers: ' + ac.coCoveredAcIds.map(_escapeHtml).join(', ') + '</p>'
      : '';
    var videoHtml = ac.videoPath
      ? '<video controls preload="none" poster="' + baseUrl + '/screenshots/' + encodeURIComponent(ac.acId) + '" width="480" height="270" style="display:block;margin-top:8px" src="' + baseUrl + '/video/' + encodeURIComponent(ac.acId) + '">' +
          'Your browser does not support the video tag.' +
        '</video>' + alsoCoversHtml
      : '';
```

And add `videoHtml` to the returned `<li>` string, after `screenshotHtml`:
```js
      captureFormHtml +
      failureHtml +
      screenshotHtml +
      videoHtml +
    '</li>';
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted`, `PASS: videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): render <video> inline with preload=none/poster/explicit dimensions and an also-covers note for shared videos (AC2, AC6, AC7)"
```

---

## Task 7: `handlePostCaptureAll` records ONE combined video for the whole run (AC1-combined, AC4)

**Design note:** `_captureOneAc`'s own per-item call inside the existing loop is UNCHANGED (screenshot-only, as it always was). The combined video is a separate step, run ONCE after the loop finishes, still inside the SAME `try` block so the authenticated browser (closed in the existing `finally`) is still open for it.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s5-video-capture.js` (append)

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `FAIL` on both — `handlePostCaptureAll` has no combined-video step yet; `reloaded.captureVideos` is `undefined`

- [ ] **Step 3: Write minimal implementation**

In `handlePostCaptureAll`, the existing loop itself is UNCHANGED. Add the combined-video step immediately after the `for` loop, still inside the same `try` block (before its `finally`):

```js
    var captured = [];
    var failed = [];
    var startedAt = Date.now();
    try {
      for (var i = 0; i < listResult.toCapture.length; i++) {
        var item = listResult.toCapture[i];
        captureAllLock.updateProgress(journey.journeyId, i + 1);
        try {
          var shotPath = await _captureOneAc(journey, item.acId, item.target, ownerRepo, req, authed.page);
          captured.push({ acId: item.acId, screenshotPath: shotPath });
        } catch (acErr) {
          failed.push({ acId: item.acId, retry: true, error: acErr && acErr.message });
        }
      }
      // ppc-s5 (AC1-combined, AC4): ONE combined video spans every AC that
      // screenshotted successfully in this run -- recorded here, still
      // inside the authenticated browser's own lifetime (closed in the
      // existing finally block below). All-or-nothing for the group: either
      // every AC in capturedAcIds gets the SAME video path, or (on failure)
      // every one of them gets the SAME captureAllFailed entry -- never a
      // partial split within the group.
      var capturedAcIds = captured.map(function(c) { return c.acId; });
      if (capturedAcIds.length > 0) {
        try {
          var combinedVideoPath = await _captureVideoForAcIds(journey, capturedAcIds, ownerRepo, req, authed.browser, baseUrl);
          if (combinedVideoPath) {
            var videos = journey.captureVideos || {};
            capturedAcIds.forEach(function(acId) { videos[acId] = combinedVideoPath; });
            _journeyStore.setJourneyFields(journey.journeyId, { captureVideos: videos });
          }
        } catch (videoErr) {
          capturedAcIds.forEach(function(acId) {
            failed.push({ acId: acId, retry: true, error: videoErr && videoErr.message, videoOnly: true });
          });
        }
      }
    } finally {
      if (authed.browser && authed.browser.close) { await authed.browser.close(); }
    }
```

(This is the SAME `try`/`finally` structure already in `handlePostCaptureAll` — only the new block between the closing `}` of the `for` loop and the `finally` is added. The existing `captureAllFailed` consolidation code further below, which already does `failed.forEach(function(f) { captureAllFailed[f.acId] = ...; })`, needs no change — it already handles whatever `failed` contains.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s5-video-capture.js
```

Expected output: `PASS: handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc`, `PASS: handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing — **re-check `tests/check-ppc-s2-capture-all-route.js`'s own existing fixtures**: their `setSessionPageAdapter` mocks return `{ page: fakePage, browser: { close: ... } }` with no `newContext`. Since this task's new code only calls `_captureVideoForAcIds` when `capturedAcIds.length > 0` (i.e. at least one screenshot succeeded), and `_captureVideoForAcIds` itself calls `browser.newContext(...)`, any existing `ppc-s2` fixture with at least one successful screenshot will now also need a `newContext` on its mocked `browser`, or it will throw inside this new step. Add a no-op `newContext` returning a context whose `newPage()` resolves a page with `goto`, `context().addCookies()`, and `video().path()` returning `null` (consistent with "video is additive, never required" — the combined step simply records nothing useful and `combinedVideoPath` stays falsy). This is expected, bounded regression-test maintenance.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s5-video-capture.js
git commit -m "feat(ppc-s5): record one combined video per capture-all run, tracked all-or-nothing via captureAllFailed (AC1-combined, AC4)"
```

---

## Task 8: E2E tests for AC6 (no console error) and AC7 (no eager download / no layout shift)

**Files:**
- Create: `tests/e2e/ppc-s5-video-lazy-load.spec.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/e2e/ppc-s5-video-lazy-load.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

var _idCounter = 0;
function freshSessionId() {
  _idCounter++;
  return 'ps5' + Date.now().toString(16) + _idCounter.toString(16) + Math.random().toString(16).slice(2, 8);
}

async function isolatedSession(page, tenantSuffix) {
  var sessionId = freshSessionId();
  var tenantId = 'e2e-ppc-s5-' + tenantSuffix;
  var res = await page.request.get('/test/session?sessionId=' + sessionId + '&tenantId=' + tenantId);
  expect(res.status(), '/test/session seed').toBe(200);
  await page.context().addCookies([
    { name: 'session_id', value: sessionId, domain: 'localhost', path: '/', httpOnly: true, secure: false }
  ]);
  return { sessionId: sessionId, tenantId: tenantId };
}

test.describe('ppc-s5: video page-render performance', () => {
  test('page load does not eagerly download video bytes and fires no console error', async ({ page }) => {
    await isolatedSession(page, 'lazy1');
    // NOTE for the implementing agent: this test requires a seeded feature
    // with at least one captured video, consistent with this story's own
    // Dependencies (ppc-s1/ppc-s2 already DoD-complete, a video must be
    // captured via the real route first in test setup -- mirror
    // dsa-s6-mobile-responsiveness.spec.js's own createProduct() helper for
    // the product-creation half, then call the real capture-trigger route
    // once with a mocked-at-test-fixture-layer video to seed captureVideos).
    var consoleErrors = [];
    page.on('console', function(msg) { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    var videoByteRequests = [];
    page.on('request', function(req) {
      if (req.url().indexOf('/video/') !== -1 && req.resourceType() === 'media') videoByteRequests.push(req.url());
    });

    // await page.goto('/products/.../playback-evidence/...');
    // await expect(page.locator('video')).toHaveCount(1);

    expect(consoleErrors, 'no console error on page load').toEqual([]);
    expect(videoByteRequests.length, 'no video byte request before user interaction (preload=none)').toBe(0);
  });

  test('viewport narrowed does not shift surrounding element positions', async ({ page }) => {
    await isolatedSession(page, 'lazy2');
    // await page.goto('/products/.../playback-evidence/...');
    var scrollWidthBefore = await page.evaluate(() => document.body.scrollWidth);
    await page.setViewportSize({ width: 375, height: 667 });
    var scrollWidthAfter = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidthAfter, 'no horizontal overflow introduced by video elements at narrow width').toBeLessThanOrEqual(375);
  });
});
```

**Note to implementing agent:** the two `page.goto(...)` calls above are left commented because the real tenant/product/feature seeding sequence (create product, mark DoD-complete, set a capture target, trigger a real capture) must be written against the real running dev server — follow `dsa-s6-mobile-responsiveness.spec.js`'s own `createProduct()` helper exactly for the product-creation half, and `check-ppc-s5-video-capture.js`'s own Task 4/Task 6 fixtures for what a captured-video journey state looks like. Uncomment and complete these two lines as part of this task, not as a follow-up.

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/ppc-s5-video-lazy-load.spec.js
```

Expected output: tests fail or are incomplete until the `page.goto(...)` seeding sequence above is filled in — this is expected; complete it before Step 4.

- [ ] **Step 3: Write minimal implementation**

No `src/` implementation change in this task — Tasks 4-6 already implemented `preload="none"`/`poster`/explicit dimensions. This task only completes the E2E test's own seeding sequence (see note above) to exercise and confirm that existing implementation.

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/ppc-s5-video-lazy-load.spec.js
```

Expected output: both tests pass

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (Playwright E2E specs are not part of `npm test`'s own unit/integration chain per ADR-018 — run both commands separately)

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/ppc-s5-video-lazy-load.spec.js
git commit -m "test(ppc-s5): add E2E coverage for video lazy-load and no-layout-shift (AC6, AC7)"
```

---

## Final task: Full regression + AC verification walkthrough

Run the complete test plan (`node scripts/run-all-tests.js` + `npx playwright test tests/e2e/ppc-s5-video-lazy-load.spec.js`), then walk through `artefacts/2026-10-20-production-playback-capture/verification-scripts/ppc-s5-verification.md` scenario by scenario against the real running dev server before handing off to `/verify-completion`.
