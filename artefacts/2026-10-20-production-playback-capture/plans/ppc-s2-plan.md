# Extend to full-feature capture loop with timing validation — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/ppc-s2`
**Worktree:** `.worktrees/ppc-s2`
**Test command:** `npm test` (full suite; individual files runnable directly with `node tests/check-ppc-s2-....js`)

---

## Plan-time finding (not spelled out literally in the DoR/test plan — resolved here)

AC4's "a SCOPE note is logged in `decisions.md`" cannot mean a local filesystem write on the server process — this is the multi-tenant surface (ppc-s1's own `decisions.md` ARCHITECTURE entry, 2026-10-21), and `decisions.md` for a given tenant's feature lives in **that tenant's own connected GitHub repo** at `artefacts/<slug>/decisions.md`, resolved via the same `ownerRepo` already used by `commitArtefact` for screenshot evidence. The real decisions-log writer therefore does a read-append-write through the already-existing `fetchArtefact` (`adapters/artefact-fetcher.js`) + `commitArtefact` (`adapters/artefact-commit-writer.js`) adapters — satisfying the DoR's "do not build a second, parallel capture mechanism" instruction by reusing the established tenant-scoped GitHub read/write path, not inventing a new one. A failure to log the SCOPE note is caught and swallowed in the route handler — it is a secondary observability signal, not a core AC, and must never fail the capture-all run itself.

This is a plain-function-plus-setter DI seam (matches `setJourneyStoreModule`'s convention), not a new D37 throwing-stub adapter — it has a safe, self-contained real default, and the DoR's own H-ADAPTER check found no new adapter requiring a separate production-wiring AC.

---

## File map

```
Create:
  src/utils/capture-all.js                          — buildCaptureAllList, measureCaptureDuration, checkTimingThreshold (AC1, AC3, AC4, AC6)
  src/web-ui/modules/capture-all-lock.js             — in-memory per-journey concurrency lock + progress state (AC2)
  src/web-ui/adapters/decisions-log-writer.js        — injectable SCOPE-note writer; real impl reads+appends+commits via fetchArtefact/commitArtefact (AC4)
  tests/check-ppc-s2-capture-all-helpers.js          — unit tests: buildCaptureAllList, measureCaptureDuration, checkTimingThreshold, aria-live progress render
  tests/check-ppc-s2-capture-all-route.js            — integration tests: AC1, AC2, AC3, AC4, AC5, AC6, plus server.js wiring

Modify:
  src/web-ui/routes/playback-evidence.js             — extract _captureOneAc (shared with handlePostCaptureTrigger, no behaviour change), add handlePostCaptureAll + _renderCaptureAllProgress, wire progress/button into _renderPlaybackEvidenceHtml
  src/web-ui/server.js                               — mount POST .../capture-all route
  src/web-ui/adapters/journey-store-pg.js            — add captureAllDuration/captureAllCompletedAt to _sanitise()'s allowlist (fdn-s1 rule)
```

---

## Task 0: Extract `_captureOneAc` — shared single-AC capture mechanics (regression-safe refactor)

**Why first:** `handlePostCaptureAll` must reuse the exact same capture mechanics `handlePostCaptureTrigger` already uses (DoR: "do not build a second, parallel capture mechanism"), but `handlePostCaptureTrigger`'s current body inlines goto/screenshot/commit/persist directly. Extracting it first, with a pure regression check, means every later task builds on a proven-unchanged foundation.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: existing `tests/check-ppc-s1-playback-evidence-route.js` and `tests/check-ppc-s1-ui-layer.js` (no new test — this task's own test IS the full existing ppc-s1 suite staying green, since the refactor must be 100% behaviour-preserving)

- [ ] **Step 1: Confirm the regression baseline**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
node tests/check-ppc-s1-ui-layer.js
```

Expected output: `21 passed, 0 failed` and `6 passed, 0 failed` respectively (current state, before any change).

- [ ] **Step 2: Extract `_captureOneAc` and refactor `handlePostCaptureTrigger` to call it**

In `src/web-ui/routes/playback-evidence.js`, add this new function above `handlePostCaptureTrigger`:

```javascript
/**
 * ppc-s2: single-AC capture mechanics, extracted from handlePostCaptureTrigger
 * so handlePostCaptureAll (ppc-s2) can reuse the identical mechanism per AC
 * in a loop, instead of a second, parallel capture path (DoR constraint).
 * Takes an already-authenticated `page` (acquired once by the caller) rather
 * than acquiring its own -- handlePostCaptureAll acquires one authenticated
 * page for an entire capture-all run, not once per AC.
 * @param {object} journey
 * @param {string} acId
 * @param {{url:string, selector:string}} target
 * @param {{owner:string, repo:string}} ownerRepo
 * @param {object} req
 * @param {object} page
 * @returns {Promise<string>} the committed screenshot's repo-relative path
 */
async function _captureOneAc(journey, acId, target, ownerRepo, req, page) {
  await page.goto(target.url);
  var shots = await captureAcScreenshots({
    page: page,
    featureSlug: journey.featureSlug,
    storySlug: 'ppc-s1',
    acList: [{ acId: acId, selector: target.selector }]
  });
  var shot = shots[0];

  var repoRoot = getRepoRoot(req);
  // Defense in depth, in addition to (not instead of) the ACID_RE allowlist
  // at each call site -- CLAUDE.md's path traversal guard rule requires both.
  var resolvedShotPath = _resolveSafeShotPath(repoRoot, shot.path);
  if (!resolvedShotPath) {
    var invalidPathErr = new Error('invalid capture path');
    invalidPathErr.invalidPath = true;
    throw invalidPathErr;
  }
  var content = fs.readFileSync(resolvedShotPath);

  await commitArtefact(shot.path, content.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');

  var screenshots = journey.captureScreenshots || {};
  screenshots[acId] = shot.path;
  _journeyStore.setJourneyFields(journey.journeyId, { captureScreenshots: screenshots });

  return shot.path;
}
```

Then replace the body of `handlePostCaptureTrigger` (everything from `var authed = await getAuthenticatedPage(...)` to the end of its `try`/`catch`/`finally`) with:

```javascript
  var baseUrl = (req.headers && req.headers.host) ? 'https://' + req.headers.host : 'https://localhost';
  var authed = await getAuthenticatedPage(req.sessionId, baseUrl);
  try {
    var shotPath = await _captureOneAc(journey, acId, target, ownerRepo, req, authed.page);
    if (_isFormSubmission(req)) {
      _sendRedirect(res, _playbackEvidenceUrl(journey.productId, journey.featureSlug));
      return;
    }
    _sendJson(res, 200, { ok: true, screenshotPath: shotPath });
  } catch (captureErr) {
    if (captureErr && captureErr.invalidPath) {
      _sendJson(res, 400, { error: 'invalid capture path' });
      return;
    }
    _sendJson(res, 502, {
      error: 'capture-failed',
      message: 'Could not complete the capture (navigation, screenshot, or commit to the connected repository failed). Nothing was marked captured -- fix the underlying issue (re-authenticate, check repo access, or wait for a rate limit to clear) and try again.',
      detail: captureErr && captureErr.message
    });
  } finally {
    if (authed.browser && authed.browser.close) { await authed.browser.close(); }
  }
```

Export `_captureOneAc` alongside the existing exports (needed by Task 5's tests to stay honest about what's shared, and by `handlePostCaptureAll` in the same module).

- [ ] **Step 3: Run the regression baseline again — must still pass identically**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
node tests/check-ppc-s1-ui-layer.js
```

Expected output: `21 passed, 0 failed` and `6 passed, 0 failed` — byte-identical to Step 1. If anything differs, the refactor changed observable behaviour and must be fixed before proceeding.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (775 files, 0 failed baseline from `/branch-setup`).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js
git commit -m "refactor: extract _captureOneAc shared single-AC capture mechanics"
```

---

## Task 1: `buildCaptureAllList`, `measureCaptureDuration`, `checkTimingThreshold`

**Files:**
- Create: `src/utils/capture-all.js`
- Test: `tests/check-ppc-s2-capture-all-helpers.js` (new file — first 4 tests)

- [ ] **Step 1: Write the failing test**

```javascript
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

var ca = require('../src/utils/capture-all');

queue.push(function() {
  return test('buildCaptureAllList: returns only ACs with a stored target; untargeted ACs go to skipped with a named reason', function() {
    var feature = {
      acs: [{ acId: 'AC1' }, { acId: 'AC2' }, { acId: 'AC3' }, { acId: 'AC4' }],
      captureTargets: [
        { acId: 'AC1', url: 'http://x/1', selector: '#a' },
        { acId: 'AC2', url: 'http://x/2', selector: '#b' },
        { acId: 'AC3', url: 'http://x/3', selector: '#c' }
      ]
    };
    var result = ca.buildCaptureAllList(feature);
    assert.strictEqual(result.toCapture.length, 3);
    assert.deepStrictEqual(result.toCapture.map(function(t) { return t.acId; }), ['AC1', 'AC2', 'AC3']);
    assert.deepStrictEqual(result.toCapture[0].target, { url: 'http://x/1', selector: '#a' });
    assert.strictEqual(result.skipped.length, 1);
    assert.deepStrictEqual(result.skipped[0], { acId: 'AC4', reason: 'no capture target set' });
  });
});

queue.push(function() {
  return test('measureCaptureDuration: returns the exact elapsed milliseconds between two timestamps', function() {
    assert.strictEqual(ca.measureCaptureDuration(1000, 4500), 3500);
  });
});

queue.push(function() {
  return test('checkTimingThreshold: a 65000ms duration exceeds the threshold without failing the run', function() {
    assert.deepStrictEqual(ca.checkTimingThreshold(65000), { exceedsThreshold: true });
  });
});

queue.push(function() {
  return test('checkTimingThreshold: exactly 60000ms does NOT trigger the flag (strictly greater-than 60s)', function() {
    assert.deepStrictEqual(ca.checkTimingThreshold(60000), { exceedsThreshold: false });
  });
});

(async function() {
  console.log('\ncheck-ppc-s2-capture-all-helpers.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `FAIL` — `Cannot find module '../src/utils/capture-all'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
// capture-all.js (ppc-s2) -- pure helpers for the capture-all loop. No
// store/adapter access, so every function here is unit-testable with plain
// fixtures, independent of journey-store or Postgres.

/**
 * ppc-s2 (AC1, AC6) -- splits a feature's DoD AC list into captureable
 * (has a stored target) and skipped (no target, named reason) groups.
 * @param {{acs: Array<{acId:string}>, captureTargets: Array<{acId:string,url:string,selector:string}>}} feature
 * @returns {{toCapture: Array<{acId:string, target:{url:string,selector:string}}>, skipped: Array<{acId:string, reason:string}>}}
 */
function buildCaptureAllList(feature) {
  var acs = (feature && feature.acs) || [];
  var targets = (feature && feature.captureTargets) || [];
  var toCapture = [];
  var skipped = [];
  acs.forEach(function(ac) {
    var target = targets.find(function(t) { return t.acId === ac.acId; });
    if (target) {
      toCapture.push({ acId: ac.acId, target: { url: target.url, selector: target.selector } });
    } else {
      skipped.push({ acId: ac.acId, reason: 'no capture target set' });
    }
  });
  return { toCapture: toCapture, skipped: skipped };
}

/**
 * ppc-s2 (AC3) -- real elapsed milliseconds between two timestamps (e.g.
 * Date.now() values). The route handler is responsible for sourcing real
 * wall-clock values; this is pure arithmetic so its own test stays decoupled
 * from actual timing.
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function measureCaptureDuration(start, end) {
  return end - start;
}

var TIMING_THRESHOLD_MS = 60000;

/**
 * ppc-s2 (AC4) -- strictly greater-than 60s (discovery.md's own named
 * trigger condition). Exactly 60000ms does not trigger the flag.
 * @param {number} durationMs
 * @returns {{exceedsThreshold: boolean}}
 */
function checkTimingThreshold(durationMs) {
  return { exceedsThreshold: durationMs > TIMING_THRESHOLD_MS };
}

module.exports = { buildCaptureAllList, measureCaptureDuration, checkTimingThreshold, TIMING_THRESHOLD_MS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/utils/capture-all.js tests/check-ppc-s2-capture-all-helpers.js
git commit -m "feat: add buildCaptureAllList, measureCaptureDuration, checkTimingThreshold"
```

---

## Task 2: Concurrency lock — `capture-all-lock.js`

**Files:**
- Create: `src/web-ui/modules/capture-all-lock.js`
- Test: `tests/check-ppc-s2-capture-all-helpers.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ppc-s2-capture-all-helpers.js` (after the `require('../src/utils/capture-all')` tests, before the IIFE runner):

```javascript
var lock = require('../src/web-ui/modules/capture-all-lock');

queue.push(function() {
  return test('capture-all-lock: a second acquire for the same journeyId is rejected while the first is held', function() {
    lock._clearForTesting();
    assert.strictEqual(lock.tryAcquireLock('journey-a'), true);
    assert.strictEqual(lock.tryAcquireLock('journey-a'), false, 'a second concurrent acquire for the same journey must be rejected');
    assert.strictEqual(lock.tryAcquireLock('journey-b'), true, 'a different journey must be unaffected');
    lock.releaseLock('journey-a');
    assert.strictEqual(lock.tryAcquireLock('journey-a'), true, 'after release, a new acquire must succeed');
  });
});

queue.push(function() {
  return test('capture-all-lock: setTotal/updateProgress/getLockState reflect current progress', function() {
    lock._clearForTesting();
    lock.tryAcquireLock('journey-c');
    lock.setTotal('journey-c', 8);
    lock.updateProgress('journey-c', 3);
    assert.deepStrictEqual(
      Object.assign({}, lock.getLockState('journey-c')),
      Object.assign({}, lock.getLockState('journey-c'), { current: 3, total: 8 })
    );
    assert.strictEqual(lock.getLockState('journey-c').current, 3);
    assert.strictEqual(lock.getLockState('journey-c').total, 8);
    assert.strictEqual(lock.getLockState('journey-missing'), null, 'an unlocked journey returns null, never throws');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `FAIL` — `Cannot find module '../src/web-ui/modules/capture-all-lock'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
// capture-all-lock.js (ppc-s2, AC2) -- in-memory, per-process concurrency
// lock + progress state for one feature's capture-all run. Deliberately
// NOT a durable table -- ppc-s2-dor-contract.md's own Assumptions section:
// "the run completes synchronously within one request/response cycle," so
// there is no cross-process or cross-restart durability requirement for
// this run-scoped state.

var _locks = new Map(); // journeyId -> { current: number, total: number, startedAt: number }

/**
 * @param {string} journeyId
 * @returns {boolean} true if the lock was acquired, false if already held
 */
function tryAcquireLock(journeyId) {
  if (_locks.has(journeyId)) return false;
  _locks.set(journeyId, { current: 0, total: 0, startedAt: Date.now() });
  return true;
}

function setTotal(journeyId, total) {
  var lockState = _locks.get(journeyId);
  if (lockState) lockState.total = total;
}

function updateProgress(journeyId, current) {
  var lockState = _locks.get(journeyId);
  if (lockState) lockState.current = current;
}

function releaseLock(journeyId) {
  _locks.delete(journeyId);
}

/**
 * @param {string} journeyId
 * @returns {{current:number, total:number, startedAt:number}|null}
 */
function getLockState(journeyId) {
  return _locks.get(journeyId) || null;
}

/** Test helper -- reset all lock state between tests. */
function _clearForTesting() { _locks.clear(); }

module.exports = { tryAcquireLock, setTotal, updateProgress, releaseLock, getLockState, _clearForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/capture-all-lock.js tests/check-ppc-s2-capture-all-helpers.js
git commit -m "feat: add in-memory per-journey capture-all concurrency lock"
```

---

## Task 3: `_renderCaptureAllProgress` — aria-live progress markup

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s2-capture-all-helpers.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ppc-s2-capture-all-helpers.js`:

```javascript
var pe = require('../src/web-ui/routes/playback-evidence');

queue.push(function() {
  return test('NFR-Accessibility: progress status markup includes an aria-live="polite" region', function() {
    var html = pe._renderCaptureAllProgress({ current: 3, total: 8 });
    assert.ok(html.indexOf('aria-live="polite"') !== -1, 'must expose progress to assistive technology, not purely visual');
    assert.ok(html.indexOf('3') !== -1 && html.indexOf('8') !== -1, 'must show the actual current/total counts');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `FAIL` — `pe._renderCaptureAllProgress is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add this function near `_renderPlaybackEvidenceHtml`:

```javascript
/**
 * ppc-s2 (NFR-Accessibility) -- pure function, directly unit-testable
 * against a progress-state fixture with no store/adapter access. "polite"
 * (not "assertive") -- a running capture-all loop is a low-urgency status
 * update, not an interrupting alert.
 * @param {{current:number, total:number}} progress
 * @returns {string}
 */
function _renderCaptureAllProgress(progress) {
  var current = (progress && progress.current) || 0;
  var total = (progress && progress.total) || 0;
  return '<p role="status" aria-live="polite">Capturing AC ' + current + ' of ' + total + '</p>';
}
```

Then update `_renderPlaybackEvidenceHtml`'s signature and body to accept and use it:

```javascript
function _renderPlaybackEvidenceHtml(journey, acs, csrfToken, captureAllProgress) {
  var baseUrl = _playbackEvidenceUrl(journey.productId, journey.featureSlug);
  var progressHtml = captureAllProgress ? _renderCaptureAllProgress(captureAllProgress) : '';
  var captureAllFormHtml = captureAllProgress
    ? ''
    : '<form method="POST" action="' + baseUrl + '/capture-all">' +
        _csrf.csrfField(csrfToken) +
        '<button type="submit">Capture all evidence</button>' +
      '</form>';
  var rows = acs.map(function(ac) {
    // ... unchanged from ppc-s1 ...
  }).join('');
  return '<!DOCTYPE html><html><head><title>Playback evidence — ' + _escapeHtml(journey.featureSlug) + '</title></head><body>' +
    '<h1>' + _escapeHtml(journey.featureSlug) + '</h1>' +
    progressHtml +
    captureAllFormHtml +
    '<ul style="list-style:none;padding:0">' + rows + '</ul>' +
  '</body></html>';
}
```

(The `acs.map(...)` body itself is unchanged from `ppc-s1` — only the function signature and the wrapping return statement change.)

Export `_renderCaptureAllProgress` alongside the existing module exports.

Update `handleGetPlaybackEvidence` to pass the current lock state through:

```javascript
  if (_wantsHtml(req)) {
    var csrfToken = await _csrf.generateCsrfToken(req);
    var progress = captureAllLock.getLockState(journey.journeyId);
    var html = _renderPlaybackEvidenceHtml(journey, acs, csrfToken, progress);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
```

(`captureAllLock` is required at the top of the file — see Task 5, which adds that require alongside the other new ones. If executing tasks in order, add `var captureAllLock = require('../modules/capture-all-lock');` now.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-helpers.js
```

Expected output: `7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing — including `check-ppc-s1-ui-layer.js`'s existing substring assertions (`<form`, `Capture target not set`, `<img`), which remain true of the additive markup.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s2-capture-all-helpers.js
git commit -m "feat: render an aria-live capture-all progress region and trigger button"
```

---

## Task 4: `decisions-log-writer.js` — SCOPE-note writer (AC4)

**Files:**
- Create: `src/web-ui/adapters/decisions-log-writer.js`
- Test: `tests/check-ppc-s2-capture-all-route.js` (new file — first tests)

- [ ] **Step 1: Write the failing test**

```javascript
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
    var putBody = null;
    global.fetch = async function(url, opts) {
      if (String(url).endsWith('/user')) {
        return { ok: true, json: async function() { return { name: 'Test User', login: 'testuser' }; } };
      }
      if (String(url).indexOf('/contents/artefacts/test-feature/decisions.md') !== -1 && (!opts || opts.method !== 'PUT')) {
        // GET existing file -- has prior content.
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
    }
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `FAIL` — `Cannot find module '../src/web-ui/adapters/decisions-log-writer'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';
// decisions-log-writer.js (ppc-s2, AC4) -- appends a SCOPE note to a
// tenant's own decisions.md when a capture-all run exceeds discovery.md's
// named 60s synchronous-capture threshold. Reuses the existing
// fetchArtefact/commitArtefact adapters (the same tenant-scoped GitHub
// Contents API mechanism already used for DoD screenshot evidence) rather
// than a local filesystem write, which would target the WRONG repo
// entirely on this multi-tenant surface -- decisions.md for a given
// tenant's feature lives in THAT tenant's connected repo
// (artefacts/<slug>/decisions.md), not this skills-repo's own.
//
// Plain function + setter DI (matches setJourneyStoreModule's convention),
// not a D37 throwing-stub adapter -- this has a safe, self-contained real
// default and no DoR AC requires separate production wiring (ppc-s2-dor
// H-ADAPTER: N/A).

var { fetchArtefact, ArtefactNotFoundError } = require('./artefact-fetcher');
var { commitArtefact } = require('./artefact-commit-writer');

function _buildScopeNoteEntry(payload) {
  var dateStr = new Date().toISOString().slice(0, 10);
  var seconds = (payload.durationMs / 1000).toFixed(1);
  return '\n**' + dateStr + ' | SCOPE | Capture-all run for `' + payload.featureSlug + '` exceeded the 60s synchronous-capture threshold**\n' +
    '**Finding:** A capture-all run measured ' + seconds + 's of real elapsed wall-clock time, exceeding `discovery.md`\'s own 60-second named trigger condition for revisiting the synchronous-capture decision.\n' +
    '**Decision:** Not made here -- this is an automatically-logged SCOPE note, not a decision. Capture remains synchronous per `ppc-s2`\'s own Architecture Constraints until a human revisits this.\n' +
    '**Rationale:** `discovery.md`\'s own trigger-mechanics decision named this exact condition as the point to re-open the async-vs-sync question, rather than silently absorbing a slow run as "done."\n' +
    '**Made by:** Automated (ppc-s2 capture-all route), logged for human follow-up.\n' +
    '**Revisit trigger:** A human should review whether async capture is now warranted for this feature.\n' +
    '\n---\n';
}

/**
 * @param {{featureSlug:string}} journey
 * @param {{owner:string, repo:string}} ownerRepo
 * @param {string} token - req.session.accessToken
 * @param {{featureSlug:string, durationMs:number}} payload
 */
async function realAppendScopeNote(journey, ownerRepo, token, payload) {
  var decisionsPath = 'artefacts/' + journey.featureSlug + '/decisions.md';
  var existingContent;
  try {
    existingContent = await fetchArtefact(journey.featureSlug, 'decisions', token, ownerRepo);
  } catch (err) {
    if (!(err instanceof ArtefactNotFoundError)) throw err;
    existingContent = '# Decisions: ' + journey.featureSlug + '\n\n---\n';
  }
  var newContent = existingContent + _buildScopeNoteEntry(payload);
  await commitArtefact(decisionsPath, newContent, token, ownerRepo.owner, ownerRepo.repo);
}

var _writer = realAppendScopeNote;
function setDecisionsLogWriter(fn) { _writer = fn; }
function appendScopeNote(journey, ownerRepo, token, payload) { return _writer(journey, ownerRepo, token, payload); }
function _resetDecisionsLogWriter() { _writer = realAppendScopeNote; }

module.exports = { appendScopeNote, setDecisionsLogWriter, realAppendScopeNote, _resetDecisionsLogWriter, _buildScopeNoteEntry };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/decisions-log-writer.js tests/check-ppc-s2-capture-all-route.js
git commit -m "feat: add decisions-log-writer for capture-all timing-threshold SCOPE notes"
```

---

## Task 5: `handlePostCaptureAll` route handler (AC1, AC2, AC3, AC5, AC6)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s2-capture-all-route.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ppc-s2-capture-all-route.js` (before the IIFE runner), reusing this repo's own established mocking conventions (`makeReq`/`makeRes`/`setupDodCompleteJourney`/`makeMockPool` — copied verbatim from `tests/check-ppc-s1-playback-evidence-route.js`, since this is this codebase's own established pattern for this exact route file, not a new one):

```javascript
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
    var realMeasure = require('../src/utils/capture-all').measureCaptureDuration;
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
  return test('server.js source mounts the capture-all route', function() {
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/handlePostCaptureAll/.test(serverSrc), 'capture-all route must be mounted');
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `FAIL` — `pe.handlePostCaptureAll is not a function` (and the server-wiring test fails until Task 7)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add these requires near the top (alongside the existing ones):

```javascript
var { buildCaptureAllList, measureCaptureDuration, checkTimingThreshold } = require('../../utils/capture-all');
var captureAllLock = require('../modules/capture-all-lock');
var decisionsLogWriter = require('../adapters/decisions-log-writer');
```

Add the handler:

```javascript
/**
 * AC1, AC2, AC3, AC4, AC5, AC6 -- sequential capture across every AC that
 * already has a stored target, reusing _captureOneAc per AC (the same
 * session-reuse mechanism ppc-s1 established, not a second parallel
 * capture path). One authenticated page is acquired for the whole run --
 * re-authenticating per AC would multiply Playwright startup cost for no
 * benefit, since the same session is reused for every AC in one run.
 */
async function handlePostCaptureAll(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  if (!captureAllLock.tryAcquireLock(journey.journeyId)) {
    _sendJson(res, 409, { error: 'capture-all already in progress for this feature' });
    return;
  }

  try {
    var acRows = await _getDodAcList(journey);
    var listResult = buildCaptureAllList({ acs: acRows, captureTargets: journey.captureTargets || [] });
    captureAllLock.setTotal(journey.journeyId, listResult.toCapture.length);

    if (listResult.toCapture.length === 0) {
      _sendJson(res, 200, { captured: [], failed: [], skipped: listResult.skipped, durationMs: 0, exceedsTimingThreshold: false });
      return;
    }

    var ownerRepo = await _resolveOwnerRepo(journey, pool);
    if (!ownerRepo) {
      _sendJson(res, 400, { error: 'product has no connected repo' });
      return;
    }

    var baseUrl = (req.headers && req.headers.host) ? 'https://' + req.headers.host : 'https://localhost';
    var authed = await getAuthenticatedPage(req.sessionId, baseUrl);

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
    } finally {
      if (authed.browser && authed.browser.close) { await authed.browser.close(); }
    }

    var durationMs = measureCaptureDuration(startedAt, Date.now());
    _journeyStore.setJourneyFields(journey.journeyId, { captureAllDuration: durationMs, captureAllCompletedAt: new Date().toISOString() });

    var thresholdResult = checkTimingThreshold(durationMs);
    if (thresholdResult.exceedsThreshold) {
      try {
        await decisionsLogWriter.appendScopeNote(journey, ownerRepo, req.session.accessToken, { featureSlug: journey.featureSlug, durationMs: durationMs });
      } catch (logErr) {
        // Best-effort -- a failure to log the SCOPE note must never fail
        // the capture-all run itself; the real evidence below is already computed.
        console.error('[playback-evidence] decisions-log-writer failed:', logErr && logErr.message);
      }
    }

    _sendJson(res, 200, {
      captured: captured,
      failed: failed,
      skipped: listResult.skipped,
      durationMs: durationMs,
      exceedsTimingThreshold: thresholdResult.exceedsThreshold
    });
  } finally {
    captureAllLock.releaseLock(journey.journeyId);
  }
}
```

Add `handlePostCaptureAll` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `9 passed, 1 failed` (the server-wiring test fails until Task 7 mounts the route — expected at this point)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all previously-passing tests still passing; the new server-wiring test fails as expected (addressed in Task 7).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s2-capture-all-route.js
git commit -m "feat: add handlePostCaptureAll sequential capture-all loop"
```

---

## Task 6: Durability — `journey-store-pg.js` `_sanitise()` allowlist (fdn-s1 rule)

**Files:**
- Modify: `src/web-ui/adapters/journey-store-pg.js`
- Test: `tests/check-ppc-s2-capture-all-route.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ppc-s2-capture-all-route.js`:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `FAIL` — `pgAdapter._sanitiseForTesting is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/journey-store-pg.js`, extend `_sanitise()`:

```javascript
function _sanitise(journey) {
  const data = {
    completedStages:    journey.completedStages    || [],
    sessions:           journey.sessions            || {},
    activeSkill:        journey.activeSkill         || null,
    activeSessionId:    journey.activeSessionId     || null,
    mode:               journey.mode                || 'feature',
    complete:           journey.complete            || false,
    completedAt:        journey.completedAt         || null,
    stories:            journey.stories             || [],
    storyList:          journey.storyList           || null,
    currentStoryIndex:  journey.currentStoryIndex   || 0,
    productProfile:     journey.productProfile      || 'default',
    displayName:        journey.displayName         || null,
    flaggedStages:      journey.flaggedStages        || [],
    captureTargets:     journey.captureTargets      || [],
    captureScreenshots: journey.captureScreenshots  || {},
    // ppc-s2: added to the allowlist per this file's own fdn-s1 rule --
    // must be listed explicitly or it silently vanishes after a
    // Postgres-backed restart.
    captureAllDuration:     journey.captureAllDuration     || null,
    captureAllCompletedAt:  journey.captureAllCompletedAt  || null
  };
  // Defensive: strip accessToken from any nested value (should never be there, but guard anyway)
  delete data.accessToken;
  return data;
}
```

Export a test-only alias at the bottom of the module (next to the existing exports):

```javascript
module.exports = {
  // ... existing exports unchanged ...
  _sanitiseForTesting: _sanitise
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `10 passed, 1 failed` (server-wiring still pending)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all previously-passing tests still passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/journey-store-pg.js tests/check-ppc-s2-capture-all-route.js
git commit -m "fix: add captureAllDuration/captureAllCompletedAt to journey-store-pg sanitise allowlist"
```

---

## Task 7: Mount the route in `server.js`

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ppc-s2-capture-all-route.js` (the server-wiring test from Task 5 now resolves)

- [ ] **Step 1: Confirm the pending failure**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `10 passed, 1 failed` — `server.js source mounts the capture-all route` is the one failure.

- [ ] **Step 2: Wire the route**

In `src/web-ui/server.js`, update the existing `playback-evidence` require line to also pull in the new handler:

```javascript
const { handleGetPlaybackEvidence, handlePostCaptureTarget, handlePostCaptureTrigger, handleGetCaptureScreenshot, handlePostCaptureAll } = require('./routes/playback-evidence'); // ppc-s1, ppc-s2
```

Add a new route branch immediately after the existing `capture/:acId` branch (before the `screenshots/:acId` branch):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/playback-evidence\/[^/]+\/capture-all$/) && req.method === 'POST') {
    // ppc-s2 (AC1, AC2) -- handlePostCaptureAll does its own CSRF check
    // internally; see note on the targets/capture routes above.
    var _peCaptureAllParts = pathname.split('/');
    req.params = { productId: _peCaptureAllParts[2], featureSlug: decodeURIComponent(_peCaptureAllParts[4]) };
    authGuard(req, res, async () => { await handlePostCaptureAll(req, res, null, _pshPool); });

```

(This regex is mutually exclusive with the existing `/capture/[^/]+$` route — `capture-all` is a distinct literal path segment, not `capture` followed by `/`.)

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-ppc-s2-capture-all-route.js
```

Expected output: `11 passed, 0 failed`

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: mount POST .../playback-evidence/:slug/capture-all route"
```

---

## Execution notes

- Tasks 0–7 are intended to run in this exact order — Task 0 is a pure refactor every later task depends on; Tasks 1–4 are independent pure/adapter units that could in principle be parallelised across subagents, but Task 3 modifies the same file as Task 0/5 (`playback-evidence.js`), so sequential execution avoids merge friction within a single branch.
- No task introduces an async job queue, rate limiting, video capture, or ffmpeg polish — all explicitly out of scope per the DoR contract.
- The real-world capture-all timing number (AC3's actual purpose) will only be known once this runs against a real tenant feature — the integration test in Task 5 only proves the measurement *mechanism* is real (an actual `Date.now()`-sourced value), not what real-world durations look like. This mirrors `ppc-s1`'s own test-plan caveat (`ppc-s2-test-plan.md`'s "Test Gaps and Risks" row) and should be revisited at `/definition-of-done`.
